import fs from 'node:fs'
import path from 'node:path'

interface Template {
  directoryPath: string;
  templateName: string;
}

export async function readTemplate(
  directoryPath: string,
): Promise<Template | null> {
  const packageFilePath = path.join(directoryPath, 'package.json')

  try {
    const packageData = await fs.promises.readFile(packageFilePath, 'utf8')
    const packageJson: { templateName?: string } = JSON.parse(packageData)

    if (packageJson.templateName) {
      return {
        directoryPath,
        templateName: packageJson.templateName,
      }
    }

    return null
  } catch (error) {
    console.error(
      `Failed to read package.json file in directory ${directoryPath}: ${error}`,
    )
    return null
  }
}

export async function readAllTemplates(
  directoryPath: string,
): Promise<Template[]> {
  const templates: Template[] = []

  const files = await fs.promises.readdir(directoryPath)

  for (const file of files) {
    const filePath = path.join(directoryPath, file)
    const stats = await fs.promises.stat(filePath)

    if (stats.isDirectory()) {
      const template = await readTemplate(filePath)
      if (template) {
        templates.push(template)
      }
    }
  }

  return templates
}
