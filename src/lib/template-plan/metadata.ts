import fs from 'node:fs'
import path from 'pathe'

import type {TemplateMetadata, TemplatePlan, TemplateWarning} from './types.js'

import catchError from '../utils/catch-error.js'

const META_FILE = 'template-meta.json'

export function createTemplateMetadata(plan: TemplatePlan, warnings: TemplateWarning[] = []): TemplateMetadata {
  return {
    allowBrokenRelations: plan.allowBrokenRelations,
    collections: plan.collections,
    components: plan.components,
    excludedCollections: plan.excludeCollections,
    partial: plan.partial,
    relationStrategy: plan.relationStrategy,
    schemaCollections: plan.schemaCollections,
    version: 2,
    warnings,
  }
}

export function getTemplateMetadataPath(dir: string): string {
  return path.join(dir, META_FILE)
}

export function readTemplateMetadata(dir: string): TemplateMetadata | undefined {
  const filePath = getTemplateMetadataPath(dir)
  if (!fs.existsSync(filePath)) return undefined

  let metadata: TemplateMetadata

  try {
    metadata = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TemplateMetadata
  } catch (error) {
    catchError(error, {fatal: true})
    return undefined
  }

  if (metadata.version !== 2) {
    catchError(new Error(`Unsupported template metadata version: ${metadata.version}`), {fatal: true})
    return undefined
  }

  return metadata
}

export async function writeTemplateMetadata(
  dir: string,
  plan: TemplatePlan,
  warnings: TemplateWarning[] = [],
): Promise<void> {
  const filePath = getTemplateMetadataPath(dir)
  await fs.promises.writeFile(filePath, JSON.stringify(createTemplateMetadata(plan, warnings), null, 2))
}
