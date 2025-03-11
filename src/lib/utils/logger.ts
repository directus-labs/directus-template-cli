import fs from 'node:fs'
import path from 'pathe'

class Logger {
  private static instance: Logger
  private logFilePath: string

  private constructor() {
    this.initializeLogFile()
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }

    return Logger.instance
  }

  public log(level: 'error' | 'info' | 'warn', message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString()
    const contextString = context ? JSON.stringify(this.sanitize(context)) : ''
    const logEntry = `${timestamp} - ${level.toUpperCase()}: ${message}${contextString ? ` Context: ${contextString}` : ''}\n`

    this.writeToFile(logEntry)
  }

  private initializeLogFile(): void {
    // @ts-ignore - ignore
    const timestamp = new Date().toISOString().replaceAll(/[.:]/g, '-')
    const logDir = path.join(process.cwd(), '.directus-template-cli', 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, {recursive: true})
    }

    this.logFilePath = path.join(logDir, `run-${timestamp}.log`)

    // Write initial timestamp to the log file
    this.writeToFile(`Log started at ${timestamp}\n`)
  }

  private sanitize(obj: Record<string, any>): Record<string, any> {
    const sensitiveFields = new Set(['password', 'token', 'secret', 'key', 'authorization', 'email', 'access_token', 'refresh_token'])
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (sensitiveFields.has(key.toLowerCase())) {
          return [key, '********']
        }

        if (typeof value === 'object' && value !== null) {
          return [key, this.sanitize(value)]
        }

        return [key, value]
      }),
    )
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFilePath, message)
    } catch (error) {
      console.error('Error writing to log file:', error)
    }
  }
}

export const logger = Logger.getInstance()
