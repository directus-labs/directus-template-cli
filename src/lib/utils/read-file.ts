import fs from 'node:fs'
import path from 'node:path'

export default function readFile(file: string, dir: string): any[] {
  const filePath = path.join(dir, `${file}.json`) // Use path.join for proper path resolution
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`) // Improved error handling
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const obj = JSON.parse(fileContents)
  return obj
}
