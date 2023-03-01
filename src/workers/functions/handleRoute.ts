import { IncomingMessage } from "http"
import InternalContext from "../../interfaces/internalContext"

export interface Props {
  rqx: InternalContext
  req: IncomingMessage
}

export interface Return {
  found: boolean
  type: string | null
  key: string | null
  params: Record<string, string>
}

export default function handleRoute({ rqx, req }: Props): Return {
  let route = process.routes.static[req.method + rqx.url.path]

  if (route) return { found: true, type: 'static', key: (req.method + rqx.url.path), params: {} }
  else {
    const actualUrl = rqx.url.path.split('/')
    let params = {}

    for (const routeKey in process.routes.param) {
      if (!routeKey.startsWith(req.method)) continue
      const route = process.routes.param[routeKey]

      const pathArray = routeKey.replace(req.method, '').split('/')
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
        return { found: true, type: 'param', key: routeKey, params }
      }
    }

    return { found: false, type: null, key: null, params: {} }
  }
}