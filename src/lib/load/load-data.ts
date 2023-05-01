import {api} from '../api'
import path from 'node:path'

export default async function loadData(collections: any, dir:string) {
  const userCollections = collections
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.schema !== null) // Filter our any "folders"
  await loadSkeletonRecords(userCollections, dir) // Empty Records with IDs only
  await loadFullData(userCollections, dir) // Updates all skeleton records with their other values
  await loadSingletons(userCollections, dir)
}

// Handle mandatory fields properly
// Upload record id.
// SQL reset indexes once everything is loaded. - This is required for
// Project Settings - ?
const loadSkeletonRecords = async (userCollections: any, dir:string) => {
  for (const collection of userCollections) {
    const name = collection.collection
    const url = path.resolve(
      dir,
      'content',
      `${name}.json`,
    )
    try {
      const sourceData = (await import(url)).default

      if (!collection.meta.singleton) {
        for (const entry of sourceData) {
          try {
            const {data} = await api.post(`items/${name}`, {
              id: entry.id,
            })
          } catch (error) {
            if (
              error.response.data.errors[0].extensions.code !==
              'RECORD_NOT_UNIQUE'
            ) {
              console.log(
                'error creating skeleton record',
                error.response.data.errors,
              )
            }
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
}

const loadFullData = async (userCollections: any, dir:string) => {
  for (const collection of userCollections) {
    const name = collection.collection
    const url = path.resolve(
      dir,
      'content',
      `${name}.json`,
    )
    try {
      const sourceData = (await import(url)).default

      if (!collection.meta.singleton) {
        for (const row of sourceData) {
          const {data} = await api.patch(`items/${name}/${row.id}`, row)
        }
      }
    } catch (error) {
      console.log(`Error updating ${name}`, error)
    }
  }
}

const loadSingletons = async (userCollections: any, dir:string) => {
  for (const collection of userCollections) {
    if (collection.meta.singleton) {
      const name = collection.collection
      const url = path.resolve(
        dir,
        'content',
        `${name}.json`,
      )
      try {
        const sourceData = (await import(url)).default
        const {data} = await api.patch(`items/${name}`, sourceData)
      } catch (error) {
        console.log(
          `Error loading singleton ${name}`,
          error.response.data.errors,
        )
      }
    }
  }
}
