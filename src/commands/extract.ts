import {readMe} from '@directus/sdk'
import {Command, Flags, ux} from '@oclif/core'
import fs from 'node:fs'
import path from 'node:path'
import slugify from 'slugify'

import {SEPARATOR} from '../lib/constants'
import extract from '../lib/extract/'
import {api} from '../lib/sdk'
import {getDirectusToken, getDirectusUrl} from '../lib/utils/auth'
import catchError from '../lib/utils/catch-error'
import {
  generatePackageJsonContent,
  generateReadmeContent,
} from '../lib/utils/template-defaults'

interface ExtractFlags {
  directusToken: string;
  directusUrl: string;
  programmatic: boolean;
  templateLocation: string;
  templateName: string;
}

export default class ExtractCommand extends Command {
  static description = 'Extract a template from a Directus instance.'

  static examples = [
    '$ directus-template-cli extract',
    '$ directus-template-cli extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055"',
  ]

  static flags = {
    directusToken: Flags.string({
      description: 'Token to use for the Directus instance',
      env: 'SOURCE_DIRECTUS_TOKEN',
    }),
    directusUrl: Flags.string({
      description: 'URL of the Directus instance to extract the template from',
      env: 'SOURCE_DIRECTUS_URL',
    }),
    programmatic: Flags.boolean({
      char: 'p',
      default: false,
      description: 'Run in programmatic mode (non-interactive) for use cases such as CI/CD pipelines.',
      summary: 'Run in programmatic mode',
    }),
    templateLocation: Flags.string({
      dependsOn: ['programmatic'],
      description: 'Directory to extract the template to',
      env: 'TEMPLATE_LOCATION',
    }),
    templateName: Flags.string({
      dependsOn: ['programmatic'],
      description: 'Name of the template',
      env: 'TEMPLATE_NAME',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ExtractCommand)
    const typedFlags = flags as unknown as ExtractFlags

    await (typedFlags.programmatic ? this.runProgrammatic(typedFlags) : this.runInteractive(typedFlags))
  }

  private async extractTemplate(templateName: string, directory: string, flags: ExtractFlags): Promise<void> {
    try {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {recursive: true})
      }

      const packageJSONContent = generatePackageJsonContent(templateName)
      const readmeContent = generateReadmeContent(templateName)

      const packageJSONPath = path.join(directory, 'package.json')
      const readmePath = path.join(directory, 'README.md')

      fs.writeFileSync(packageJSONPath, packageJSONContent)
      fs.writeFileSync(readmePath, readmeContent)
    } catch (error) {
      ux.error(`Failed to create directory or write files: ${error.message}`)
    }

    ux.log(SEPARATOR)

    ux.action.start(`Extracting template - from ${flags.directusUrl} to ${directory}`)

    await extract(directory)

    ux.action.stop()

    ux.log(SEPARATOR)
    ux.log('Template extracted successfully.')
    this.exit(0)
  }

  private async initializeDirectusApi(flags: ExtractFlags): Promise<void> {
    api.initialize(flags.directusUrl)
    try {
      api.setAuthToken(flags.directusToken)
      const response = await api.client.request(readMe())
      ux.log(`-- Logged in as ${response.first_name} ${response.last_name}`)
    } catch {
      catchError('Invalid Directus token. Please check your credentials.', {
        fatal: true,
      })
    }
  }

  private async runInteractive(flags: ExtractFlags): Promise<void> {
    const templateName = await ux.prompt('What is the name of the template?')

    const directory = await ux.prompt(
      "What directory would you like to extract the template to? If it doesn't exist, it will be created.",
      {default: `templates/${slugify(templateName, {lower: true, strict: true})}`},
    )

    ux.log(`You selected ${directory}`)

    // Get Directus URL and token
    const directusUrl = await getDirectusUrl()
    const directusToken = await getDirectusToken(directusUrl)

    flags.directusUrl = directusUrl
    flags.directusToken = directusToken

    await this.extractTemplate(templateName, directory, flags)
  }

  private async runProgrammatic(flags: ExtractFlags): Promise<void> {
    this.validateProgrammaticFlags(flags)

    const {templateLocation, templateName} = flags

    await this.initializeDirectusApi(flags)

    await this.extractTemplate(templateName, templateLocation, flags)
  }

  private validateProgrammaticFlags(flags: ExtractFlags): void {
    if (!flags.directusUrl || !flags.directusToken) {
      ux.error('Directus URL and token are required for programmatic mode.')
    }

    if (!flags.templateLocation) {
      ux.error('Template location is required for programmatic mode.')
    }

    if (!flags.templateName) {
      ux.error('Template name is required for programmatic mode.')
    }
  }
}
