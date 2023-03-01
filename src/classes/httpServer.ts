import cluster from "cluster"

import ServerOptions, { Options } from "./serverOptions"
import Route from "../interfaces/route"
import Router from "./router"
import generateRequestContext from "../functions/generateRequestContext"
import handleErrorResponse from "../functions/handleErrorResponse"

export interface Cache {
  routes: Record<string, { route: number, params: Record<string, string> }>
}

export interface Stats {
  requests: number,
  network: {
    in: number
    out: number
  }
}

export interface Routes {
  static: Record<string, Route>
  special: Record<string, Route>
  param: Record<string, Route>
}

export default class HttpServer {
  private serializedRoutes: Routes
  public routes: Routes
  public options: Options
  public cached: Cache
  public stats: Stats
  public router: Router

  constructor(
    /** The Options */ options?: Options
  ) {
    this.routes = {
      static: {},
      param: {},
      special: {},
    }; this.serializedRoutes = {
      static: {},
      param: {},
      special: {}
    }; this.cached = {
      routes: {}
    }; this.stats = {
      requests: 0,
      network: {
        in: 0, out: 0
      }
    }

    this.router = new Router()
    this.options = new ServerOptions(options ?? {}).getOptions()

    if (this.options.debug) setInterval(() => {
      console.log(`Managing ${Object.keys(cluster.workers).length} Threads: ${Array.from(Object.values(cluster.workers)).map((worker) => worker.process.pid).join(', ')}...`)
      console.log(`Cached Data for ${Object.keys(cluster.workers).length} Threads: ${JSON.stringify(this.cached)}`)
      console.log(`Stats for ${Object.keys(cluster.workers).length} Threads: ${JSON.stringify(this.stats)}`)
    }, 5000)
    setInterval(() => {
      if (this.options.debug) console.log(`Syncing Data for ${Object.keys(cluster.workers).length} Threads: ${Array.from(Object.values(cluster.workers)).map((worker) => worker.process.pid).join(', ')}...`)
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'sync', data: { stats: this.stats, options: this.options, routes: this.serializedRoutes } })
      }
    }, this.options.threading.sync)
  }

  async start() {
    if (cluster.isPrimary) {
      cluster.setupPrimary({ 
        exec: __dirname + '/../workers/http'
      })

      this.routes = this.router.getRoutes()
      Object.keys(this.routes).forEach((routeType) => {
        Object.keys(this.routes[routeType]).forEach((route) => {
          this.serializedRoutes[routeType][route] = {
            ...this.routes[routeType][route],
            run: this.routes[routeType][route].run.toString()
          }
        })
      })

      for (let index = 0; index < this.options.threading.available; index++) {
        cluster.fork()
          .on('message', (data) => this.handleWorkerMessage(data))
          .send({ type: 'start', data: { options: this.options, routes: this.serializedRoutes } })
      }

      cluster.on('exit', (worker, code, signal) => {
        if (this.options.debug) console.log(`Thread ${worker.id} (${worker.process.pid}) exited with code ${code}! (${signal})`)
        if (code !== 0) cluster.fork().on('message', (data) => this.handleWorkerMessage(data))
      })
    }
  }

  async restart() {
    await this.stop()

    return this.start()
  }

  async stop() {
    for (const id in cluster.workers) {
      cluster.workers[id].send({ type: 'kill' })
    }
  }


  private async handleWorkerMessage(infos: any) {
    switch (infos.type) {
      case "threads::new":
        if (this.options.threading.maximum > Object.keys(cluster.workers).length) cluster
          .fork()
          .on('message', (data) => this.handleWorkerMessage(data))
          .send({ type: 'start', data: { options: this.options, routes: this.serializedRoutes } })
        else console.log(`Maximum Active Threads reached! (${Object.keys(cluster.workers).length} / ${this.options.threading.maximum})`)
        break

      case "request::create":
        const ctx = generateRequestContext({ ...infos.data, stats: this.stats })
        try {
          if (infos.found) await Promise.resolve(this.routes[infos.routeType][infos.route].run(ctx))
          else await handleErrorResponse({ htx: this, rqx: infos.data.rqx, ctx, code: 404 })
        } catch (err) {
          await handleErrorResponse({ htx: this, rqx: infos.data.rqx, ctx, code: 500, err })
        }

        cluster.workers[infos.worker].send({ type: 'response', data: { rqx: infos.data.rqx } })

      case "route::cache":
        this.cached.routes[infos.path] = infos.data
        break

      case "stats::all":
        this.stats.requests += infos.data.requests
        this.stats.network.in += infos.data.network.in
        this.stats.network.out += infos.data.network.out
        break
    }
  }
}