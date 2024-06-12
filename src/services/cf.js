// @ts-check
import Cloudflare from 'cloudflare'
import { fetch } from 'cloudflare/_shims/index.mjs'
import config from 'config'
import log from 'loglevel'
import fs from 'fs'
import path from 'path'

import { sleep } from './util.js'

const CHUNK_SIZE = 50
const API_CALL_LIMIT = 1200
const DEST = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../.cache/history.json'
)

/** @type {number[]} */
const callHistory = []
/** @type {Set<number>} */
const currentPriorities = new Set()

const cloudflare = new Cloudflare({
  apiToken: config.get('apiToken'),
  fetch: async function (url, init) {
    if (callHistory.length >= API_CALL_LIMIT) {
      log.info('reached API call limit, waiting for 5 minutes')
      await sleep(300)
      callHistory.length = 0
    }
    log.debug(`[CF] fetching ${url}`)
    const response = await fetch(url, init)
    callHistory.push(Date.now())
    return response
  },
})

/**
 * Fetches domains from Cloudflare
 * @returns {Promise<import('cloudflare/resources/zones/zones.mjs').Zone[]>}
 */
export const getDomains = async () => {
  try {
    log.info('[startup] fetching domains')

    /** @type {import('cloudflare/resources/zones/zones.mjs').Zone[]} */
    const domains = []
    for await (const zoneResp of cloudflare.zones.list()) {
      domains.push(zoneResp)
    }

    log.info(`[startup] fetched ${domains.length} domains`)
    const configDomains = config.get('domains')
    return domains.filter((zone) => configDomains.includes(zone.name))
  } catch (e) {
    log.error('[startup]', e)
    return []
  }
}

/**
 * Fetches DNS records for a given zone/domain
 * @param {import('cloudflare/resources/zones/zones.mjs').Zone} zone
 * @param {import('cloudflare/resources/dns/records.mjs').RecordListParams['type']} [type]
 * @returns {Promise<import('cloudflare/resources/dns/dns.mjs').DNS.Records.Record[]>}
 */
export const getDnsRecords = async (zone, type) => {
  try {
    currentPriorities.clear()
    log.info(`[${zone.name}] fetching dns records`)

    /** @type {import('cloudflare/resources/dns/dns.mjs').DNS.Records.Record[]} */
    const dns = []
    for await (const dnsResp of cloudflare.dns.records.list({
      zone_id: zone.id,
      type,
    })) {
      dns.push(dnsResp)
      if (dnsResp.type === 'MX') {
        currentPriorities.add(dnsResp.priority)
      }
    }

    log.info(`[${zone.name}] fetched ${dns.length} DNS records`)
    return dns
  } catch (e) {
    log.error(`[${zone.name}]`, e)
    return []
  }
}

/**
 * Deletes all DNS records for a given zone/domain
 * @param {import('cloudflare/resources/zones/zones.mjs').Zone} zone
 * @param {import('cloudflare/resources/dns/dns.mjs').DNS.Records.Record[]} records
 * @returns {Promise<null | Error>}
 */
export const clearDnsRecords = async (zone, records) => {
  try {
    log.info(`[${zone.name}] deleting ${records.length} DNS records`)
    await Promise.allSettled(
      records.map(
        (record) =>
          record.id &&
          cloudflare.dns.records.delete(record.id, { zone_id: zone.id })
      )
    )
    return null
  } catch (e) {
    log.error(`[${zone.name}]`, e)
    return e
  }
}

/**
 * Uploads new DNS records to a given zone/domain
 * @param {import('cloudflare/resources/zones/zones.mjs').Zone} zone
 * @param {string} file
 * @returns {Promise<null | Error>}
 */
export const uploadNewDnsRecords = async (zone, file) => {
  try {
    log.info(`[${zone.name}] uploading new dns records`)
    await cloudflare.dns.records.import({
      file,
      zone_id: zone.id,
    })
    return null
  } catch (e) {
    log.error(`[${zone.name}]`, e)
    return e
  }
}

/**
 * Generates an A record template
 * @param {string} sub
 * @param {string} domain
 * @returns {string}
 */
export const aTemplate = (sub, domain) =>
  `${sub}.${domain}.\t1\tIN\tA\t${config.get('dnsIpv4Address')}`

/**
 * Generates a MX record template
 * @param {string} sub
 * @param {string} domain
 * @param {number} i
 * @returns
 */
export const mxTemplate = (sub, domain, i) =>
  `${sub}.${domain}.\t1\tIN\tMX\t${i} ${sub}.${domain}.`

/**
 * Gets the next available priority
 * @returns {number}
 */
export const getNextPriority = () => {
  let nextPriority = 1
  while (currentPriorities.has(nextPriority)) {
    nextPriority++
  }
  currentPriorities.add(nextPriority)
  return nextPriority
}

/**
 * Loads the API call history from disk
 */
export const loadApiCallHistory = async () => {
  try {
    if (fs.existsSync(DEST)) {
      const data = await fs.promises.readFile(DEST, 'utf-8')
      const now = Date.now()

      /** @type {number[]} */
      const parsed = JSON.parse(data)

      parsed.forEach((timestamp) => {
        const diff = now - timestamp
        if (diff < 300_000) {
          callHistory.push(timestamp)
        }
      })
    }
    log.info(`[startup] set api call history (${callHistory.length} calls)`)
  } catch (e) {
    log.error(e)
  }
}

/**
 * Saves the API call history to disk
 */
export const saveApiCallHistory = async () => {
  try {
    await fs.promises.writeFile(DEST, JSON.stringify(callHistory), 'utf-8')
    log.info(`[shutdown] saved api call history (${callHistory.length} calls)`)
  } catch (e) {
    log.error(e)
  }
}

/**
 * Updates the IP address for all A records in a given zone/domain and sets proxied to true
 * @param {import('cloudflare/resources/zones/zones.mjs').Zone} zone
 */
export const updateDnsRecordIp = async (zone) => {
  const records = await getDnsRecords(zone, 'A')
  const ip = config.get('dnsIpv4Address') || ''
  await Promise.allSettled(
    records.map(async (record) => {
      if (record.id && record.type === 'A') {
        await cloudflare.dns.records.update(record.id, {
          zone_id: zone.id,
          type: record.type,
          name: record.name,
          content: ip,
          ttl: record.ttl,
          proxied: true,
        })
      }
    })
  )
}

/**
 * @param {import('cloudflare/resources/zones/zones.mjs').Zone} zone
 */
export const addCfEmailRecords = async (zone) => {
  await cloudflare.dns.records.create({
    content: `"v=spf1 include:_spf.mx.cloudflare.net ~all"`,
    name: '*',
    type: 'TXT',
    zone_id: zone.id,
  })
  await cloudflare.dns.records.create({
    content: zone.name,
    name: '*',
    type: 'MX',
    priority: 5,
    zone_id: zone.id,
  })
  const records = await getDnsRecords(zone, 'MX')
  for (let i = 1; i <= 3; i++) {
    const pre = `route${i}`
    const existing = records.find((r) => typeof r.content === 'string' && r.content?.startsWith(pre))
    await cloudflare.dns.records.create({
      content: `${pre}.mx.cloudflare.net`,
      name: '*',
      type: 'MX',
      priority: existing?.type === 'MX' ? existing.priority : i,
      zone_id: zone.id,
    })
  }
}
