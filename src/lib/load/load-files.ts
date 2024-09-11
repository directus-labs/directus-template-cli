import {readFiles, uploadFiles} from '@directus/sdk'
import {ux} from '@oclif/core'
import {FormData} from 'formdata-node'
import {readFileSync} from 'node:fs'
import path from 'node:path'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadFiles(dir: string) {
  const files = readFile('files', dir)
  ux.action.start(`Loading ${files.length} files`)

  try {
    const fileIds = files.map(file => file.id)

    // Fetch only the files we're interested in
    const existingFiles = await api.client.request(readFiles({
      fields: ['id', 'filename_disk'],
      filter: {
        id: {
          _in: fileIds,
        },
      },
      limit: -1,
    }))

    const existingFileIds = new Set(existingFiles.map(file => file.id))
    const existingFileNames = new Set(existingFiles.map(file => file.filename_disk))

    const filesToUpload = files.filter(file => {
      if (existingFileIds.has(file.id)) {
        ux.log(`Skipping existing file with ID: ${file.id}`)
        return false
      }

      if (existingFileNames.has(file.filename_disk)) {
        ux.log(`Skipping existing file with name: ${file.filename_disk}`)
        return false
      }

      return true
    })

    await Promise.all(filesToUpload.map(async asset => {
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
        ux.log(`Uploaded file: ${fileName}`)
      } catch (error) {
        catchError(error)
      }
    }))

    ux.log(`Uploaded ${filesToUpload.length} new files`)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
  ux.log('Finished loading files')
}
