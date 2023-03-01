import { CompressTypes } from "../workers/functions/handleCompressType"

export interface Options {
	/** HTTP Body Settings */ body?: {
		/**
		 * Whether recieving HTTP Bodies is enabled
		 * @default true
		*/ enabled?: boolean
		/**
		 * Whether to try parsing the HTTP Body as JSON
		 * @default true
		*/ parse?: boolean
		/**
		 * The Maximum Size of the HTTP Body in MB
		 * @default 5
		*/ maxSize?: number
		/**
		 * The Message that gets sent when the HTTP Body Size is exceeded
		 * @default "Payload too large"
		*/ message?: any
	}

	/** HTTPS Settings */ https?: {
		/**
		 * Whether HTTPS is enabled
		 * @default false
		*/ enabled?: boolean
		/**
		 * The Key File Path
		 * @default '/ssl/key/path'
		*/ keyFile?: string
		/**
		 * The Cert File Path
		 * @default '/ssl/cert/path'
		*/ certFile?: string
	}

	/** Threadding Settings */ threadding?: {
		/**
		 * The Amount of Threads that will always be available
		 * @default 2
		*/ available?: number
		/**
		 * Whether to create a new Thread on each Request temporarily
		 * @default false
		*/ automatic?: boolean
		/**
		 * The Interval in which to sync the Threads
		 * @default 5000
		*/ sync?: number
		/**
		 * The Maximum Amount of Threads to start automatically
		 * @default 8
		*/ maximum?: number
	}

	/**
	 * Where the Server should start at
	 * @default 2023
	*/ port?: number
	/**
	 * Where the Server should bind to
	 * @default "0.0.0.0"
	*/ bind?: string
	/**
	 * Whether X-Forwarded-For will be shown as hostIp
	 * @default false
	*/ proxy?: boolean
	/**
	 * Whether to log Debug messages
	 * @default false
	*/ debug?: boolean
	/**
	 * Whether to Compress outgoing Data using gzip
	 * @default 'none'
	*/ compression?: CompressTypes
	/**
	 * Whether all cors Headers will be set
	 * @default false
	*/ cors?: boolean
	/**
	 * Add X-Powered-By Header
	 * @default true
	*/ poweredBy?: boolean
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
			}, threadding: {
				available: 2,
				automatic: false,
				sync: 5000,
				maximum: 8
			}, port: 2023,
			bind: '0.0.0.0',
			debug: false,
      proxy: false,
			compression: 'none',
      cors: false,
      poweredBy: true
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