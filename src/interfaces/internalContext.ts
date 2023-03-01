import { UrlWithStringQuery } from "url"

export default interface InternalContext {
  /** The Request URL */ url: UrlWithStringQuery & { method: Uppercase<string> }
  /** The Request Body */ body: Buffer

  /** The Response Content */ content: Buffer
  /** The Response Status */ status: number
}