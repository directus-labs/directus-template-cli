export interface InitOptions {
  frontend?: string
  initGit?: boolean
  installDeps?: boolean
  programmatic?: boolean
  targetDir: string
  template: string
}

export interface TemplateInfo {
  frontends: string[]
  hasDirectus: boolean
  name: string
}

export interface InitResult {
  directusUrl?: string
  error?: Error
  success: boolean
}

export interface DirectusConfig {
  adminEmail: string
  adminPassword: string
  port: number
  url: string
}

export interface DockerConfig {
  composeFile: string
  healthCheckEndpoint: string
  interval: number
  maxAttempts: number
}
