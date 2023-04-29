import {api} from '../api'
import collections from '../source/collections.json'
import path from 'node:path'

const userCollections = collections
.filter(item => !item.collection.startsWith('directus_', 0))
.filter(item => item.schema != null) // Filter our any "folders"

export default async () => {
  await loadSkeletonRecords() // Empty Records with IDs only
  await loadFullData() // Updates all skeleton records with their other values
  await loadSingletons()
}

// Handle mandatory fields properly
// Upload record id.
// SQL reset indexes once everything is loaded. - This is required for
// Project Settings - ?
const loadSkeletonRecords = async () => {
  for (const collection of userCollections) {
    const name = collection.collection
    const url = path.resolve(
      __dirname,
      `../source/collectionsData/${name}.json`,
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

const loadFullData = async () => {
  for (const collection of userCollections) {
    const name = collection.collection
    const url = path.resolve(
      __dirname,
      `../source/collectionsData/${name}.json`,
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

const loadSingletons = async () => {
  for (const collection of userCollections) {
    if (collection.meta.singleton) {
      const name = collection.collection
      const url = path.resolve(
        __dirname,
        `../source/collectionsData/${name}.json`,
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
