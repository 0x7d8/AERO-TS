import query from "querystring"

import { HttpRequestContext } from "../interfaces/requestContext"
import InternalContext from "../interfaces/internalContext"
import ValueCollection from "../classes/valueCollection"
import { Stats } from "../classes/httpServer"

export interface Props {
  rqx: InternalContext
  client: {
    port: number
    ip: string
  }, headers: Record<string, string>
  params: Record<string, string>
  stats: Stats
}

export default function generateRequestContext({ rqx, stats, client, headers, params }: Props): HttpRequestContext {
  let body: string
  try {
    body = JSON.parse(rqx.body)
  } catch (err) {
    body = rqx.body
  }

  let context: HttpRequestContext
  return context = {
    status(status) {
      rqx.status = status

      return context
    }, redirect(url, type) {
      rqx.headers['Location'] = url
      rqx.status = type === 'permanent' ? 302 : 301

      return context
    }, print(data) {
      switch (typeof data) {
        case "object":
          rqx.headers['Content-Type'] = 'application/json'
          rqx.content = JSON.stringify(data)
          break

        case "bigint":
        case "boolean":
        case "number":
        case "symbol":
          rqx.content = String(data)
          break

        default:
          rqx.content = data.toString()
          break
      }

      return context
    },

    client: {
      userAgent: headers['user-agent'],
      port: client.port,
      ip: client.ip
    },

    body,

    stats,

    url: { ...rqx.url, method: rqx.url.method! as any },
    params: new ValueCollection(params, decodeURIComponent),
    headers: new ValueCollection(headers as any),
    queries: new ValueCollection(query.parse(rqx.url.query))
	}
}