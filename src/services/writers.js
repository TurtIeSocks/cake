import fs from 'fs'
import path from 'path'

import { getDnsRecords } from './cf.js'

const DEST = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../../',
  'data'
)

/**
 * Writes a file to the data directory
 * @param {string} fileName
 * @param {string} data
 */
export const writeFile = async (fileName, data) => {
  await fs.promises.writeFile(path.join(DEST, fileName), data)
}

/**
 * Generates the .yml config file based on the current DNS records
 * @param {import('cloudflare/resources/zones/zones.mjs').Zone} zone
 */
export const generateConfigFile = async (zone) => {
  const kkConfig = []
  const newRecords = await getDnsRecords(zone, 'A')
  for (const record of newRecords) {
    kkConfig.push(`  - domain_name: ${record.name}`)
  }
  await writeFile(`${zone.name}-kk.yml`, `domains:\n${kkConfig.join('\n')}`)
}
