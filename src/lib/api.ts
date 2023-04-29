import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'

class Api {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create()
  }

  public setBaseUrl(url: string): void {
    this.instance.defaults.baseURL = url
  }

  public setAuthToken(token: string): void {
    this.instance.defaults.headers.common.Authorization = `Bearer ${token}`
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config)
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config)
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config)
  }

  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config)
  }

  public delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.instance.delete(url, config)
  }
}

export const api = new Api()
