import { HttpRequestContext } from "../../interfaces/requestContext"
import InternalContext from "../../interfaces/internalContext"

export interface Props {
  rqx: InternalContext
  ctx: HttpRequestContext
  code: number
  err?: Error
}

export default async function handleErrorResponse({ rqx, ctx, code, err }: Props) {
  switch (code) {
    case 404:
      if (!('404' in process.routes.special)) {
        rqx.status = 404
        return rqx.content = Buffer.from('Route not found')
      }

      try {
        await Promise.resolve(process.routes.special['404'].run(ctx))
      } catch (err) {
        await handleErrorResponse({ rqx, ctx, code: 500, err })
      }; break

    case 500:
      if (!('500' in process.routes.special)) {
        rqx.status = 500
        return rqx.content = Buffer.from(`Server Error\n${err}`)
      }

      try {
        await Promise.resolve(process.routes.special['500'].run(ctx))
      } catch (err) {
        rqx.status = 500
        return rqx.content = Buffer.from(`Server Error\n${err.stack}`)
      }; break
  }
}