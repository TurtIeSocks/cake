// @ts-check
import log from 'loglevel'

import '../services/logger.js'
import {
  getDomains,
  saveApiCallHistory,
  loadApiCallHistory,
  addCfEmailRecords,
} from '../services/cf.js'

export async function mailer() {
  await loadApiCallHistory()
  const zones = await getDomains()

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i]
    log.info(`[${zone.name}] starting`)
    await addCfEmailRecords(zone)
    log.info(`[${zone.name}] done`)
  }

  await saveApiCallHistory()
}
