// @ts-check
import { generate } from 'random-words'
import config from 'config'

/**
 * Generates a list of unique subdomains
 * @param {import('cloudflare').Cloudflare.DNS.Records.Record[]} oldRecords
 * @returns {string[]}
 */
export const getUniqueSubdomains = (oldRecords) => {
  const existing = new Set(oldRecords.map((r) => r.name.split('.', 1)[0]))
  const sub = generate(config.get('subdomainCount') * 5)
  const seen = new Set()
  const cleaned = (Array.isArray(sub) ? sub : [sub]).filter((s) => {
    if (seen.has(s) || existing.has(s)) {
      return false
    }
    seen.add(s)
    return true
  })
  if (cleaned.length > config.get('subdomainCount')) {
    cleaned.length = config.get('subdomainCount')
  }
  return cleaned
}

/**
 * Sleeps for a given amount of seconds
 * @param {number} s
 */
export const sleep = (s) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000))
