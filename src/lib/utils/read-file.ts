import fs from 'node:fs'
import path from 'pathe'

import catchError from './catch-error.js'

export default function readFile(file: string, dir: string): any[] {
  const filePath = path.join(dir, `${file}.json`) // Use path.join for proper path resolution
  if (!fs.existsSync(filePath)) {
    catchError(`File not found: ${filePath}`)
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const obj = JSON.parse(fileContents)
  return obj
}
