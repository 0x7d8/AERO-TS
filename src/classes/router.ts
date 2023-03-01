import { RequestMethod } from "../interfaces/route"
import { Routes } from "./httpServer"
import parsePath from "../functions/parsePath"
import { HttpRequestContext } from "../interfaces/requestContext"

export interface RouterData {
  /** The Prefix to have the Router available on */ prefix: string
  /** The Subrouters this Router contains */ subRouters: Router[]
}

export default class Router {
  private routes: Routes
  private data: RouterData

  /**
   * Construct a new Router
   * @since 0.1.0
  */ constructor(
    /** The Prefix to make this Router available on */ prefix?: string
  ) {
    this.data = {
      prefix: parsePath(prefix || '/'),
      subRouters: []
    }

    this.routes = {
      static: {},
      param: {},
      special: {}
    }
  }

  /**
   * Add a Route to the router
   * @since 0.1.0
  */ add(
    /** The Request Method to use */ method: RequestMethod,
    /** The Path of the Route */ path: string,
    /** The Code to run on the Request */ run: (ctx: HttpRequestContext) => Promise<unknown> | unknown
  ) {
    path = this.data.prefix + parsePath(path, true)

    // Check if Route contains Parameters
    let storePart: 'static' | 'param' = 'static'
    for (const part of path.split('/')) {
      if (!/^<.*>$/.test(part)) continue

      storePart = 'param'
      break
    }

    // Store Route
    this.routes[storePart][method + path] = {
      method,
      run
    }; return this
  }

  /**
   * Add a Subrouter with prefix
   * @since 0.1.0
  */ prefix(
    /** The Prefix to add */ prefix: string,
  ) {
    const index = this.data.subRouters.push(new Router(this.data.prefix + prefix))
    return this.data.subRouters[index - 1]
  }


  /**
   * Get the Routers Routes
   * @ignore This is for Internal use only
   * @since 0.1.0
  */ getRoutes() {
    for (const router of this.data.subRouters) {
      const routes = router.getRoutes()

      this.routes.static = { ...this.routes.static, ...routes.static }
      this.routes.param = { ...this.routes.param, ...routes.param }
    }

    return this.routes
  }
}