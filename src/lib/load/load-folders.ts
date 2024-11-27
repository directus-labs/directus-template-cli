import {createFolders, readFolders, updateFolder} from '@directus/sdk'
import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants'
import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

export default async function loadFolders(dir: string) {
  const folders = readFile('folders', dir)
  ux.action.start(ux.colorize(DIRECTUS_PINK, `Loading ${folders.length} folders`))

  if (folders && folders.length > 0) {
    try {
      // Fetch existing folders
      const existingFolders = await api.client.request(readFolders({
        limit: -1,
      }))
      const existingFolderIds = new Set(existingFolders.map(folder => folder.id))

      const foldersToAdd = folders.filter(folder => {
        if (existingFolderIds.has(folder.id)) {
          return false
        }

        return true
      })

      if (foldersToAdd.length > 0) {
        const folderSkeleton = foldersToAdd.map(folder => ({id: folder.id, name: folder.name}))

        // Create the folders
        await api.client.request(createFolders(folderSkeleton))

        // Update the folders with relationships concurrently
        await Promise.all(foldersToAdd.map(async folder => {
          const {id, ...rest} = folder
          try {
            await api.client.request(updateFolder(id, rest))
          } catch (error) {
            catchError(error)
          }
        }))
      } else {
        // ux.info('-- No new folders to create')
      }
    } catch (error) {
      catchError(error)
    }
  }

  ux.action.stop()
}
