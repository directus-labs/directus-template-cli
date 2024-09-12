import {readAssetRaw, readFiles} from '@directus/sdk'
import {ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'
import {pipeline} from 'node:stream/promises'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'

async function getAssetList() {
  return api.client.request(readFiles({limit: -1}))
}

async function downloadFile(file: any, dir: string) {
  const response = await api.client.request(readAssetRaw(file.id))
  const fullPath = path.join(dir, 'assets', file.filename_disk)
  await pipeline(
    // @ts-ignore
    response,
    fs.createWriteStream(fullPath),
  )
}

export async function downloadAllFiles(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Downloading assets'))
  try {
    const fullPath = path.join(dir, 'assets')
    if (path && !fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, {recursive: true})
    }

    const fileList = await getAssetList()
    await Promise.all(fileList.map(file => downloadFile(file, dir).catch(error => {
      catchError(`Error downloading ${file.filename_disk}: ${error.message}`)
    })))
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
