import path from 'node:path'

import readFile from '../utils/read-file'

export default async function checkTemplate(dir: string) {
  // Check for the collections,fields, and relations files
  try {
    // const schemaDir = path.join(dir, 'schema')
    const collections = readFile('collections', dir)
    const fields = readFile('fields', dir)
    // const relations = readFile('relations', dir)

    // && relations.length > 0
    const isCollectionsOk = collections.length > 0 && fields.length > 0
    return isCollectionsOk
  } catch (error) {
    console.error(error)
  }
}

// function checkSchema(schema: any) {
//   const requiredSchemaKeys = ['version', 'collections', 'fields', 'relations', 'directus']

//   if (!schema) {
//     return false
//   }

//   const schemaKeys = Object.keys(schema)

//   for (const key of requiredSchemaKeys) {
//     if (!schemaKeys.includes(key)) {
//       return false
//     }
//   }

//   return true
// }
