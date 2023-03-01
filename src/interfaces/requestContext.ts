import { UrlWithStringQuery } from "url"
import ValueCollection from "../classes/valueCollection"
import { RequestMethod } from "./route"

export type printTypes =
  | string
  | number
  | boolean
  | Record<string | number, any>
  | Buffer

export interface HttpRequestContext {
  /**
   * Send Status to the Client
   * @since 0.1.0
  */ status: (status: number) => HttpRequestContext
  /**
   * Redirect the Client
   * @since 0.1.0
  */ redirect: (url: string, type?: 'temporary' | 'permanent') => HttpRequestContext
  /**
   * Print Data to the Client
   * @since 0.1.0
  */ print: (data: printTypes) => HttpRequestContext
  /**
   * Print Content of a URL to the Client
   * @since 0.1.0
  */ printFetch: (url: string) => HttpRequestContext

  /**
   * Client Infos
   * @since 0.1.0
  */ readonly client: {
		/**
     * The User Agent of the Client
     * @since 0.1.0
    */ readonly userAgent: string
		/**
     * The HTTP Version that the Client is using
     * @since 0.1.0
    */ readonly httpVersion: string
		/**
     * The Port that the Client is using
     * @since 0.1.0
    */ readonly port: number
		/**
     * The Ip that the Client is using
     * @since 0.1.0
    */ readonly ip: string
	}

  /**
   * View the Request Body
   * @since 0.1.0
  */ body: string | Record<string, any>

  /**
   * View the Request URL
   * @since 0.1.0
  */ url: UrlWithStringQuery & { method: RequestMethod }
  /**
   * View all Request Parameters
   * @since 0.1.0
  */ params: ValueCollection<string, string>
  /**
   * View all Request Headers
   * @since 0.1.0
  */ headers: ValueCollection<Lowercase<string>, string>
  /**
   * View all Request Parameters
   * @since 0.1.0
  */ queries: ValueCollection<string | number, string | string[]>
}