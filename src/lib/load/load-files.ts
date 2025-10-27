import { readFiles, uploadFiles } from '@directus/sdk'
import { ux } from '@oclif/core'
import { FormData } from 'formdata-node'
import { readFileSync } from 'node:fs'
import path from 'pathe'

import { DIRECTUS_PINK } from '../constants.js'
import { api } from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

export default async function loadFiles(dir: string) {
  const files = readFile('files', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${files.length} files`))

  if (files && files.length > 0) {
    try {
      // Fetch only the files we're interested in
      const existingFiles = await api.client.request(readFiles({
        fields: ['id', 'filename_disk'],
        limit: -1,
      }))

      const existingFileIds = new Set(existingFiles.map(file => file.id))
      const existingFileNames = new Set(existingFiles.map(file => file.filename_disk))

      const filesToUpload = files.filter(file => {
        if (existingFileIds.has(file.id)) {
          return false
        }

        if (existingFileNames.has(file.filename_disk)) {
          return false
        }

        return true
      })

      await Promise.all(filesToUpload.map(async asset => {
        const fileName = asset.filename_disk
        const assetPath = path.resolve(dir, 'assets', fileName)
        const fileStream = new Blob([readFileSync(assetPath)], { type: asset.type })

        const form = new FormData()
        form.append('id', asset.id)

        if (asset.title) form.append('title', asset.title)
        if (asset.description) form.append('description', asset.description)
        if (asset.folder) form.append('folder', asset.folder)
        if (asset.type) form.append('type', asset.type)

        form.append('file', fileStream, fileName)

        try {
          await api.client.request(uploadFiles(form as any))
        } catch (error) {
          catchError(error)
        }
      }))
    } catch (error) {
      catchError(error)
    }
  }

  ux.action.stop()
}
