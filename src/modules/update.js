// @ts-check
import log from 'loglevel'

import { getDomains, updateDnsRecordIp } from '../services/cf.js'

export async function update() {
  const zones = await getDomains()

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i]
    log.info(`[${zone.name}] starting`)
    await updateDnsRecordIp(zone)
    log.info(`[${zone.name}] done`)
  }
}
