import { IncomingMessage, ServerResponse } from "http"
import generateRequestContext from "./generateRequestContext"
import InternalContext from "../../interfaces/internalContext"

export interface Props {
  rqx: InternalContext
  req: IncomingMessage
  res: ServerResponse

  middleware: any[]
}

export default function handleMiddleware({ rqx, req, res, middleware }: Props) {
  const ctx = generateRequestContext({ rqx, req, res, params: {} })

  const middlewareFunctions = []
  for (let index = 0; index < middleware.length; index++) {
    middlewareFunctions.push(middleware[index].run(ctx))
  }

  return new Promise((resolve) => {
    Promise.all(middlewareFunctions)
      .then(() => resolve({ success: true }))
      .catch((error) => resolve({ success: false, error }))
  })
}