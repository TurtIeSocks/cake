// @ts-check
import config from 'config'
import log from 'loglevel'

import {
  aTemplate,
  clearDnsRecords,
  getDnsRecords,
  getNextPriority,
  mapDomains,
  mxTemplate,
  uploadNewDnsRecords,
} from '../services/cf.js'
import { getUniqueSubdomains, sleep } from '../services/util.js'
import { generateConfigFile } from '../services/writers.js'

export async function generate() {
  await mapDomains(async (zone, i, zones) => {
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
  })
}
