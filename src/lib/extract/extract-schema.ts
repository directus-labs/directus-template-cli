import {schemaSnapshot} from '@directus/sdk'
import {ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'pathe'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

export default async function extractSchema(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting schema snapshot'))
  try {
    const schemaDir = path.join(dir, 'schema')
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, {recursive: true})
    }

    const schema = await api.client.request(schemaSnapshot())
    await writeToFile('schema/snapshot', schema, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
