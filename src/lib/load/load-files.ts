import FormData from 'form-data'
import {api} from '../api'
import readFile from '../utils/read-file'

import fs from 'node:fs'
import path from 'node:path'

export default async (dir: string) => {
  const assets = await readFile('files', dir)
  for (const asset of assets) {
    const fileName = asset.filename_disk
    const assetPath = path.resolve(
      __dirname,
      '..',
      'source',
      'assets',
      fileName,
    )
    const fileStream = fs.createReadStream(assetPath)

    const form = new FormData()
    form.append('id', asset.id)
    form.append('file', fileStream)
    // if (asset.title) form.append('title', asset.title);
    // if (asset.description) form.append('description', asset.description);
    // if (asset.folder) form.append('folder', asset.folder);
    // form.append;

    try {
      const {data} = await api.post('files', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      await api.patch(`files/${asset.id}`, {
        // Add to form
        title: asset.title,
        description: asset.description,
        folder: asset.folder,
      })
      console.log(`Uploaded ${asset.id}`)
    } catch (error) {
      console.log(error.response.data.errors)
    }
  }
  // console.log('file', file);
}
