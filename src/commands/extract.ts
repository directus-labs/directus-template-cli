import {Command, ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'
import slugify from 'slugify'

import extract from '../lib/extract/'
import {getDirectusToken, getDirectusUrl} from '../lib/utils/auth'
import {
  generatePackageJsonContent,
  generateReadmeContent,
} from '../lib/utils/template-defaults'

const separator = '------------------'

export default class ExtractCommand extends Command {
  static description = 'Extract a template from a Directus instance.'

  static examples = ['$ directus-template-cli extract']

  public async run(): Promise<void> {
    let templateName
    let directory;
    if (process.env.DIRECTUS_TEMPLATE_NAME) {
      templateName = process.env.DIRECTUS_TEMPLATE_NAME;
    } else {
      templateName = await ux.prompt('What is the name of the template?.')
    }
    if (process.env.DIRECTUS_TEMPLATE_DIR) {
      directory = process.env.DIRECTUS_TEMPLATE_DIR;
    } else {
      directory = await ux.prompt(
        "What directory would you like to extract the template to? If it doesn't exist, it will be created.", {default: `templates/${slugify(templateName, {lower: true, strict: true })}`},
      )
    }

    this.log(`You selected ${directory}`)

    try {
      // Check if directory exists, if not, then create it.
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {recursive: true})
      }

      // Create package.json and README.md
      const packageJSONContent = generatePackageJsonContent(templateName)
      const readmeContent = generateReadmeContent(templateName)

      // Write the content to the specified directory
      const packageJSONPath = path.join(directory, 'package.json')
      const readmePath = path.join(directory, 'README.md')

      fs.writeFileSync(packageJSONPath, packageJSONContent)
      fs.writeFileSync(readmePath, readmeContent)
    } catch (error) {
      console.error(
        `Failed to create directory or write files: ${error.message}`,
      )
    }

    this.log(separator)

    const directusUrl = await getDirectusUrl()
    await getDirectusToken(directusUrl)

    this.log(separator)

    // Run the extract script
    ux.action.start(
      `Extracting template - from ${directusUrl} to ${directory}`,
    )

    await extract(directory)

    ux.action.stop()

    this.log(separator)

    this.log('Template extracted successfully.')

    this.exit(0)
  }
}
