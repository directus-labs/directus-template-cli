
import {uploadFiles} from '@directus/sdk'
import {ux} from '@oclif/core'
import {FormData} from 'formdata-node'
import {readFileSync} from 'node:fs'
import path from 'node:path'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async (dir: string) => {
  ux.action.start('Loading files')

  const files = readFile('files', dir)

  for (const asset of files) {
    const fileName = asset.filename_disk
    const assetPath = path.resolve(dir, 'assets', fileName)
    const fileStream = new Blob([readFileSync(assetPath)], {type: asset.type})

    const form = new FormData()
    form.append('id', asset.id)

    if (asset.title) form.append('title', asset.title)
    if (asset.description) form.append('description', asset.description)
    if (asset.folder) form.append('folder', asset.folder)

    form.append('file', fileStream, fileName)

    try {
      await api.client.request(uploadFiles(form))
    } catch (error) {
      logError(error)
    }
  }

  ux.action.stop()
  ux.log('Loaded Files')
}
