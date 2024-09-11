import {createFolders, readFolders, updateFolder} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadFolders(dir: string) {
  const folders = readFile('folders', dir)
  ux.action.start(`Loading ${folders.length} folders`)

  try {
    // Fetch existing folders
    const existingFolders = await api.client.request(readFolders({
      limit: -1,
    }))
    const existingFolderIds = new Set(existingFolders.map(folder => folder.id))

    const foldersToAdd = folders.filter(folder => {
      if (existingFolderIds.has(folder.id)) {
        ux.log(`Skipping existing folder: ${folder.name}`)
        return false
      }

      return true
    })

    if (foldersToAdd.length > 0) {
      const folderSkeleton = foldersToAdd.map(folder => ({id: folder.id, name: folder.name}))

      // Create the folders
      await api.client.request(createFolders(folderSkeleton))
      ux.log(`Created ${foldersToAdd.length} new folders`)

      // Update the folders with relationships concurrently
      await Promise.all(foldersToAdd.map(async folder => {
        const {id, ...rest} = folder
        try {
          await api.client.request(updateFolder(id, rest))
          ux.log(`Updated relationships for folder: ${folder.name}`)
        } catch (error) {
          catchError(error)
        }
      }))
    } else {
      ux.log('No new folders to create')
    }
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
  ux.log('Loaded folders')
}
