// @ts-check
import { mapDomains, resetEmailRouting } from '../services/cf.js'

export async function mailer() {
  await mapDomains(resetEmailRouting)
}
