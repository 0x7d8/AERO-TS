import { HttpRequestContext } from "./requestContext"

export type RequestMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD'
  | 'PATCH'

export default interface Route {
  /**
   * The HTTP Method to use
   */ method: RequestMethod

  /**
   * The Code to run on a Request (sync / async)
   */ run: (ctx: HttpRequestContext) => Promise<unknown> | unknown
}