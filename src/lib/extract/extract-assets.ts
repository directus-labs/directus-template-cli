import {readFiles} from '@directus/sdk'
import {ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'pathe'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'

// Keep asset pages conservative because each item may trigger a binary download.
const PAGE_SIZE = 100

interface DirectusFile {
  filename_disk: string
  id: string
}

async function getAssetPage(page: number): Promise<DirectusFile[]> {
  return api.client.request(readFiles({limit: PAGE_SIZE, page})) as unknown as DirectusFile[]
}

async function downloadFile(file: DirectusFile, dir: string) {
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const response: Response | string = await api.client.request(() => ({
    method: 'GET',
    path: `/assets/${file.id}`,
  }))
  const fullPath = path.join(dir, 'assets', file.filename_disk)

  if (typeof response === 'string') {
    fs.writeFileSync(fullPath, response)
  } else {
    const data = await response.arrayBuffer()
    fs.writeFileSync(fullPath, Buffer.from(data))
  }
}

export async function downloadAllFiles(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Downloading assets'))
  try {
    const fullPath = path.join(dir, 'assets')
    if (path && !fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, {recursive: true})
    }

    let page = 1
    while (true) {
      ux.action.status = `Downloading assets page ${page}`
      // Intentional: page asset metadata sequentially to avoid queuing all downloads at once.
      // eslint-disable-next-line no-await-in-loop
      const fileList = await getAssetPage(page)

      // Intentional: finish one asset page before fetching the next page.
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        fileList.map((file) =>
          downloadFile(file, dir).catch((error) => {
            catchError(`Error downloading ${file.filename_disk}: ${error.message}`)
          }),
        ),
      )

      if (fileList.length < PAGE_SIZE) break
      page++
    }
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
