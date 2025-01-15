import {Command, Flags, ux} from '@oclif/core'
import inquirer from 'inquirer'
import fs from 'node:fs'
import path from 'node:path'
import slugify from 'slugify'

import * as customFlags from '../flags/common'
import {DIRECTUS_PINK, DIRECTUS_PURPLE, SEPARATOR} from '../lib/constants'
import extract from '../lib/extract/'
import {getDirectusToken, getDirectusUrl, initializeDirectusApi, validateAuthFlags} from '../lib/utils/auth'
import catchError from '../lib/utils/catch-error'
import {
  generatePackageJsonContent,
  generateReadmeContent,
} from '../lib/utils/template-defaults'

interface ExtractFlags {
  directusToken: string;
  directusUrl: string;
  excludeCollections?: string[];
  skipFiles?: boolean;
  programmatic: boolean;
  templateLocation: string;
  templateName: string;
  userEmail: string;
  userPassword: string;
}

export default class ExtractCommand extends Command {
  static description = 'Extract a template from a Directus instance.'

  static examples = [
    '$ directus-template-cli extract',
    '$ directus-template-cli extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055"',
    '$ directus-template-cli extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055" --excludeCollections=collection1,collection2',
  ]

  static flags = {
    directusToken: customFlags.directusToken,
    directusUrl: customFlags.directusUrl,
    excludeCollections: Flags.string({
      char: 'e',
      description: 'Comma-separated list of collection names to exclude from extraction',
      multiple: true,
      required: false
    }),
    skipFiles: Flags.boolean({
      char: 'f',
      description: 'Skip extracting files and assets',
      required: false,
      default: false
    }),
    programmatic: customFlags.programmatic,
    templateLocation: customFlags.templateLocation,
    templateName: customFlags.templateName,
    userEmail: customFlags.userEmail,
    userPassword: customFlags.userPassword,
  }

  /**
   * Main run method for the ExtractCommand
   * @returns {Promise<void>} - Returns nothing
   */
  public async run(): Promise<void> {
    const {flags} = await this.parse(ExtractCommand)
    const typedFlags = flags as unknown as ExtractFlags

    await (typedFlags.programmatic ? this.runProgrammatic(typedFlags) : this.runInteractive(typedFlags))
  }

  /**
   * Extracts the template to the specified directory
   * @param {string} templateName - The name of the template to extract
   * @param {string} directory - The directory to extract the template to
   * @param {ExtractFlags} flags - The command flags
   * @returns {Promise<void>} - Returns nothing
   */
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
      catchError(error, {
        context: {function: 'extractTemplate'},
        fatal: true,
        logToFile: true,
      })
    }

    ux.log(SEPARATOR)

    const exclusionMessage = flags.excludeCollections?.length
      ? ` (excluding ${flags.excludeCollections.join(', ')})`
      : ''

    ux.action.start(`Extracting template - ${ux.colorize(DIRECTUS_PINK, templateName)}${exclusionMessage} from ${ux.colorize(DIRECTUS_PINK, flags.directusUrl)} to ${ux.colorize(DIRECTUS_PINK, directory)}`)

    await extract(directory, {
        excludeCollections: flags.excludeCollections,
        skipFiles: flags.skipFiles
    });

    ux.action.stop()

    ux.log(SEPARATOR)
    ux.log('Template extracted successfully.')
    this.exit(0)
  }

  /**
   * Runs the interactive mode for template extraction
   * @param {ExtractFlags} flags - The command flags
   * @returns {Promise<void>} - Returns nothing
   */
  private async runInteractive(flags: ExtractFlags): Promise<void> {
    ux.styledHeader(ux.colorize(DIRECTUS_PURPLE, 'Directus Template CLI - Extract'))

    const templateName = await ux.prompt('What is the name of the template you would like to extract?')
    const directory = await ux.prompt(
      "What directory would you like to extract the template to? If it doesn't exist, it will be created.",
      {default: `templates/${slugify(templateName, {lower: true, strict: true})}`},
    )

    ux.log(`You selected ${ux.colorize(DIRECTUS_PINK, directory)}`)

    const excludeCollectionsInput = await ux.prompt(
      'Enter collection names to exclude (comma-separated) or press enter to skip',
      {required: false},
    )

    if (excludeCollectionsInput) {
      flags.excludeCollections = excludeCollectionsInput.split(',').map(name => name.trim())
    }

    const skipFiles = await ux.confirm('Skip extracting files and assets? (y/N)');
    flags.skipFiles = skipFiles

    ux.log(SEPARATOR)

    // Get Directus URL
    const directusUrl = await getDirectusUrl()
    flags.directusUrl = directusUrl

    // Prompt for login method
    const loginMethod = await inquirer.prompt([
      {
        choices: [
          {name: 'Directus Access Token', value: 'token'},
          {name: 'Email and Password', value: 'email'},
        ],
        default: 'token',
        message: 'How do you want to log in?',
        name: 'loginMethod',
        type: 'list',
      },
    ])

    if (loginMethod.loginMethod === 'token') {
      const directusToken = await getDirectusToken(directusUrl)
      flags.directusToken = directusToken
    } else {
      flags.userEmail = await ux.prompt('What is your email?')
      flags.userPassword = await ux.prompt('What is your password?', {type: 'hide'})
    }

    ux.log(SEPARATOR)

    await initializeDirectusApi(flags)

    await this.extractTemplate(templateName, directory, flags)
  }

  /**
   * Runs the programmatic mode for template extraction
   * @param {ExtractFlags} flags - The command flags
   * @returns {Promise<void>} - Returns nothing
   */
  private async runProgrammatic(flags: ExtractFlags): Promise<void> {
    this.validateProgrammaticFlags(flags)

    const {templateLocation, templateName} = flags

    await initializeDirectusApi(flags)

    await this.extractTemplate(templateName, templateLocation, flags)
  }

  /**
   * Validates the flags for programmatic mode
   * @param {ExtractFlags} flags - The command flags to validate
   * @throws {Error} If required flags are missing
   * @returns {void}
   */
  private validateProgrammaticFlags(flags: ExtractFlags): void {
    validateAuthFlags(flags)

    if (!flags.templateLocation) {
      ux.error('Template location is required for programmatic mode.')
    }

    if (!flags.templateName) {
      ux.error('Template name is required for programmatic mode.')
    }
  }
}
