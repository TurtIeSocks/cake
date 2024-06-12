import { generate } from './modules/generate.js'
import { update } from './modules/update.js'
import { mailer } from './modules/mailer.js'

const command = process.argv[2]

switch (command) {
  case 'update':
    update()
    break
  case 'mailer':
    mailer()
    break
  default:
    generate()
    break
}
