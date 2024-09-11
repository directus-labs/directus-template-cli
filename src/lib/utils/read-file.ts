import fs from 'node:fs'
import path from 'node:path'

import catchError from './catch-error'

export default function readFile(file: string, dir: string): any[] {
  const filePath = path.join(dir, `${file}.json`) // Use path.join for proper path resolution
  if (!fs.existsSync(filePath)) {
    catchError(`File not found: ${filePath}`, {
      context: {
        dir,
        file,
        operation: 'readFile',
      },
    })
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const obj = JSON.parse(fileContents)
  return obj
}
