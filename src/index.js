import { generate } from './modules/generate.js'
import { update } from './modules/update.js'

const command = process.argv[2]

switch (command) {
  case 'update':
    update()
    break

  default:
    generate()
    break
}
