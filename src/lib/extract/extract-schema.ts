import {schemaSnapshot} from '@directus/sdk'
import {ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

export default async function extractSchema(dir: string) {
  const schemaDir = path.join(dir, 'schema')

  // Check if directory for schema exists, if not, then create it.
  if (!fs.existsSync(schemaDir)) {
    console.log(`Attempting to create directory at: ${schemaDir}`)
    fs.mkdirSync(schemaDir, {recursive: true})
  }

  // Get the schema
  try {
    const schema = api.client.request(schemaSnapshot())

    // Write the schema to the specified directory
    await writeToFile('schema/snapshot', schema, dir)
    ux.log('Extracted schema snapshot')
  } catch (error) {
    ux.warn('Error extracting Schema Snapshot:')
    ux.warn(error.message)
  }
}
