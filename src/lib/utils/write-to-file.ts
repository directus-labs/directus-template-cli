import fs from 'node:fs'
import path from 'node:path'

export default async (fileName: string, data: any, dir: string) => {
  const folders = fileName.split('/')
  const endFileName = folders.pop()
  const folderPath = folders.join('/')

  // Generate the full path where you want to write the file
  const fullPath = path.join(dir, folderPath)

  // Check if the directory exists. Create if it doesn't.
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, {recursive: true})
  }

  // Construct the full file path
  const fullFilePath = path.join(fullPath, `${endFileName}.json`)

  try {
    // Write the file
    await fs.promises.writeFile(fullFilePath, JSON.stringify(data, null, 2))
    // console.log(`Wrote ${fullFilePath}`);
  } catch (error) {
    console.log('Error writing to file', error.data.errors)
  }
}
