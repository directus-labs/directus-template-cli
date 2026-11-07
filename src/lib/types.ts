export interface DirectusTemplateFrontend {
  name: string
  path: string
}

export interface DirectusTemplateVariant {
  description?: string
  name: string
  requiresLicense?: boolean
  template: string
}

export interface DirectusTemplateConfig {
  description: string
  frontends: {
    [key: string]: DirectusTemplateFrontend
  }
  name: string
  requiresLicense?: boolean
  template: null | string
  variants?: {
    [key: string]: DirectusTemplateVariant
  }
}

export interface TemplatePackageJson {
  description: string
  'directus:template'?: DirectusTemplateConfig
  name: string
  version: string
}
