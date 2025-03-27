export interface DirectusTemplateFrontend {
  name: string
  path: string
}

export interface DirectusTemplateConfig {
  name: string
  description: string
  template: string
  frontends: {
    [key: string]: DirectusTemplateFrontend
  }
}

export interface TemplatePackageJson {
  name: string
  version: string
  description: string
  'directus:template'?: DirectusTemplateConfig
}
