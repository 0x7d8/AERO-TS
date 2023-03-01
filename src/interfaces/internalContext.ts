import { UrlWithStringQuery } from "url"

export default interface InternalContext {
  /** The Request URL */ url: UrlWithStringQuery & { method: Uppercase<string> }
  /** The Request Body */ body: string

  /** The Response Content */ content: string
  /** The Reponse Headers */ headers: Record<string, string>
  /** The Response Status */ status: number
}