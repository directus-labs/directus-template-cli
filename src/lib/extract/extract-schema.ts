import {schemaSnapshot} from '@directus/sdk'
import {ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import writeToFile from '../utils/write-to-file'

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
