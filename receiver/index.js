// 导入redis模块
const redis = require('redis');

let url = 'redis://localhost:6379'
let loggerName = 'logs'

async function receiveLogs() {
  let args = process.argv.slice(2)
  let arg
  while (arg = args.shift()) {
    if (arg === '-u' || arg === '--url') {
      url = args.shift()
    } else if (arg === '-n' || arg === '--name') {
      loggerName = args.shift()
    } else {
      console.error('unknown option:', arg)
      return
    }
  }

  let client = await redis.createClient({
    url,
    socket: {
      reconnectStrategy: false
    }
  }).on('error', (error) => {
    console.error('无法连接到 redis:', url)
  }).connect().catch(err => null)
  
  while (client) {
    let { key, element } = await client.blPop(loggerName, 0)
    console.log(element)
  }
}

receiveLogs()

console.log(`监听 Redis 的 ${loggerName} 列表...`);
