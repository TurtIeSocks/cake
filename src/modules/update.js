// @ts-check
import log from 'loglevel'

import '../services/logger.js'
import {
  getDomains,
  saveApiCallHistory,
  loadApiCallHistory,
  updateDnsRecordIp,
} from '../services/cf.js'

export async function update() {
  await loadApiCallHistory()
  const zones = await getDomains()

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i]
    log.info(`[${zone.name}] starting`)
    await updateDnsRecordIp(zone)
    log.info(`[${zone.name}] done`)
  }

  await saveApiCallHistory()
}
