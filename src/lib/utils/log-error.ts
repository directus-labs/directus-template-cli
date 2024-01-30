import {ux} from '@oclif/core'

interface Error {
    errors: {
        message: string
    }[]
    response: {
        status: number
    }
}

interface Options {
    fatal?: boolean
}

export default function logError(error: Error, options: Options = {}) {
  if (options.fatal) {
    ux.error(`Status ${error.response.status} • ${error.errors[0].message}`)
  } else {
    ux.warn(`Status ${error.response.status} • ${error.errors[0].message}`)
  }
}
