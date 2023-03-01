import { IncomingMessage, ServerResponse } from "http"
import generateRequestContext from "../../functions/generateRequestContext"
import InternalContext from "../../interfaces/internalContext"

export interface Props {
  rqx: InternalContext
  req: IncomingMessage
  res: ServerResponse

  middleware: any[]
}

export default function handleMiddleware({ rqx, req, res, middleware }: Props) {
  const middlewareFunctions = []
  for (let index = 0; index < middleware.length; index++) {
    middlewareFunctions.push(middleware[index].run())
  }

  return new Promise((resolve) => {
    Promise.all(middlewareFunctions)
      .then(() => resolve({ success: true }))
      .catch((error) => resolve({ success: false, error }))
  })
}