import cluster from "cluster"
import axios from "axios"
import url from "url"

import { IncomingMessage, ServerResponse } from "http"
import handleCompressType, { CompressMapping } from "./handleCompressType"
import InternalContext from "../../interfaces/internalContext"
import handleRoute from "./handleRoute"
import parsePath from "../../functions/parsePath"
import { Props as GenerateHTTPContextProps } from "../../functions/generateRequestContext"

export interface Props {
  req: IncomingMessage
  res: ServerResponse
}

export default async function handleHttpRequest({ req, res }: Props) {
  if (process.options.threading.automatic) process.send({ type: 'thread::new' })
  if (process.options.debug) console.log(`Thread ${cluster.worker.id} (${process.pid}) Got Request: ${req.method} ${req.url}`)
  process.send({ type: 'stats::all', data: { requests: 1, network: { in: 0, out: 0 } } })

  let rqx: InternalContext = {
    url: { ...url.parse(parsePath(req.url)), method: req.method! as any },
    body: '',
    content: '',
    headers: {},
    status: 200
  }

  if (req.headers['content-length'] && Number(req.headers['content-length']) > process.options.body.maxSize * 1e6) {
    const compression = handleCompressType(req.headers["accept-encoding"]?.includes(CompressMapping[process.options.compression]) ? process.options.compression : 'none')
    if (req.headers["accept-encoding"]?.includes(CompressMapping[process.options.compression])) {
      res.setHeader('Content-Encoding', CompressMapping[process.options.compression])
      res.setHeader('Vary', 'Accept-Encoding')
    }

    res.writeHead(rqx.status, rqx.headers)
    compression.once('end', () => {
      res.end()

      if (cluster.worker.id !== 1 && process.options.threading.automatic) process.exit(0)
    }).on('data', (data: Buffer) => {
      process.send({ type: 'stats::all', data: { requests: 0, network: { in: 0, out: data.byteLength } } })
      res.write(data, 'binary')
    })

    switch (typeof process.options.body.message) {
      case "object":
        compression.end(JSON.stringify(process.options.body.message))
        break

      case "bigint":
      case "boolean":
      case "number":
      case "symbol":
        compression.end(String(process.options.body.message))
        break

      default:
        compression.end(process.options.body.message.toString())
        break
    }
  }

  req.on('data', (data: string) => {
    if (!process.options.body.enabled) return

    rqx.body += data
    process.send({ type: 'stats::all', data: { requests: 0, network: { in: Buffer.from(data).byteLength, out: 0 } } })
  }).once('end', async() => {
    const { found, params, ...route } = handleRoute({ rqx, req })

    process.send({
      type: 'request::create',
      worker: cluster.worker.id,
      routeType: route.type,
      route: route.key,
      found,
      data: {
        rqx,
        headers: req.headers,
        client: {
          port: req.socket.remotePort,
          ip: req.socket.remoteAddress
        }, params
      } as GenerateHTTPContextProps
    })

    const compression = handleCompressType(req.headers["accept-encoding"]?.includes(CompressMapping[process.options.compression]) ? process.options.compression : 'none')
    if (req.headers["accept-encoding"]?.includes(CompressMapping[process.options.compression])) {
      res.setHeader('Content-Encoding', CompressMapping[process.options.compression])
      res.setHeader('Vary', 'Accept-Encoding')
    }

    let fetchUrl: url.UrlWithStringQuery = null
    if (rqx.content.toString().startsWith('ls::internal::fetch::')) {
      fetchUrl = url.parse(rqx.content.toString().replace('ls::internal::fetch::', ''))
      rqx.content = ''
    }

    res.writeHead(rqx.status, rqx.headers)
    compression.once('end', () => {
      res.end()

      if (cluster.worker.id !== 1 && process.options.threading.automatic) process.exit(0)
    }).on('data', (data: Buffer) => {
      process.send({ type: 'stats::all', data: { requests: 0, network: { in: 0, out: data.byteLength } } })
      res.write(data, 'binary')
    })

    const handleResponseMessage = (infos: any) => {
      if (infos.type !== 'response') return
      rqx = infos.data.rqx

      compression.end(rqx.content)
      process.removeListener('message', handleResponseMessage)
    }; process.on('message', handleResponseMessage)

    /*if (fetchUrl) {
      try {
        axios({
          method: 'GET',
          url: fetchUrl.href,
          responseType: 'arraybuffer',
          decompress: true,
          headers: { ...req.headers, Host: undefined },
          validateStatus: () => true
        }).then((response) => {
          res.writeHead(response.status, response.headers as any)
          rqx.status = response.status

          process.send({ type: 'stats::all', data: { requests: 0, network: { in: response.data.byteLength, out: 0 } } })
          compression.end(response.data, 'binary')
        }).catch(async(err) => {
          handleErrorResponse({ rqx, ctx, code: 500, err })
          compression.end(rqx.content, 'binary')
        })
      } catch (err) {
        await handleErrorResponse({ rqx, ctx, code: 500, err })
        compression.end(rqx.content, 'binary')
      }
    } else compression.end(rqx.content, 'binary') */

    if (process.options.debug && found) console.log(`Thread ${cluster.worker.id} (${process.pid}) Found Request: ${req.method} ${req.url}`)
    if (process.options.debug && !found) console.log(`Thread ${cluster.worker.id} (${process.pid}) Couldnt find Request: ${req.method} ${req.url}`)
  })
}