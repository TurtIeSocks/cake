// @ts-check
process.env.FORCE_COLOR = '3'

import log from 'loglevel'
import chalk from 'chalk'
import config from 'config'

const SYMBOLS = /** @type {const} */ ({
  trace: '☰',
  debug: '☯',
  info: 'ℹ',
  warn: '⚠',
  error: '✖',
})

const COLORS = /** @type {const} */ ({
  trace: chalk.gray,
  debug: chalk.green,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
})

log.setLevel(config.get('logging.level'))

const originalFactory  = log.methodFactory

/** @type {typeof log['methodFactory']} */
log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName)
  return (...args) => {
    rawMethod(
      COLORS[methodName](
        SYMBOLS[methodName] ?? '',
        new Date().toISOString().split('.')[0].split('T').join(' '),
        ...args
      )
    )
  }
}

log.rebuild()

log.info('[startup] logger initialized')
