import { IncomingMessage } from "http"
import { Duplex } from "stream"

export interface Props {
  req: IncomingMessage
  soc: Duplex
  head: Buffer
}

export default async function handleWsRequest({ req, soc, head }: Props) {
  return null
}