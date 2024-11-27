import type {AuthenticationClient, AuthenticationData, RestClient} from '@directus/sdk'

import {authentication, createDirectus, rest} from '@directus/sdk'
import {ux} from '@oclif/core'
import Bottleneck from 'bottleneck'

export interface Schema {

}

export class DirectusError extends Error {
  errors: Array<{ extensions?: Record<string, unknown>; message: string }>
  headers: Headers
  message: string
  response: Response
  status: number
  constructor(response: Response) {
    super(response.statusText)
    this.name = 'DirectusError'
    this.headers = response.headers
    this.status = response.status
    this.response = response
    this.errors = []
    this.message = response.statusText
  }

  formatError(): string {
    if (this.errors.length === 0) {
      return `Directus Error: ${this.message} (Status: ${this.status})`
    }

    const {extensions, message} = this.errors[0]
    let formattedError = `Directus Error: ${message.trim()} (Status: ${this.status})`

    if (extensions) {
      formattedError += ` ${JSON.stringify(extensions)}`
    }

    return formattedError
  }

  async parseErrors(): Promise<void> {
    try {
      const data = await this.response.json()
      if (data && Array.isArray(data.errors)) {
        this.errors = data.errors
        this.message = this.formatError()
      }
    } catch {
      // If parsing fails, keep the errors array empty
    }
  }
}

class Api {
  public client: (RestClient<Schema> & AuthenticationClient<Schema>) | undefined
  private authData: AuthenticationData | null = null
  private limiter: Bottleneck

  constructor() {
    this.limiter = new Bottleneck({
      maxConcurrent: 10,
      minTime: 100, // Ensure at least 100ms between requests
      reservoir: 50,  // Reservoir to handle the default rate limiter of 50 requests per second
      reservoirRefreshAmount: 50,
      reservoirRefreshInterval: 1000, // Refill 50 requests every 1 second
      retryCount: 3,  // Retry a maximum of 3 times
    })

    this.limiter.on('failed', async (error, jobInfo) => {
      if (error instanceof DirectusError) {
        const retryAfter = error.headers?.get('Retry-After')
        const statusCode = error.status

        if (statusCode === 429) {
          const delay = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : 60_000
          ux.log(`${ux.colorize('dim', '--')} Rate limited. Retrying after ${delay}ms`)
          return delay
        }

        if (statusCode === 503) {
          const delay = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : 5000
          ux.log(`${ux.colorize('dim', '--')} Server under pressure. Retrying after ${delay}ms`)
          return delay
        }

        // If the status code is 400 or 401, we don't want to retry
        if (statusCode === 400 || statusCode === 401) {
          return
        }
      }

      // For other errors, use exponential backoff, but only if we haven't exceeded retryCount
      if (jobInfo.retryCount < 3) {
        const delay = Math.min(1000 * 2 ** jobInfo.retryCount, 30_000)
        ux.log(`${ux.colorize('dim', '--')} Request failed. Retrying after ${delay}ms`)
        return delay
      }

      ux.log(`${ux.colorize('dim', '--')} Max retries reached, not retrying further`)
    })

    this.limiter.on('retry', (error, jobInfo) => {
      ux.log(`${ux.colorize('dim', '--')} Retrying job (attempt ${jobInfo.retryCount + 1})`)
    })

    this.limiter.on('depleted', empty => {
      if (empty) {
        ux.log(`${ux.colorize('dim', '--')} Rate limit quota depleted. Requests will be queued.`)
      }
    })
  }

  public getToken(): null | string {
    return this.authData?.access_token ?? null
  }

  public initialize(url: string): void {
    this.client = createDirectus<Schema>(url, {
      globals: {
        fetch: this.limiter.wrap(this.enhancedFetch),
      },
    })
    .with(rest())
    .with(authentication('json', {
      autoRefresh: true,
      storage: {
        get: () => this.authData,
        set: data => {
          this.authData = data
        },
      },
    }))
  }

  public async login(email: string, password: string): Promise<void> {
    if (!this.client) {
      throw new Error('API client is not initialized. Call initialize() first.')
    }

    await this.client.login(email, password)
  }

  public async loginWithToken(token: string): Promise<void> {
    if (!this.client) {
      throw new Error('API client is not initialized. Call initialize() first.')
    }

    await this.client.setToken(token)
  }

  public async logout(): Promise<void> {
    if (!this.client) {
      throw new Error('API client is not initialized. Call initialize() first.')
    }

    await this.client.logout()
    this.authData = null
  }

  public async refreshToken(): Promise<void> {
    if (!this.client) {
      throw new Error('API client is not initialized. Call initialize() first.')
    }

    await this.client.refresh()
  }

  private async enhancedFetch(...args: Parameters<typeof fetch>): Promise<Response> {
    const response = await fetch(...args)

    if (!response.ok) {
      const error = new DirectusError(response)
      await error.parseErrors()
      throw error
    }

    return response
  }
}

const api = new Api()
export {api}
