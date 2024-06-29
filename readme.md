# 项目说明

uniCloud 开发的项目，云函数输出到 console 的日志信息被云服务系统收集后，可以在云服务 web 控制台查看。
但控制台提供的查询和列示功能并不一定适合所有的工作场景。

有时候为了排查一个特殊的问题，会临时修改一下云函数，上传后观察其运行过程，但是其输出的日志很难被单独识别出来供集中检视。

本项目提供了一种独立的日志输出方案，能够收集到完整的日志记录，方便开发者的云端调试。

**本方案仅适用于上述的临时调测场景，并不适用于常规的日志记录。**

# 实现方案

本方案需要一个额外的 redis 服务作为日志的收集器，这个 redis 需要在云函数中能够访问，也需要在开发者的开发环境中能够访问。

云函数需要输出日志的时候，调用相关接口将日志写入 redis 里的一个指定的 list 中，并设置有效期为 60 秒。

开发者在自己的开发环境中以命令行方式运行一个日志接收程序，以阻塞方式读取 redis 里面相应的 list，然后输出到控制台。

# 使用方法

## 云端

- 把公共模块 `redis-logger` 部署到云空间

- 在需要生成日志的地方：

```js
const RedisLogger = require('redis-logger')
const LOGGER_NAME = 'logs'
const REDIS_URL = 'redis://localhost:6379'

let logger = RedisLogger.getLogger(LOGGER_NAME, REDIS_URL)
logger.log(new Date())
logger.warn(new Date())
logger.error(new Date())

// 或者

RedisLogger.delegateLogger(console, LOGGER_NAME, REDIS_URL)
console.log(new Date())
console.warn(new Date())
console.error(new Date())
```

## 接收端

```sh
cd receiver
npm install
node index.js

# 或者

node index.js -n logs -u redis://localhost:6379
```
