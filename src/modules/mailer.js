// @ts-check
import { disableEmailRouting, mapDomains, resetEmailRouting } from '../services/cf.js'

export async function mailer() {
  await mapDomains(resetEmailRouting)
}

export async function disableMailer() {
  await mapDomains(disableEmailRouting)
}