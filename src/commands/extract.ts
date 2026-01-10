import {text, select, intro, log} from '@clack/prompts'
import {Flags, ux} from '@oclif/core'
import slugify from '@sindresorhus/slugify'
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'pathe'

import * as customFlags from '../flags/common.js'
import {DIRECTUS_PINK, DIRECTUS_PURPLE, SEPARATOR, BSL_LICENSE_TEXT, BSL_LICENSE_CTA, BSL_LICENSE_HEADLINE} from '../lib/constants.js'
import {animatedBunny} from '../lib/utils/animated-bunny.js'
import { BaseCommand } from './base.js'
import { track, shutdown } from '../services/posthog.js'

import extract from '../lib/extract/index.js'
import {type ExtractFlags, validateExtractFlags} from '../lib/extract/extract-flags.js'
import {getDirectusToken, getDirectusUrl, initializeDirectusApi, validateAuthFlags, getDirectusEmailAndPassword} from '../lib/utils/auth.js'
import catchError from '../lib/utils/catch-error.js'
import {
  generatePackageJsonContent,
  generateReadmeContent,
} from '../lib/utils/template-defaults.js'

export type {ExtractFlags} from '../lib/extract/extract-flags.js'

export default class ExtractCommand extends BaseCommand {
  static description = 'Extract a template from a Directus instance.'

  static examples = [
    '$ directus-template-cli extract',
    '$ directus-template-cli extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055"',
    '$ directus-template-cli extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055" --partial --no-content --no-users',
  ]

  static flags = {
    content: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract Content (data)',
    }),
    dashboards: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract Dashboards (dashboards, panels)',
    }),
    directusToken: customFlags.directusToken,
    directusUrl: customFlags.directusUrl,
    extensions: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract Extensions',
    }),
    files: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract Files (files, folders)',
    }),
    flows: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract Flows (operations, flows)',
    }),
    partial: Flags.boolean({
      dependsOn: ['programmatic'],
      description: 'Enable partial template extraction (all components enabled by default)',
      summary: 'Enable partial template extraction',
    }),
    permissions: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract permissions data. Collections include: directus_roles, directus_policies, directus_access, directus_permissions.',
      summary: 'Extract permissions (roles, policies, access, permissions)',
    }),
    programmatic: customFlags.programmatic,
    schema: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract schema (collections, fields, relations)',
    }),
    settings: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract settings (project settings, translations, presets)',
    }),
    templateLocation: customFlags.templateLocation,
    templateName: customFlags.templateName,
    userEmail: customFlags.userEmail,
    userPassword: customFlags.userPassword,
    users: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Extract users',
    }),
    disableTelemetry: customFlags.disableTelemetry,
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
    // Track start of extraction attempt
    if (!flags.disableTelemetry) {
      await track({
        command: 'extract',
        lifecycle: 'start',
        distinctId: this.userConfig.distinctId,
        flags: {
          templateName,
          templateLocation: directory,
          directusUrl: flags.directusUrl,
          programmatic: flags.programmatic,
        },
        runId: this.runId,
        config: this.config,
      });
    }

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

    ux.stdout(SEPARATOR)

    ux.action.start(`Extracting template - ${ux.colorize(DIRECTUS_PINK, templateName)} from ${ux.colorize(DIRECTUS_PINK, flags.directusUrl)} to ${ux.colorize(DIRECTUS_PINK, directory)}`)

    await extract(directory, flags)

    ux.action.stop()

    // Track completion before final messages/exit
    if (!flags.disableTelemetry) {
      await track({
        command: 'extract',
        lifecycle: 'complete',
        distinctId: this.userConfig.distinctId,
        flags: {
          templateName,
          templateLocation: directory,
          directusUrl: flags.directusUrl,
          programmatic: flags.programmatic,
        },
        runId: this.runId,
        config: this.config,
      });
      await shutdown();
    }

    log.warn(BSL_LICENSE_HEADLINE)
    log.info(BSL_LICENSE_TEXT)
    log.info(BSL_LICENSE_CTA)

    ux.stdout(SEPARATOR)
    ux.stdout('Template extracted successfully.')
    this.exit(0)
  }

  /**
   * Runs the interactive mode for template extraction
   * @param {ExtractFlags} flags - The command flags
   * @returns {Promise<void>} - Returns nothing
   */
  private async runInteractive(flags: ExtractFlags): Promise<void> {
    const validatedFlags = validateExtractFlags(flags)

    await animatedBunny('Let\'s extract a template!')

    intro(`${chalk.bgHex(DIRECTUS_PURPLE).white.bold('Directus Template CLI')} - Extract Template`)

    const templateName = await text({
      message: 'What is the name of the template you would like to extract?',
      placeholder: 'My Template',
    })

    const directory = await text({
      placeholder: `templates/${slugify(templateName as string)}`,
      defaultValue: `templates/${slugify(templateName as string)}`,
      message: "What directory would you like to extract the template to? If it doesn't exist, it will be created.",
    })

    ux.stdout(`You selected ${ux.colorize(DIRECTUS_PINK, directory as string)}`)

    ux.stdout(SEPARATOR)

    // Get Directus URL
    const directusUrl = await getDirectusUrl()
    validatedFlags.directusUrl = directusUrl as string

    // Prompt for login method
    const loginMethod = await select({
      options: [
        {label: 'Directus Access Token', value: 'token'},
        {label: 'Email and Password', value: 'email'},
      ],
      message: 'How do you want to log in?',
    })

    if (loginMethod === 'token') {
      const directusToken = await getDirectusToken(directusUrl as string)
      validatedFlags.directusToken = directusToken as string
    } else {
      const {userEmail, userPassword} = await getDirectusEmailAndPassword()
      validatedFlags.userEmail = userEmail as string
      validatedFlags.userPassword = userPassword as string
    }

    ux.stdout(SEPARATOR)

    await initializeDirectusApi(validatedFlags)

    await this.extractTemplate(templateName as string, directory as string, validatedFlags)
  }

  /**
   * Runs the programmatic mode for template extraction
   * @param {ExtractFlags} flags - The command flags
   * @returns {Promise<void>} - Returns nothing
   */
  private async runProgrammatic(flags: ExtractFlags): Promise<void> {
    this.validateProgrammaticFlags(flags)
    const validatedFlags = validateExtractFlags(flags)

    const {templateLocation, templateName} = validatedFlags

    await initializeDirectusApi(validatedFlags)

    await this.extractTemplate(templateName, templateLocation, validatedFlags)
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
