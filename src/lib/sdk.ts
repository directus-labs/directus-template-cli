import {ux} from '@oclif/core'
import type {AuthenticationClient, RestClient} from '@directus/sdk'
import {authentication, createDirectus, rest} from '@directus/sdk'
import Bottleneck from 'bottleneck'
import logError from './utils/log-error'

export interface Schema{
    any
}

class Api {
  public client: (RestClient<Schema> & AuthenticationClient<Schema>) | undefined;
  private limiter: Bottleneck;

  constructor() {
    this.limiter = new Bottleneck({
      minTime: 100, // 100ms between requests
      maxConcurrent: 10, // Max 10 concurrent requests
      reservoir: 60, // Reservoir of requests to refill
      reservoirRefreshAmount: 60,
      reservoirRefreshInterval: 60 * 1000, // 1 minute
      retryCount: 3, // Retry failed requests up to 3 times
      retryDelay: 3000, // Wait 3 seconds between retries
    });

    this.limiter.on('failed', async (error, jobInfo: any) => {
      ux.log(`Job ${jobInfo.options.id} failed:`)
      logError(error)
      if (jobInfo.retryCount < 3) {
        ux.log(`Retrying job ${jobInfo.options.id} in ${jobInfo.retryDelay}ms`);
        return jobInfo.retryDelay;
      }
    });

    this.limiter.on('retry', (error, jobInfo) => {
      ux.log(`Now retrying ${jobInfo.options.id}`);
    });
  }

  public initialize(url: string): void {
    this.client = createDirectus<Schema>(url)
      .with(rest({
        // @ts-ignore
        fetch: (...args: any) => this.limiter.schedule(() => fetch(...args))
      }))
      .with(authentication());
  }

  public setAuthToken(token: string): void {
    if (!this.client) {
      throw new Error('API client is not initialized. Call initialize() first.');
    }
    this.client.setToken(token);
  }
}

const api = new Api();
export { api };
