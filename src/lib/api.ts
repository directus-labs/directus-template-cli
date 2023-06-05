import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
import Bottleneck from 'bottleneck'

class Api {
  private instance: AxiosInstance;
  private limiter: Bottleneck;

  constructor() {
    this.instance = axios.create()
    this.limiter = new Bottleneck({
      minTime: 100, // Set min time between tasks here (1000 ms = 1 second)
      // You can set other options here as well.
    })
  }

  public setBaseUrl(url: string): void {
    this.instance.defaults.baseURL = url
  }

  public setAuthToken(token: string): void {
    this.instance.defaults.headers.common.Authorization = `Bearer ${token}`
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.limiter.schedule(() => this.instance.get<T>(url, config))
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.limiter.schedule(() => this.instance.post<T>(url, data, config))
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.limiter.schedule(() => this.instance.put<T>(url, data, config))
  }

  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.limiter.schedule(() => this.instance.patch<T>(url, data, config))
  }

  public delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.limiter.schedule(() => this.instance.delete(url, config))
  }
}

export const api = new Api()
