import cluster from "cluster"
import https from "https"
import http from "http"
import fs from "fs"

import { Options } from "../classes/serverOptions"
import { Stats, Routes } from "../classes/httpServer"

declare global {
  namespace NodeJS {
    interface Process {
      stats: Stats
      options: Options
      routes: Routes
    }
  }
}

import handleHttpRequest from "./functions/handleHttpRequest"
import handleWsRequest from "./functions/handleWsRequest"

let server: http.Server

process.on('message', (infos: any) => {
  switch (infos.type) {
    case "start":
      process.options = infos.data.options
      Object.keys(infos.data.routes).forEach((routeType) => {
        Object.keys(infos.data.routes[routeType]).forEach((route) => {
          infos.data.routes[routeType][route] = {
            ...infos.data.routes[routeType][route],
            run: eval(infos.data.routes[routeType][route].run)
          }
        })
      })

      process.routes = infos.data.routes

      // Set HTTP(s) Server Options
      let httpOptions = {}
      let key: Buffer, cert: Buffer
      if (process.options.https.enabled) {
        try {
          key = fs.readFileSync(process.options.https.keyFile)
          cert = fs.readFileSync(process.options.https.certFile)
        } catch (e) {
          throw new Error(`Cant access your HTTPS Key or Cert file! (${process.options.https.keyFile} / ${process.options.https.certFile})`)
        }; httpOptions = { key, cert }
      }

      // Start Server
      server = (process.options.https.enabled ? https as any : http as any).createServer(httpOptions)

      server.on('request', (req, res) => handleHttpRequest({ req, res }))
      server.on('upgrade', (req, soc, head) => handleWsRequest({ req, soc, head }))

      server.listen(process.options.port, process.options.bind)
      if (process.options.debug) console.log(`Thread ${cluster.worker.id} (${process.pid}): Recieved start event`)
      break

    case "sync":
      process.stats = infos.data.stats
      process.options = infos.data.options
      Object.keys(infos.data.routes).forEach((routeType) => {
        Object.keys(infos.data.routes[routeType]).forEach((route) => {
          infos.data.routes[routeType][route] = {
            ...infos.data.routes[routeType][route],
            run: eval(infos.data.routes[routeType][route].run)
          }
        })
      })

      if (process.options.debug) console.log(`Thread ${cluster.worker.id} (${process.pid}): Recieved sync event`)
      process.routes = infos.data.routes
      break

    case "kill":
      if (process.options.debug) console.log(`Thread ${cluster.worker.id} (${process.pid}): Recieved kill event`)

      process.exit(0)
  }
})