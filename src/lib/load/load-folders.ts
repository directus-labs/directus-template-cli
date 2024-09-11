import {createFolders, updateFolder} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadFolders(dir: string) {
  const folders = readFile('folders', dir)
  ux.action.start(`Loading ${folders.length} folders`)

  try {
    const folderSkeleton = folders.map(folder => ({id: folder.id, name: folder.name}))

    // Create the folders
    await api.client.request(createFolders(folderSkeleton))

    // Update the folders with relationships concurrently
    await Promise.all(folders.map(async folder => {
      const {id, ...rest} = folder
      await api.client.request(updateFolder(id, rest))
    }))
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
  ux.log('Loaded folders')
}
