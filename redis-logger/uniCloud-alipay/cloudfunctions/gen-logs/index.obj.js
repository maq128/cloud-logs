const RedisLogger = require('redis-logger')

const LOGGER_NAME = 'logs'
const REDIS_URL = 'redis://localhost:6379'

async function genLogs() {

  // let logger = RedisLogger.getLogger(LOGGER_NAME, REDIS_URL)
  // logger.log(new Date())
  // logger.warn(new Date())
  // logger.error(new Date())

  RedisLogger.delegateLogger(console, LOGGER_NAME, REDIS_URL)
  console.log(new Date())
  console.warn(new Date())
  console.error(new Date())

  return true
}

module.exports = {
	genLogs,
}

// https://env-00jxgaqjui4q.dev-hz.cloudbasefunction.cn/http/gen/genLogs
