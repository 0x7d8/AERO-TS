import query from "querystring"
import url from "url"

import { IncomingMessage, ServerResponse } from "http"
import { HttpRequestContext } from "../../interfaces/requestContext"
import InternalContext from "../../interfaces/internalContext"
import ValueCollection from "../../classes/valueCollection"

export interface Props {
  rqx: InternalContext
  req: IncomingMessage
  res: ServerResponse
  params: Record<string, string>
}

export default function generateRequestContext({ rqx, req, res, params }: Props): HttpRequestContext {
  let body: string
  try {
    body = JSON.parse(rqx.body.toString())
  } catch (err) {
    body = rqx.body.toString()
  }

  let context: HttpRequestContext
  return context = {
    status(status) {
      rqx.status = status

      return context
    }, redirect(url, type) {
      res.setHeader('Location', url)
      rqx.status = type === 'permanent' ? 302 : 301

      return context
    }, print(data) {
      switch (typeof data) {
        case "object":
          rqx.content = Buffer.from(JSON.stringify(data))
          break

        case "bigint":
        case "boolean":
        case "number":
        case "symbol":
          rqx.content = Buffer.from(String(data))
          break

        default:
          rqx.content = Buffer.from(data)
          break
      }

      return context
    }, printFetch(url) {
      rqx.content = Buffer.from(`ls::internal::fetch::${url}`)

      return context
    },

    client: {
      userAgent: req.headers['user-agent'],
      httpVersion: req.httpVersion,
      port: req.socket.remotePort,
      ip: req.socket.remoteAddress
    },

    body,

    url: { ...url.parse(req.url), method: req.method! as any },
    params: new ValueCollection(params, decodeURIComponent),
    headers: new ValueCollection(req.headers as any),
    queries: new ValueCollection(query.parse(rqx.url.query))
	}
}