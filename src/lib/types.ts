export interface DirectusTemplateFrontend {
  name: string
  path: string
}

export interface DirectusTemplateConfig {
  description: string
  frontends: {
    [key: string]: DirectusTemplateFrontend
  }
  name: string
  template: null | string
}

export interface TemplatePackageJson {
  description: string
  'directus:template'?: DirectusTemplateConfig
  name: string
  version: string
}
