// @ts-check
import Cloudflare from 'cloudflare'
import config from 'config'
import log from 'loglevel'

import './logger.js'

const cloudflare = new Cloudflare({
  // apiEmail: config.get('cloudflare.email'),
  apiToken: config.get('cloudflare.token'),
})

/**
 * Fetches a maximum of 1000 domains from Cloudflare
 * @returns {Promise<import('cloudflare/resources/zones/zones.mjs').Zone[]>}
 */
export const getDomains = async () => {
  try {
    log.info('[startup] fetching domains')
    const domains = await cloudflare.zones.list({ per_page: 1000 })
    log.info(`[startup] fetched ${domains.result.length} domains`)
    return domains.result
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
    log.info(`[${zone.name}] fetching dns records`)
    const dns = await cloudflare.dns.records.list({
      zone_id: zone.id,
      per_page: 1000,
      type,
    })
    log.info(`[${zone.name}] fetched ${dns.result.length} records`)
    return dns.result
  } catch (e) {
    log.error(`[${zone.name}]`, e)
    return []
  }
}

/**
 * Deletes all DNS records for a given zone/domain
 * @param {import('cloudflare/resources/zones/zones.mjs').Zone} zone
 * @param {import('cloudflare/resources/dns/dns.mjs').DNS.Records.Record[]} records
 */
export const clearDnsRecords = async (zone, records) => {
  try {
    log.info(`[${zone.name}] deleting ${records.length} records`)
    await Promise.allSettled(
      records.map(
        (record) =>
          record.id &&
          cloudflare.dns.records.delete(record.id, { zone_id: zone.id })
      )
    )
  } catch (e) {
    log.error(`[${zone.name}]`, e)
  }
}

/**
 * Uploads new DNS records to a given zone/domain
 * @param {import('cloudflare/resources/zones/zones.mjs').Zone} zone
 * @param {string} file
 */
export const uploadNewDnsRecords = async (zone, file) => {
  try {
    log.info(`[${zone.name}] uploading new dns records`)
    await cloudflare.dns.records.import({
      file,
      zone_id: zone.id,
    })
  } catch (e) {
    log.error(`[${zone.name}]`, e)
  }
}

/**
 * Generates an A record template
 * @param {string} sub
 * @param {string} domain
 * @returns {string}
 */
export const aTemplate = (sub, domain) =>
  `${sub}.${domain}.\t1\tIN\tA\t${config.get('dns.ip')}`

/**
 * Generates a MX record template
 * @param {string} sub
 * @param {string} domain
 * @param {number} i
 * @returns
 */
export const mxTemplate = (sub, domain, i) =>
  `${sub}.${domain}.\t1\tIN\tMX\t${i} ${sub}.${domain}.`
