import {readMe} from '@directus/sdk'
import {Command, Flags, ux} from '@oclif/core'
import * as inquirer from 'inquirer'

import apply from '../lib/load/index.js'
import {api} from '../lib/sdk'
import {getDirectusToken, getDirectusUrl} from '../lib/utils/auth'
import {getCommunityTemplates, getGithubTemplate, getLocalTemplate} from '../lib/utils/get-template'
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

const separator = '------------------'

export default class ApplyCommand extends Command {
  static description = 'Apply a template to a blank Directus instance.'

  static examples = [
    '$ directus-template-cli apply',
    '$ directus-template-cli apply -p --directusUrl="http://localhost:8055" --directusToken="admin-token-here" --templateLocation="./my-template" --templateType="local"',
    '$ directus-template-cli apply -p --directusUrl="http://localhost:8055" --directusToken="admin-token-here" --templateLocation="./my-template" --templateType="local" --partial --no-content --no-users',
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
      ux.log(`Logged in as ${response.first_name} ${response.last_name}`)
    } catch {
      throw new Error('Invalid Directus token. Please check your credentials.')
    }
  }

  private redirectToDirectusPlus(): never {
    openUrl('https://directus.io/plus?utm_source=directus-template-cli&utm_content=apply-command')
    ux.log('Redirecting to Directus website.')
    ux.exit(0)
  }

  private async runInteractive(flags: ApplyFlags): Promise<void> {
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
      template = await getLocalTemplate(localTemplateDir)
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

    ux.log(`You selected ${template.templateName}`)
    ux.log(separator)

    // Get Directus URL and token
    const directusUrl = await getDirectusUrl()
    await getDirectusToken(directusUrl)

    if (template) {
      ux.log(`Applying template - ${template.templateName} to ${flags.directusUrl}`)
      await apply(template.directoryPath, flags)

      ux.action.stop()
      ux.log(separator)
      ux.log('Template applied successfully.')
      ux.exit(0)
    }
  }

  private async runProgrammatic(flags: ApplyFlags): Promise<void> {
    const validatedFlags = this.validateProgrammaticFlags(flags)

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
      throw new Error('Invalid template type')
    }
    }

    await this.initializeDirectusApi(validatedFlags)
    ux.log(`Applying template - ${template.templateName} to ${validatedFlags.directusUrl}`)
    await apply(template.directoryPath, validatedFlags)

    ux.action.stop()
    ux.log(separator)
    ux.log('Template applied successfully.')
    ux.exit(0)
  }

  private validateProgrammaticFlags(flags: ApplyFlags): ApplyFlags {
    if (!flags.directusUrl || !flags.directusToken) {
      ux.error('Directus URL and token are required for programmatic mode.')
    }

    if (!flags.templateLocation) {
      ux.error('Template location is required for programmatic mode.')
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
