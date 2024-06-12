// @ts-check
import log from 'loglevel'

import { getDomains, addCfEmailRecords } from '../services/cf.js'

export async function mailer() {
  const zones = await getDomains()

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i]
    log.info(`[${zone.name}] starting`)
    await addCfEmailRecords(zone)
    log.info(`[${zone.name}] done`)
  }
}
