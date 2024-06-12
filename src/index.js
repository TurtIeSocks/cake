import './services/logger.js'
import { generate } from './modules/generate.js'
import { update } from './modules/update.js'
import { mailer } from './modules/mailer.js'

const command = process.argv[2]

await loadApiCallHistory()

switch (command) {
  case 'update':
    await update()
    break
  case 'mailer':
    await mailer()
    break
  default:
    await generate()
    break
}

await saveApiCallHistory()
