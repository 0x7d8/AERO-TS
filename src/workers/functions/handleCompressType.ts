import zlib from "zlib"

import { PassThrough } from "stream"

export type CompressTypes = 'none' | 'gzip' | 'brotli' | 'deflate'

export const CompressMapping: Record<CompressTypes, string> = {
  none: 'none',
  gzip: 'gzip',
  brotli: 'br',
  deflate: 'deflate'
}

export default function handleCompressType(type: CompressTypes) {
  switch (type) {
    case "gzip":
      return zlib.createGzip()

    case "brotli":
      return zlib.createBrotliCompress()

    case "deflate":
      return zlib.createDeflate()

    default:
      return new PassThrough()
  }
}