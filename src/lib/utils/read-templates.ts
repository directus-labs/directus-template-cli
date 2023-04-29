import fs from 'node:fs'
import path from 'node:path'

interface Template {
  // Define the structure of the template data here
  // Example: name: string;
  directoryPath: string;
  templateName: string;
}

export default async function readTemplates(directoryPath: string): Promise<Template[]> {
  const templates: Template[] = []

  // Read the contents of the directory
  const files = await fs.promises.readdir(directoryPath)

  // Loop through each file in the directory
  for (const file of files) {
    // Check if the file is a directory
    const filePath = path.join(directoryPath, file)
    const stats = await fs.promises.stat(filePath)

    if (stats.isDirectory()) {
      // Read the contents of the package.json file in the directory
      const packageFilePath = path.join(filePath, 'package.json')

      try {
        const packageData = await fs.promises.readFile(packageFilePath, 'utf-8')
        const packageJson: { templateName?: string } = JSON.parse(packageData)

        if (packageJson.templateName) {
          const template: Template = {
            directoryPath: filePath,
            templateName: packageJson.templateName,
          }

          templates.push(template)
        }
      } catch (error) {
        console.error(`Failed to read package.json file in directory ${filePath}: ${error}`)
      }
    }
  }

  return templates
}
