import {createFolders, updateFolder} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

export default async function loadFolders(dir: string) {
  ux.action.start('Loading folders')

  try {
    const folders = readFile('folders', dir)

    const folderSkeleton = folders.map(folder => ({id: folder.id, name: folder.name}))

    // Create the folders
    await api.client.request(createFolders(folderSkeleton))

    // Update the folders with relationships concurrently
    await Promise.all(folders.map(async folder => {
      const {id, ...rest} = folder
      await api.client.request(updateFolder(id, rest))
    }))
  } catch (error) {
    logError(error)
  }
}
