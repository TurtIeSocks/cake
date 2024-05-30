// @ts-check
import fs from 'fs'
import path from 'path'
import { generate } from 'random-words'
import config from 'config'

import { getDnsRecords } from './cf.js'

const DEST = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  '../',
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
 * Generates a list of unique subdomains
 * @param {import('cloudflare').Cloudflare.DNS.Records.Record[]} oldRecords
 * @returns
 */
export const getUniqueSubdomains = (oldRecords) => {
  const existing = new Set(oldRecords.map((r) => r.name))
  const sub = generate(config.get('dns.count') * 5)
  const seen = new Set()
  const cleaned = (Array.isArray(sub) ? sub : [sub]).filter((s) => {
    if (seen.has(s) || existing.has(s)) {
      return false
    }
    seen.add(s)
    return true
  })
  if (cleaned.length > config.get('dns.count')) {
    cleaned.length = config.get('dns.count')
  }
  return cleaned
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
