import type {AuthenticationClient, RestClient} from '@directus/sdk'

import {authentication, createDirectus, rest} from '@directus/sdk'
import Bottleneck from 'bottleneck'

export interface Schema{
    any
}

class Api {
  public client: (RestClient<Schema> & AuthenticationClient<Schema>) | undefined
  private limiter: Bottleneck

  constructor() {
    this.limiter = new Bottleneck({
      maxConcurrent: 10, // Max 10 concurrent requests
      minTime: 100, // 100ms between requests
      retryCount: 3, // Retry failed requests up to 3 times
      retryDelay: 3000, // Wait 3 seconds between retries
    })
  }

  public initialize(url: string): void {
    this.client = createDirectus<Schema>(url, {
      globals: {
        fetch: (...args) => this.limiter.schedule(() => fetch(...args)),
      },
    })
    .with(rest())
    .with(authentication())
  }

  public setAuthToken(token: string): void {
    if (!this.client) {
      throw new Error('API client is not initialized. Call initialize() first.')
    }

    this.client.setToken(token)
  }
}

const api = new Api()
export {api}
