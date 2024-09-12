import type {AuthenticationClient, AuthenticationData, RestClient} from '@directus/sdk'

import {authentication, createDirectus, login, logout, refresh, rest} from '@directus/sdk'
import Bottleneck from 'bottleneck'

export interface Schema {
  // Define your schema here
}

class Api {
  public client: (RestClient<Schema> & AuthenticationClient<Schema>) | undefined
  private authData: AuthenticationData | null = null
  private limiter: Bottleneck

  constructor() {
    this.limiter = new Bottleneck({
      maxConcurrent: 10,
      minTime: 100,
      retryCount: 3,
      retryDelay: 3000,
    })
  }

  public getToken(): null | string {
    return this.authData?.access_token ?? null
  }

  public initialize(url: string): void {
    this.client = createDirectus<Schema>(url, {
      globals: {
        fetch: (...args) => this.limiter.schedule(() => fetch(...args)),
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
}

const api = new Api()
export {api}
