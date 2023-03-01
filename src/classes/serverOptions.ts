import { CompressTypes } from "../workers/functions/handleCompressType"

export interface Options {
	/** HTTP Body Settings */ body?: {
		/**
		 * Whether recieving HTTP Bodies is enabled
		 * @default true
		 * @since 0.1.0
		*/ enabled?: boolean
		/**
		 * Whether to try parsing the HTTP Body as JSON
		 * @default true
		 * @since 0.1.0
		*/ parse?: boolean
		/**
		 * The Maximum Size of the HTTP Body in MB
		 * @default 5
		 * @since 0.1.0
		*/ maxSize?: number
		/**
		 * The Message that gets sent when the HTTP Body Size is exceeded
		 * @default "Payload too large"
		 * @since 0.1.0
		*/ message?: any
	}

	/** HTTPS Settings */ https?: {
		/**
		 * Whether HTTPS is enabled
		 * @default false
		 * @since 0.1.0
		*/ enabled?: boolean
		/**
		 * The Key File Path
		 * @default '/ssl/key/path'
		 * @since 0.1.0
		*/ keyFile?: string
		/**
		 * The Cert File Path
		 * @default '/ssl/cert/path'
		 * @since 0.1.0
		*/ certFile?: string
	}

	/** Threadding Settings */ threading?: {
		/**
		 * The Amount of Threads that will always be available
		 * @default 2
		 * @since 0.1.0
		*/ available?: number
		/**
		 * Whether to create a new Thread on each Request temporarily
		 * @default false
		 * @since 0.1.0
		*/ automatic?: boolean
		/**
		 * The Interval in which to sync the Threads
		 * @default 5000
		 * @since 0.1.0
		*/ sync?: number
		/**
		 * The Maximum Amount of Threads to start automatically
		 * @default 8
		 * @since 0.1.0
		*/ maximum?: number
	}

	/**
	 * Where the Server should start at
	 * @default 2023
	 * @since 0.1.0
	*/ port?: number
	/**
	 * Where the Server should bind to
	 * @default "0.0.0.0"
	 * @since 0.1.0
	*/ bind?: string
	/**
	 * Whether X-Forwarded-For will be shown as hostIp
	 * @default false
	 * @since 0.1.0
	*/ proxy?: boolean
	/**
	 * Whether to log Debug messages
	 * @default false
	 * @since 0.1.0
	*/ debug?: boolean
	/**
	 * Whether to Compress outgoing Data using gzip
	 * @default 'none'
	 * @since 0.1.0
	*/ compression?: CompressTypes
}

export default class ServerOptions {
  private data: Options

  /** Server Options Helper */
  constructor(options: Options) {
		this.data = this.mergeOptions({
      body: {
				enabled: true,
				parse: true,
				maxSize: 5,
				message: 'Payload too large'
			}, https: {
				enabled: false,
				keyFile: '/ssl/key/path',
				certFile: '/ssl/cert/path'
			}, threading: {
				available: 2,
				automatic: false,
				sync: 5000,
				maximum: 8
			}, port: 2023,
			bind: '0.0.0.0',
			debug: false,
      proxy: false,
			compression: 'none'
    }, options)
  }

	private mergeOptions(...objects: Options[]): Options {
		const isObject = (obj: Options) => (obj && typeof obj === 'object')

		return objects.reduce((prev, obj) => {
			Object.keys(obj).forEach((key) => {
				const pVal = prev[key]
				const oVal = obj[key]

				if (key !== 'functions' && key !== 'routes') {
					if (Array.isArray(pVal) && Array.isArray(oVal)) prev[key] = pVal.concat(...oVal)
					else if (isObject(pVal) && isObject(oVal)) prev[key] = this.mergeOptions(pVal, oVal)
					else prev[key] = oVal
				} else prev[key] = oVal
			})
			
			return prev
		}, {}) as any
	}

  /** Get the Resulting Options */
  getOptions() {
    return this.data
  }
}