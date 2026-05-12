export type RelationStrategy = 'deep' | 'empty' | 'ids'

export interface TemplateComponents {
  content: boolean
  dashboards: boolean
  extensions: boolean
  files: boolean
  flows: boolean
  permissions: boolean
  schema: boolean
  settings: boolean
  users: boolean
}

export interface TemplatePlan {
  allowBrokenRelations: boolean
  collections?: string[]
  components: TemplateComponents
  excludeCollections?: string[]
  partial: boolean
  relationStrategy: RelationStrategy
}

export interface TemplateWarning {
  collection?: string
  count?: number
  field?: string
  relatedCollection?: string
  type: string
}

export interface TemplateMetadata extends Omit<TemplatePlan, 'excludeCollections'> {
  excludedCollections?: string[]
  version: 2
  warnings: TemplateWarning[]
}

export type TemplateComponent = keyof TemplateComponents
