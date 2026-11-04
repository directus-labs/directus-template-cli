export type RelationStrategy = 'deep' | 'empty' | 'preserve'

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
  schemaCollections?: string[]
}

export type TemplateWarning = {
  collection: string
  count: number
  field: string
  relatedCollection: string
  type: 'excluded_relation'
}

export interface TemplateMetadata extends Omit<TemplatePlan, 'excludeCollections'> {
  excludedCollections?: string[]
  version: 2
  warnings: TemplateWarning[]
}

export type TemplateComponent = keyof TemplateComponents
