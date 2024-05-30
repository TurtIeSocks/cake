// @ts-check
import config from 'config'
import log from 'loglevel'

import './logger.js'
import {
  aTemplate,
  clearDnsRecords,
  getDnsRecords,
  getDomains,
  mxTemplate,
  uploadNewDnsRecords,
} from './cf.js'
import { generateConfigFile, getUniqueSubdomains } from './util.js'

const zones = await getDomains()

for (const domain of config.get('domains')) {
  log.info(`[${domain}] starting`)
  const zone = zones.find((zone) => zone.name === domain)
  if (!zone) {
    log.warn(`[${domain}] zone not found`)
    continue
  }
  log.info(`[${domain}] found`)
  const dns = await getDnsRecords(zone)
  if (config.get('dns.clearOld')) {
    await clearDnsRecords(zone, dns)
  }
  const cfDnsRecords = []

  const sub = getUniqueSubdomains(config.get('dns.clearOld') ? [] : dns)
  log.info(`[${domain}] generated ${sub.length} subdomains`)

  cfDnsRecords.push(';; A Records')
  for (let i = 0; i < sub.length; i++) {
    cfDnsRecords.push(aTemplate(sub[i], domain))
  }
  cfDnsRecords.push('\n')

  cfDnsRecords.push(';; MX Records')
  const currentPriorities = new Set(
    dns
      .map((record) => (record.type === 'MX' ? record.priority : -1))
      .filter((record) => record !== -1)
  )
  const getNextPriority = () => {
    let nextPriority = 1
    while (currentPriorities.has(nextPriority)) {
      nextPriority++
    }
    currentPriorities.add(nextPriority)
    return nextPriority
  }
  for (let i = 0; i < sub.length; i++) {
    cfDnsRecords.push(
      mxTemplate(
        sub[i],
        domain,
        config.get('dns.clearOld') ? i : getNextPriority()
      )
    )
  }

  await uploadNewDnsRecords(zone, cfDnsRecords.join('\n'))
  await generateConfigFile(zone)

  log.info(`[${domain}] waiting for 5s to avoid rate limiting`)
  await new Promise((resolve) => setTimeout(resolve, 5000))
  log.info(`[${domain}] done`)
}
