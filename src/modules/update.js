// @ts-check
import { mapDomains, updateDnsRecordIp } from '../services/cf.js'

export async function update() {
  await mapDomains(updateDnsRecordIp)
}
