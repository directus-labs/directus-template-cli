import path from 'pathe'

import readFile from '../utils/read-file.js'

export default async function checkTemplate(dir: string) {
  // Check for the collections,fields, and relations files
  try {
    const collections = readFile('collections', dir)
    const fields = readFile('fields', dir)

    const isCollectionsOk = collections.length > 0 && fields.length > 0
    return isCollectionsOk
  } catch (error) {
    console.error(error)
  }
}
