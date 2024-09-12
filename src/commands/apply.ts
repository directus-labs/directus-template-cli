import {readMe} from '@directus/sdk'
import {Command, Flags, ux} from '@oclif/core'
import * as inquirer from 'inquirer'

import {DIRECTUS_PINK, DIRECTUS_PURPLE, SEPARATOR} from '../lib/constants'
import apply from '../lib/load/index.js'
import {api} from '../lib/sdk'
import {getDirectusToken, getDirectusUrl} from '../lib/utils/auth'
import catchError from '../lib/utils/catch-error'
import {getCommunityTemplates, getGithubTemplate, getInteractiveLocalTemplate, getLocalTemplate} from '../lib/utils/get-template'
import {logger} from '../lib/utils/logger'
import openUrl from '../lib/utils/open-url'

interface Template {
  directoryPath: string;
  templateName: string;
}

interface ApplyFlags {
  content: boolean;
  dashboards: boolean;
  directusToken: string;
  directusUrl: string;
  extensions: boolean;
  files: boolean;
  flows: boolean;
  partial: boolean;
  permissions: boolean;
  programmatic: boolean;
  schema: boolean;
  settings: boolean;
  templateLocation: string;
  templateType: 'community' | 'github' | 'local';
  users: boolean;
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
      default: templateFlagsDefault as unknown as boolean,
      description: 'Load Content (data)',
      relationships: [
        {flags: ['schema', 'files'], type: 'all'},
      ],
    }),
    dashboards: Flags.boolean({
      allowNo: true,
      default: templateFlagsDefault as unknown as boolean,
      description: 'Load Dashboards (dashboards, panels)',
    }),
    directusToken: Flags.string({
      description: 'Token to use for the Directus instance',
      env: 'TARGET_DIRECTUS_TOKEN',
    }),
    directusUrl: Flags.string({
      description: 'URL of the Directus instance to apply the template to',
      env: 'TARGET_DIRECTUS_URL',
    }),
    extensions: Flags.boolean({
      allowNo: true,
      default: templateFlagsDefault as unknown as boolean,
      description: 'Load Extensions',
    }),
    files: Flags.boolean({
      allowNo: true,
      default: templateFlagsDefault as unknown as boolean,
      description: 'Load Files (files, folders)',
    }),
    flows: Flags.boolean({
      allowNo: true,
      default: templateFlagsDefault as unknown as boolean,
      description: 'Load Flows (operations, flows)',
    }),
    partial: Flags.boolean({
      dependsOn: ['programmatic'],
      description: 'Enable partial template application (all components enabled by default)',
      summary: 'Enable partial template application',
    }),
    permissions: Flags.boolean({
      allowNo: true,
      default: templateFlagsDefault as unknown as boolean,
      description: 'Loads permissions data. Collections include: directus_roles, directus_policies, directus_access, directus_permissions.',
      summary: 'Load permissions (roles, policies, access, permissions)',
    }),
    programmatic: Flags.boolean({
      char: 'p',
      default: false,
      description: 'Run in programmatic mode (non-interactive) for use cases such as CI/CD pipelines.',
      summary: 'Run in programmatic mode',
    }),
    schema: Flags.boolean({
      allowNo: true,
      default: templateFlagsDefault as unknown as boolean,
      description: 'Load schema (collections, relations)',
    }),
    settings: Flags.boolean({
      allowNo: true,
      default: templateFlagsDefault as unknown as boolean,
      description: 'Load settings (project settings, translations, presets)',
    }),
    templateLocation: Flags.string({
      dependsOn: ['programmatic', 'templateType'],
      description: 'Location of the template to apply',
      env: 'TEMPLATE_LOCATION',
    }),
    templateType: Flags.string({
      default: 'local',
      dependsOn: ['programmatic'],
      description: 'Type of template to apply. You can apply templates from our community repo, local directories, or public repositories from Github. Defaults to local. ',
      env: 'TEMPLATE_TYPE',
      options: ['community', 'local', 'github'],
      summary: 'Type of template to apply. Options: community, local, github.',
    }),
    users: Flags.boolean({
      allowNo: true,
      default: templateFlagsDefault as unknown as boolean,
      description: 'Load users',
      relationships: [
        {flags: ['permissions'], type: 'all'},
      ],
    }),
  }

  // MAIN FUNCTION
  public async run(): Promise<void> {
    const {flags} = await this.parse(ApplyCommand)
    const typedFlags = flags as unknown as ApplyFlags

    await (typedFlags.programmatic ? this.runProgrammatic(typedFlags) : this.runInteractive(typedFlags))
  }

  private async initializeDirectusApi(flags: ApplyFlags): Promise<void> {
    api.initialize(flags.directusUrl)
    try {
      api.setAuthToken(flags.directusToken)
      const response = await api.client.request(readMe())
      ux.log(`-- Logged in as ${response.first_name} ${response.last_name}`)
    } catch {
      catchError('-- Invalid Directus token. Please check your credentials.', {
        fatal: true,
      })
    }
  }

  private redirectToDirectusPlus(): never {
    openUrl('https://directus.io/plus?utm_source=directus-template-cli&utm_content=apply-command')
    ux.log('Redirecting to Directus website.')
    ux.exit(0)
  }

  private async runInteractive(flags: ApplyFlags): Promise<void> {
    const validatedFlags = this.validateFlags(flags)

    ux.styledHeader(ux.colorize(DIRECTUS_PURPLE, 'Welcome to the Directus Template CLI'))

    const templateType = await inquirer.prompt([
      {
        choices: [
          {name: 'Community templates', value: 'community'},
          {name: 'From a local directory', value: 'local'},
          {name: 'From a public GitHub repository', value: 'github'},
          {name: 'Get premium templates', value: 'directus-plus'},
        ],
        message: 'What type of template would you like to apply?',
        name: 'templateType',
        type: 'list',
      },
    ])

    let template: Template

    switch (templateType.templateType) {
    case 'community': {
      const templates = await getCommunityTemplates()
      const {selectedTemplate} = await inquirer.prompt([
        {
          choices: templates.map(t => ({name: t.templateName, value: t})),
          message: 'Select a template.',
          name: 'selectedTemplate',
          type: 'list',
        },
      ])
      template = selectedTemplate
      break
    }

    case 'local': {
      const localTemplateDir = await ux.prompt('What is the local template directory?')
      template = await this.selectLocalTemplate(localTemplateDir)
      break
    }

    case 'github': {
      const ghTemplateUrl = await ux.prompt('What is the public GitHub repository URL?')
      template = await getGithubTemplate(ghTemplateUrl)
      break
    }

    case 'directus-plus': {
      this.redirectToDirectusPlus()
    }
    }

    ux.log(`You selected ${ux.colorize(DIRECTUS_PINK, template.templateName)}`)
    ux.log(SEPARATOR)

    // Get Directus URL and token
    const directusUrl = await getDirectusUrl()
    const directusToken = await getDirectusToken(directusUrl)

    flags.directusUrl = directusUrl
    flags.directusToken = directusToken

    if (template) {
      ux.styledHeader(ux.colorize(DIRECTUS_PURPLE, `Applying template - ${template.templateName} to ${directusUrl}`))
      await apply(template.directoryPath, validatedFlags)

      ux.action.stop()
      ux.log(SEPARATOR)
      ux.info('Template applied successfully.')
      ux.exit(0)
    }
  }

  private async runProgrammatic(flags: ApplyFlags): Promise<void> {
    const validatedFlags = this.validateFlags(flags)

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

    await this.initializeDirectusApi(validatedFlags)

    const logMessage = `Applying template - ${template.templateName} to ${validatedFlags.directusUrl}`
    ux.styledHeader(logMessage)
    logger.log('info', logMessage)

    await apply(template.directoryPath, validatedFlags)

    ux.action.stop()
    ux.log(SEPARATOR)
    ux.info('Template applied successfully.')
    ux.exit(0)
  }

  private async selectLocalTemplate(localTemplateDir: string): Promise<Template> {
    try {
      const templates = await getInteractiveLocalTemplate(localTemplateDir)

      if (templates.length === 1) {
        return templates[0]
      }

      const {selectedTemplate} = await inquirer.prompt([
        {
          choices: templates.map(t => ({name: `${t.templateName} (${ux.colorize('dim', t.directoryPath)})`, value: t})),
          message: 'Multiple templates found. Please select one:',
          name: 'selectedTemplate',
          type: 'list',
        },
      ])
      return selectedTemplate
    } catch (error) {
      if (error instanceof Error) {
        ux.error(error.message)
      } else {
        ux.error('An unknown error occurred while getting the local template.')
      }
    }
  }

  private validateFlags(flags: ApplyFlags): ApplyFlags {
    if (flags.programmatic) {
      if (!flags.directusUrl || !flags.directusToken) {
        ux.error('Directus URL and token are required for programmatic mode.')
      }

      if (!flags.templateLocation) {
        ux.error('Template location is required for programmatic mode.')
      }
    }

    const loadFlags = [
      'content',
      'dashboards',
      'extensions',
      'files',
      'flows',
      'permissions',
      'schema',
      'settings',
      'users',
    ] as const

    const validatedFlags = {...flags}

    if (flags.partial) {
      const enabledFlags = loadFlags.filter(flag => flags[flag] === true)

      if (enabledFlags.length === 0) {
        ux.error('When using --partial, at least one component flag must be set to true.')
      }

      // Handle dependencies
      if (flags.content) {
        validatedFlags.schema = true
        validatedFlags.files = true
        if (!flags.schema || !flags.files) {
          ux.warn('Content loading requires schema and files. Enabling schema and files flags.')
        }
      }

      if (flags.users) {
        validatedFlags.permissions = true
        if (!flags.permissions) {
          ux.warn('User loading requires permissions. Enabling permissions flag.')
        }
      }
    } else {
      // If not partial, set all flags to true
      for (const flag of loadFlags) {
        validatedFlags[flag] = true
      }
    }

    return validatedFlags
  }
}

function templateFlagsDefault({flags}: {flags: ApplyFlags}) {
  // If programmatic is true, and partial is not set, return true
  if (flags.programmatic && !flags.partial) {
    return true
  }

  return false
}
