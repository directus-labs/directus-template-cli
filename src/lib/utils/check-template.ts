import path from 'node:path'

import readFile from '../utils/read-file'

export default async function checkTemplate(dir: string) {
  // Check for the schema file and the collections,fields, and relations files
  const schemaDir = path.join(dir, 'schema')
  const schema = readFile('snapshot', schemaDir)

  const isSchemaOk = checkSchema(schema)

  const collections = readFile('collections', dir)
  const fields = readFile('fields', dir)
  const relations = readFile('relations', dir)

  const isCollectionsOk = collections.length > 0 && fields.length > 0 && relations.length > 0

  // There are two ways to load the schema. 1. Using the schema file and endpoints which will overwrite the schema. 2. Using the collections, fields, and relations files which will add to the schema. Older templates only supported the schema file and didn't extract the collections, fields, and relations files. Newer templates support both methods.
  return {
    collections: isCollectionsOk,
    schema: isSchemaOk,
  }
}

const requiredSchemaKeys = ['version', 'collections', 'fields', 'relations', 'directus']

function checkSchema(schema: any) {
  if (!schema) {
    return false
  }

  const schemaKeys = Object.keys(schema)

  for (const key of requiredSchemaKeys) {
    if (!schemaKeys.includes(key)) {
      return false
    }
  }

  return true
}
