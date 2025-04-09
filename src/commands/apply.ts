import {Command, Flags, ux} from '@oclif/core'
import {text, select, password, log, intro} from '@clack/prompts'
import * as path from 'pathe'
import {animatedBunny} from '../lib/utils/animated-bunny.js'
import {BSL_LICENSE_TEXT} from '../lib/constants.js'
import * as customFlags from '../flags/common.js'
import {DIRECTUS_PINK, DIRECTUS_PURPLE, SEPARATOR} from '../lib/constants.js'
import {type ApplyFlags, validateInteractiveFlags, validateProgrammaticFlags} from '../lib/load/apply-flags.js'
import apply from '../lib/load/index.js'
import {getDirectusToken, getDirectusUrl, initializeDirectusApi} from '../lib/utils/auth.js'
import catchError from '../lib/utils/catch-error.js'
import {getCommunityTemplates, getGithubTemplate, getInteractiveLocalTemplate, getLocalTemplate} from '../lib/utils/get-template.js'
import {logger} from '../lib/utils/logger.js'
import openUrl from '../lib/utils/open-url.js'
import chalk from 'chalk'

interface Template {
  directoryPath: string
  templateName: string
}

export default class ApplyCommand extends Command {
  static description = 'Apply a template to a blank Directus instance.'

  static examples = [
    '$ directus-template-cli apply',
    '$ directus-template-cli apply -p --directusUrl="http://localhost:8055" --directusToken="admin-token-here" --templateLocation="./my-template" --templateType="local"',
    '$ directus-template-cli@beta apply -p --directusUrl="http://localhost:8055" --directusToken="admin-token-here" --templateLocation="./my-template" --templateType="local" --partial --no-content --no-users',
  ]

  static flags = {
    content: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Load Content (data)',
    }),
    dashboards: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Load Dashboards (dashboards, panels)',
    }),
    directusToken: customFlags.directusToken,
    directusUrl: customFlags.directusUrl,
    extensions: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Load Extensions',
    }),
    files: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Load Files (files, folders)',
    }),
    flows: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Load Flows (operations, flows)',
    }),
    partial: Flags.boolean({
      dependsOn: ['programmatic'],
      description: 'Enable partial template application (all components enabled by default)',
      summary: 'Enable partial template application',
    }),
    permissions: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Loads permissions data. Collections include: directus_roles, directus_policies, directus_access, directus_permissions.',
      summary: 'Load permissions (roles, policies, access, permissions)',
    }),
    programmatic: customFlags.programmatic,
    schema: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Load schema (collections, relations)',
    }),
    settings: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Load settings (project settings, translations, presets)',
    }),
    templateLocation: customFlags.templateLocation,
    templateType: Flags.string({
      default: 'local',
      dependsOn: ['programmatic'],
      description: 'Type of template to apply. You can apply templates from our community repo, local directories, or public repositories from Github. Defaults to local. ',
      env: 'TEMPLATE_TYPE',
      options: ['community', 'local', 'github'],
      summary: 'Type of template to apply. Options: community, local, github.',
    }),
    userEmail: customFlags.userEmail,
    userPassword: customFlags.userPassword,
    users: Flags.boolean({
      allowNo: true,
      default: undefined,
      description: 'Load users',
    }),
  }

  /**
   * MAIN
   * Run the command
   * @returns {Promise<void>} - Returns nothing
   */
  public async run(): Promise<void> {
    const {flags} = await this.parse(ApplyCommand)
    const typedFlags = flags as unknown as ApplyFlags

    await (typedFlags.programmatic ? this.runProgrammatic(typedFlags) : this.runInteractive(typedFlags))
  }

  /**
   * INTERACTIVE
   * Run the command in interactive mode
   * @param flags - The ApplyFlags
   * @returns {Promise<void>} - Returns nothing
   */
  private async runInteractive(flags: ApplyFlags): Promise<void> {
    const validatedFlags = validateInteractiveFlags(flags)

    // Show animated intro
    await animatedBunny('Let\'s apply a template!')
    intro(`${chalk.bgHex(DIRECTUS_PURPLE).white.bold('Directus Template CLI')} - Apply Template`)

    const templateType = await select({
        options: [
        {label: 'Community templates', value: 'community'},
        {label: 'From a local directory', value: 'local'},
        {label: 'From a public GitHub repository', value: 'github'},
        {label: 'Get premium templates', value: 'directus-plus'},
      ],
      message: 'What type of template would you like to apply?',
    })

    let template: Template

    switch (templateType) {
    case 'community': {
      const templates = await getCommunityTemplates()
      const selectedTemplate = await select({
        options: templates.map(t => ({label: t.templateName, value: t})),
        message: 'Select a template.',
      })
      template = selectedTemplate as Template
      break
    }

    case 'local': {
      const localTemplateDir = await text({
        message: 'What is the local template directory?',
      })
      template = await this.selectLocalTemplate(localTemplateDir as string)
      break
    }

    case 'github': {
      const ghTemplateUrl = await text({
        message: 'What is the public GitHub repository URL?',
      })
      template = await getGithubTemplate(ghTemplateUrl as string)
      break
    }

    case 'directus-plus': {
      openUrl('https://directus.io/plus?utm_source=directus-template-cli&utm_content=apply-command')
      log.info('Redirecting to Directus website.')
      ux.exit(0)
    }
    }

    log.info(`You selected ${ux.colorize(DIRECTUS_PINK, template.templateName)}`)

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
      const userEmail = await text({
        message: 'What is your email?',
      })
      validatedFlags.userEmail = userEmail as string
      const userPassword = await password({
        message: 'What is your password?',
      })
      validatedFlags.userPassword = userPassword as string
    }

    await initializeDirectusApi(validatedFlags)

    if (template) {
      // /* TODO: Replace with custom styledHeader function */ ux.styledHeader(ux.colorize(DIRECTUS_PURPLE, `Applying template - ${template.templateName} to ${directusUrl}`))
      await apply(template.directoryPath, validatedFlags)

      ux.action.stop()
      ux.stdout(SEPARATOR)

      log.warn(BSL_LICENSE_TEXT)

      ux.stdout('Template applied successfully.')
      ux.exit(0)
    }
  }

  /**
   * PROGRAMMATIC
   * Run the command in programmatic mode
   * @param flags - The ApplyFlags
   * @returns {Promise<void>} - Returns nothing
   */
  private async runProgrammatic(flags: ApplyFlags): Promise<void> {
    const validatedFlags = validateProgrammaticFlags(flags)

    let template: Template

    switch (validatedFlags.templateType) {
    case 'community': {
      const templates = await getCommunityTemplates()
      template = templates.find(t => t.templateName === validatedFlags.templateLocation) || templates[0]
      break
    }

    case 'local': {
      template = await getLocalTemplate(validatedFlags.templateLocation)
      break
    }

    case 'github': {
      template = await getGithubTemplate(validatedFlags.templateLocation)
      break
    }

    default: {
      catchError('Invalid template type. Please check your template type.', {
        fatal: true,
      })
    }
    }

    await initializeDirectusApi(validatedFlags)

    const logMessage = `Applying template - ${template.templateName} to ${validatedFlags.directusUrl}`
    // /* TODO: Replace with custom styledHeader function */ ux.styledHeader(logMessage)
    logger.log('info', logMessage)

    await apply(template.directoryPath, validatedFlags)

    ux.action.stop()
    ux.stdout(SEPARATOR)
    ux.stdout('Template applied successfully.')
    // ux.exit(0)
  }

  /**
   * INTERACTIVE
   * Select a local template from the given directory
   * @param localTemplateDir - The local template directory path
   * @returns {Promise<Template>} - Returns the selected template
   */
  private async selectLocalTemplate(localTemplateDir: string): Promise<Template> {
    try {
      const templates = await getInteractiveLocalTemplate(localTemplateDir)

      if (templates.length === 1) {
        return templates[0]
      }

      const selectedTemplate = await select({
        options: templates.map(t => ({
          label: `${t.templateName} (${path.basename(t.directoryPath)})`,
          value: t,
        })),
        message: 'Multiple templates found. Please select one:',
      })
      return selectedTemplate as Template
    } catch (error) {
      if (error instanceof Error) {
        ux.error(error.message)
      } else {
        ux.error('An unknown error occurred while getting the local template.')
      }
    }
  }
}
