import { IncomingMessage, ServerResponse } from "http"
import generateRequestContext from "./generateRequestContext"
import { HttpRequestContext } from "../../interfaces/requestContext"
import InternalContext from "../../interfaces/internalContext"
import Route from "../../interfaces/route"

export interface Props {
  rqx: InternalContext
  req: IncomingMessage
  res: ServerResponse
}

export interface Return {
  found: boolean
  route: Route | null
  ctx: HttpRequestContext
}

export default function handleRoute({ rqx, req, res }: Props): Return {
  let route = process.routes.static[req.method + rqx.url.path]

  if (route) return { found: true, route, ctx: generateRequestContext({ rqx, req, res, params: {} }) }
  else {
    const actualUrl = rqx.url.path.split('/')
    let params = {}

    for (const routeKey in process.routes.param) {
      if (!routeKey.startsWith(req.method)) continue
      const route = process.routes.param[routeKey]

      const pathArray = routeKey.split('/')
      let routeExists = false

      if (pathArray.length !== actualUrl.length) continue
      for (let partNumber = 0; partNumber <= pathArray.length - 1; partNumber++) {
        const urlParam = pathArray[partNumber]
        const reqParam = actualUrl[partNumber]

        if (!/^<.*>$/.test(urlParam) && reqParam !== urlParam) break
        else if (urlParam === reqParam) continue
        else if (/^<.*>$/.test(urlParam)) {
          params[urlParam.substring(1, urlParam.length - 1)] = reqParam
          routeExists = true

          continue
        }
      }; if (routeExists) {
        process.send({ type: 'route::cache', path: rqx.url.pathname, data: { route, params }})
        return { found: true, route, ctx: generateRequestContext({  rqx, req, res, params }) }
      }
    }

    return { found: false, route: null, ctx: generateRequestContext({ rqx, req, res, params: {} }) }
  }
}