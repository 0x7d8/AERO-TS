import cluster from "cluster"
import axios from "axios"
import url from "url"

import { IncomingMessage, ServerResponse } from "http"
import handleCompressType, { CompressMapping } from "./handleCompressType"
import InternalContext from "../../interfaces/internalContext"
import handleRoute from "./handleRoute"
import handleErrorResponse from "./handleErrorResponse"
import parsePath from "../../functions/parsePath"

export interface Props {
  req: IncomingMessage
  res: ServerResponse
}

export default async function handleHttpRequest({ req, res }: Props) {
  if (process.options.threadding.automatic) process.send({ type: 'threads::new' })
  process.send({ type: 'stats::all', data: { requests: 1, network: { in: 0, out: 0 } } })

  const rqx: InternalContext = {
    url: { ...url.parse(parsePath(req.url)), method: req.method! as any },
    body: Buffer.alloc(0),
    content: Buffer.alloc(0),
    status: 200
  }

  if (req.headers['content-length'] && Number(req.headers['content-length']) > process.options.body.maxSize * 1e6) {
    const compression = handleCompressType(req.headers["accept-encoding"]?.includes(CompressMapping[process.options.compression]) ? process.options.compression : 'none')
    if (req.headers["accept-encoding"]?.includes(CompressMapping[process.options.compression])) {
      res.setHeader('Content-Encoding', CompressMapping[process.options.compression])
      res.setHeader('Vary', 'Accept-Encoding')
    }

    compression.once('end', () => {
      res.statusCode = rqx.status
      res.end()

      if (cluster.worker.id !== 1 && process.options.threadding.automatic) process.exit(0)
    }).on('data', (data: Buffer) => {
      process.send({ type: 'stats::all', data: { requests: 0, network: { in: 0, out: data.byteLength } } })
      res.write(data, 'binary')
    })

    compression.end('')
  }

  if (process.options.debug) console.log(`Thread ${cluster.worker.id} (${process.pid}) Got Request: ${req.method} ${req.url}`)
  req.on('data', (data: string) => {
    rqx.body = Buffer.concat([ rqx.body, Buffer.from(data) ])
    process.send({ type: 'stats::all', data: { requests: 0, network: { in: Buffer.from(data).byteLength, out: 0 } } })
  }).once('end', async() => {
    const { found, route, ctx } = handleRoute({ rqx, req, res })

    try {
      if (found) await Promise.resolve(route.run(ctx))
      else await handleErrorResponse({ rqx, ctx, code: 404 })
    } catch (err) {
      await handleErrorResponse({ rqx, ctx, code: 500, err })
    }

    const compression = handleCompressType(req.headers["accept-encoding"]?.includes(CompressMapping[process.options.compression]) ? process.options.compression : 'none')
    if (req.headers["accept-encoding"]?.includes(CompressMapping[process.options.compression])) {
      res.setHeader('Content-Encoding', CompressMapping[process.options.compression])
      res.setHeader('Vary', 'Accept-Encoding')
    }

    let fetchUrl: url.UrlWithStringQuery = null
    if (rqx.content.toString().startsWith('ls::internal::fetch::')) {
      fetchUrl = url.parse(rqx.content.toString().replace('ls::internal::fetch::', ''))
      rqx.content = Buffer.alloc(0)
    }

    compression.once('end', () => {
      res.statusCode = rqx.status
      res.end()

      if (cluster.worker.id !== 1 && process.options.threadding.automatic) process.exit(0)
    }).on('data', (data: Buffer) => {
      process.send({ type: 'stats::all', data: { requests: 0, network: { in: 0, out: data.byteLength } } })
      res.write(data, 'binary')
    })

    if (fetchUrl) {
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
    } else compression.end(rqx.content, 'binary')

    if (process.options.debug && found) console.log(`Thread ${cluster.worker.id} (${process.pid}) Found Request: ${req.method} ${req.url}`)
    if (process.options.debug && !found) console.log(`Thread ${cluster.worker.id} (${process.pid}) Couldnt find Request: ${req.method} ${req.url}`)
  })
}