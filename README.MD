<h1 align="center">Welcome to aero-ts 👋</h1>
<div align="center">
  <a href="https://www.npmjs.com/package/aero-ts" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/aero-ts.svg">
  </a>
  <a href="https://github.com/rotvproHD/AERO-TS#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/rotvproHD/AERO-TS/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://socket.dev/npm/package/aero-ts" target="_blank">
    <img alt="Socket Badge" src="https://socket.dev/api/badge/npm/package/aero-ts" />
  </a>

  Easy and Lightweight Way to create an Advanced Web Server in Node.js
</div>

### 🏠 [Homepage](https://github.com/rotvproHD/AERO-TS#readme)

## Install

using npm
```sh
npm i aero-ts
```

using yarn
```sh
yarn add aero-ts
```

using pnpm
```sh
pnpm add aero-ts
```

## Features
- Compression Support
- Multithreading Support
- Websocket Support (soon)
- Middleware Support (soon)
- HTTPS Support
- Async Support

## Usage

Initialize Server
```js
/**
 * NOTE:
 * This Project is not finished at all and
 * may not be a good idea to use right now.
*/

import aero from "aero-ts"
// or
const aero = require("aero-ts")


const server = new aero.Server({
  port: 3000,
  bind: '0.0.0.0',
  debug: true
  threadding: {
    available: 2,
    automatic: false,
    sync: 20000
  }
})

server.routes
  .add('GET', '/', (ctx) => {
    ctx.print('Hello! Im running on the aero-ts beta...')
  })
  .prefix('/api')
    .add('GET', '/', (ctx) => {
      ctx.print('You are currently on /api even though the method says / because of the Prefix')
    })
    .prefix('/v2')
      .add('GET', '/', (ctx) => {
        ctx.print('This is the v2 Homepage')
      })

server.start()
```

## Author

👤 **0x4096**

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check out the [issues](https://github.com/rotvproHD/AERO-TS/issues). 

## Show your support

Give a Star if this project helped you!

## 📝 License

Copyright © 2023 [0x4096](https://github.com/rotvproHD).<br />
This project is MIT licensed.
