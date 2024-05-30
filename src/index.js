// @ts-check
import config from 'config'
import log from 'loglevel'

import './logger.js'
import {
  aTemplate,
  clearDnsRecords,
  getDnsRecords,
  getDomains,
  getNextPriority,
  mxTemplate,
  saveApiCallHistory,
  loadApiCallHistory,
  uploadNewDnsRecords,
} from './cf.js'
import { getUniqueSubdomains, sleep } from './util.js'
import { generateConfigFile } from './writers.js'

await loadApiCallHistory()
const zones = await getDomains()

for (let i = 0; i < zones.length; i++) {
  const zone = zones[i]
  log.info(`[${zone.name}] starting`)

  const dns = await getDnsRecords(zone)
  if (config.get('clearOldDns')) {
    await clearDnsRecords(zone, dns)
  }

  const subDomains = getUniqueSubdomains(config.get('clearOldDns') ? [] : dns)
  log.info(`[${zone.name}] generated ${subDomains.length} subdomains`)

  const cfDnsRecords = []
  cfDnsRecords.push(';; A Records')
  for (let i = 0; i < subDomains.length; i++) {
    cfDnsRecords.push(aTemplate(subDomains[i], zone.name))
  }
  cfDnsRecords.push('\n')

  cfDnsRecords.push(';; MX Records')
  for (let i = 0; i < subDomains.length; i++) {
    cfDnsRecords.push(
      mxTemplate(
        subDomains[i],
        zone.name,
        config.get('clearOldDns') ? i : getNextPriority()
      )
    )
  }

  await uploadNewDnsRecords(zone, cfDnsRecords.join('\n'))
  await generateConfigFile(zone)

  if (i !== zones.length - 1) {
    log.info(`[${zone.name}] waiting for 5s to avoid rate limiting`)
    await sleep(5)
  }
  log.info(`[${zone.name}] done`)
}

await saveApiCallHistory()
