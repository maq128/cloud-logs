const redis = require('redis')

/**
 * 一个基于 redis 的日志记录工具。
 */
class RedisLogger {
  /**
   * 获取 logger 实例。
   * @param {String} name logger 的名字，即 redis 中的 list 的 key，缺省为 logs
   * @param {String} url redis 的连接地址，如为空则尝试使用 uniCloud.redis()，失败则回落为 redis://localhost:6379
   */
  static getLogger(name = 'logs', url = '') {
    if (!RedisLogger._singletons) {
      RedisLogger._singletons = {}
    }
    if (!RedisLogger._singletons[name]) {
      RedisLogger._singletons[name] = new RedisLogger(name, url)
    }
    return RedisLogger._singletons[name]
  }

  /**
   * 获取一个 logger 实例并代理到指定的对象，一般用于接管 console 的 log/warn/error。
   * @param {Object} target 代理对象，一般应该传入 console
   * @param {String} name logger 的名字，即 redis 中的 list 的 key
   * @param {String} url redis 的连接地址，如为空则尝试使用 uniCloud.redis()，失败则回落为 redis://localhost:6379
   */
  static delegateLogger(target = console, name, url) {
    let logger = RedisLogger.getLogger(name, url)
    target.log = (...args) => { logger.log(...args) }
    target.warn = (...args) => { logger.warn(...args) }
    target.error = (...args) => { logger.error(...args) }
  }

  constructor(name, url) {
    this.name = name
    this.url = url
    this.clientPromise = null
  }

  log(...args) {
    this.writeOut('INFO', ...args)
  }

  warn(...args) {
    this.writeOut('WARN', ...args)
  }

  error(...args) {
    this.writeOut('ERROR', ...args)
  }

  async writeOut(category, ...args) {
    let client = await this.getRedisClient(this.url).catch(e => null)

    if (client) {
      const stringifiedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return JSON.stringify(arg, null, 2)
        } else {
          return String(arg)
        }
      })
      let msg = this.getCurrentTimeFormatted() + ` [${category}] ` + stringifiedArgs.join(' ')

      await client.rPush(this.name, msg).catch(e => null)
      await client.expire(this.name, 60).catch(e => null)
      // await client.disconnect().catch(err => null)
    }
  }

  async getRedisClient(url) {
    if (!this.clientPromise) {
      if (url) {
        this.clientPromise = redis.createClient({
          url,
          socket: {
            reconnectStrategy: false
          }
        }).on('error', (error) => {
          console.error('无法连接到 redis:', url)
        }).connect().catch(err => null)
      } else {
        let redis
        try {
          redis = uniCloud.redis()
        } catch(e) {
          redis = this.getRedisClient('redis://localhost:6379')
        }
        this.clientPromise = redis
      }
    }
    return this.clientPromise
  }

  getCurrentTimeFormatted() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
  }
}

module.exports = RedisLogger
