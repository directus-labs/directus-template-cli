import {ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

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
    logToFile?: boolean
}

export default function logError(error: Error, options: Options = {}) {
  const errorMessage = `Status ${error.response.status} • ${JSON.stringify(error.errors[0].message)}\n`

  if (options.fatal) {
    ux.error(errorMessage)
  } else {
    ux.warn(errorMessage)
  }

  if (options.logToFile) {
    const logFilePath = path.join(__dirname, 'error.log')
    try {
      fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${errorMessage}`)
    } catch (fileError) {
      console.error('Error writing to log file:', fileError)
    }
  }
}
