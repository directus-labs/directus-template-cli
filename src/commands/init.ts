import {cancel, log as clackLog, confirm, intro, isCancel, select, text} from '@clack/prompts'
import {Args, Flags} from '@oclif/core'
import chalk from 'chalk'
import {downloadTemplate} from 'giget'
import fs from 'node:fs'
import os from 'node:os'
import path from 'pathe'

import {disableTelemetry} from '../flags/common.js'
import {DIRECTUS_PURPLE} from '../lib/constants.js'
import {init} from '../lib/init/index.js'
import {animatedBunny} from '../lib/utils/animated-bunny.js'
import {createGigetString, parseGitHubUrl} from '../lib/utils/parse-github-url.js'
import {readTemplateConfig} from '../lib/utils/template-config.js'
import {createGitHub, type TemplateInfo} from '../services/github.js'
import { shutdown, track } from '../services/posthog.js'
import { BaseCommand } from './base.js'

export interface InitFlags {
  disableTelemetry?: boolean
  frontend?: string
  gitInit?: boolean
  installDeps?: boolean
  overwriteDir?: boolean
  template?: string
}

export interface InitArgs {
  directory: string
}

interface ExplicitInitFlags {
  gitInit: boolean
  installDeps: boolean
}

export default class InitCommand extends BaseCommand {
  static args = {
    directory: Args.directory({
      default: '.',
      description: 'Directory to create the project in',
      required: false,
    }),
  }
static description = 'Initialize a new Directus + Frontend monorepo using official or community starters.'
static examples = [
    '$ directus-template-cli init',
    '$ directus-template-cli init my-project',
    '$ directus-template-cli init --frontend=nextjs --template=simple-cms',
    '$ directus-template-cli init my-project --frontend=nextjs --template=simple-cms',
  ]
static flags = {
    disableTelemetry,
    frontend: Flags.string({
      description: 'Frontend framework to use (e.g., nextjs, nuxt, astro)',
    }),
    gitInit: Flags.boolean({
      aliases: ['git-init'],
      allowNo: true,
      default: true,
      description: 'Initialize a new Git repository',
    }),
    installDeps: Flags.boolean({
      aliases: ['install-deps'],
      allowNo: true,
      default: true,
      description: 'Install dependencies automatically',
    }),
    overwriteDir: Flags.boolean({
      aliases: ['overwrite-dir'],
      allowNo: true,
      default: false,
      description: 'Override the default directory',
    }),
    template: Flags.string({
      description: 'Template name (e.g., simple-cms) or GitHub URL (e.g., https://github.com/directus-labs/starters/tree/main/simple-cms)',
    }),
  }
private targetDir = '.'

  /**
   * Entrypoint for the command.
   * @returns Promise that resolves when the command is complete.
   */
  public async run(): Promise<void> {
    const {args, flags, metadata} = await this.parse(InitCommand)
    const typedFlags = flags as InitFlags
    const typedArgs = args as InitArgs
    const explicitFlags: ExplicitInitFlags = {
      gitInit: !metadata.flags.gitInit?.setFromDefault,
      installDeps: !metadata.flags.installDeps?.setFromDefault,
    }

    // Set the target directory and create it if it doesn't exist
    this.targetDir = path.resolve(args.directory as string)

    await this.runInteractive(typedFlags, typedArgs, explicitFlags)
  }

  private async confirmBooleanFlag(message: string): Promise<boolean> {
    const response = await confirm({
      initialValue: true,
      message,
    })

    if (isCancel(response)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    return response as boolean
  }

  private async confirmOverwriteDirectory(flags: InitFlags): Promise<boolean> {
    if (!fs.existsSync(this.targetDir) || flags.overwriteDir) return Boolean(flags.overwriteDir)

    const overwriteDirResponse = await confirm({
      initialValue: false,
      message: 'Directory already exists. Would you like to overwrite it?',
    })

    if (isCancel(overwriteDirResponse) || overwriteDirResponse === false) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    return true
  }

  private async promptForTargetDirectory(args: InitArgs): Promise<void> {
    if (args.directory && args.directory !== '.') return

    let dirResponse = await text({
      message: 'Enter the directory to create the project in:',
      placeholder: './my-directus-project',
    })

    if (isCancel(dirResponse)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    // If there's no response, set a default
    if (!dirResponse) {
      clackLog.warn('No directory provided, using default: ./my-directus-project')
      dirResponse = './my-directus-project'
    }

    this.targetDir = dirResponse as string
  }

  private async promptForValidTemplate(template: string | undefined, availableTemplates: TemplateInfo[]): Promise<string> {
    if (!template) {
      const templateResponse = await select<string>({
        message: 'Which Directus backend template would you like to use?',
        options: availableTemplates.map(tmpl => ({
          hint: tmpl.description,
          label: tmpl.name,
          value: tmpl.id,
        })),
      })

      if (isCancel(templateResponse)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      template = templateResponse
    }

    while (!template.startsWith('http') && !availableTemplates.some(t => t.id === template)) {
      clackLog.warn(`Template ID "${template}" is not valid. Please choose from the list provided or enter a direct GitHub URL.`)
      // eslint-disable-next-line no-await-in-loop
      const templateNameResponse = await text({
        message: 'Please enter a valid template ID, a direct GitHub URL, or Ctrl+C to cancel:',
      })

      if (isCancel(templateNameResponse)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      template = templateNameResponse as string
    }

    return template
  }

  /**
   * Interactive mode: prompts the user for each piece of info, with added template checks.
   * @param flags - The flags passed to the command.
   * @param args - The arguments passed to the command.
   * @returns void
   */
  private async runInteractive(flags: InitFlags, args: InitArgs, explicitFlags: ExplicitInitFlags): Promise<void> {

    // Show animated intro
    await animatedBunny('Let\'s create a new Directus project!')
    intro(`${chalk.bgHex(DIRECTUS_PURPLE).white.bold('Directus Template CLI')} - Create Project`)

    // Check Docker availability before proceeding
    const {createDocker} = await import('../services/docker.js')
    const {DOCKER_CONFIG} = await import('../lib/init/config.js')
    const dockerService = createDocker(DOCKER_CONFIG)
    const dockerStatus = await dockerService.checkDocker()

    if (!dockerStatus.installed || !dockerStatus.running) {
      cancel(dockerStatus.message || 'Docker is required to initialize a Directus project.')
      process.exit(1)
    }

    // Create GitHub service
    const github = createGitHub()

    // If no dir is provided, ask for it
    await this.promptForTargetDirectory(args)
    const overwriteDir = await this.confirmOverwriteDirectory(flags)

    // 1. Fetch available templates (now returns Array<{id: string, name: string, description?: string}>)
    const availableTemplates = await github.getTemplates()

    // 2. Prompt for template if not provided, then validate it against known templates or a direct URL.
    const template = await this.promptForValidTemplate(flags.template, availableTemplates)

    flags.template = template // Ensure the flag stores the ID

    // Download the template to a temporary directory to read its configuration
    const tempDir = path.join(os.tmpdir(), `directus-template-${Date.now()}`)
    let chosenFrontend = flags.frontend

    try {
      await downloadTemplate(createGigetString(parseGitHubUrl(template)), {
        dir: tempDir,
        force: true,
      })

      // Read template configuration
      const templateInfo = readTemplateConfig(tempDir)

      // 4. If template has frontends and user hasn't specified a valid one, ask from the list
      if (templateInfo?.frontendOptions.length > 0 && (!chosenFrontend || !templateInfo.frontendOptions.some(f => f.id === chosenFrontend))) {
        const frontendResponse = await select({
          message: 'Which frontend framework do you want to use?',
          options: 
            templateInfo.frontendOptions.map(frontend => ({
              label: frontend.name,
              value: frontend.id,
            }))
            // { label: 'No frontend', value: '' },
          ,
        })

        if (isCancel(frontendResponse)) {
          cancel('Project creation cancelled.')
          process.exit(0)
        }

        chosenFrontend = frontendResponse as string
      }

      flags.frontend = chosenFrontend
    } finally {
      // Clean up temporary directory
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { force: true, recursive: true })
      }
    }

    const installDeps = explicitFlags.installDeps
      ? flags.installDeps ?? true
      : await this.confirmBooleanFlag('Would you like to install project dependencies automatically?')

    const initGit = explicitFlags.gitInit
      ? flags.gitInit ?? true
      : await this.confirmBooleanFlag('Initialize a new Git repository?')

    // Track the command start unless telemetry is disabled
    if (!flags.disableTelemetry) {
      await track({
        command: 'init',
        config: this.config,
        distinctId: this.userConfig.distinctId,
        flags: {
          frontend: chosenFrontend,
          gitInit: initGit,
          installDeps,
          template,
        },
        lifecycle: 'start',
        runId: this.runId,
      });
    }

    // Initialize the project
    await init({
      dir: this.targetDir,
      flags: {
        frontend: chosenFrontend,
        gitInit: initGit,
        installDeps,
        overwriteDir,
        template,
      },

    })

    // Track the command completion unless telemetry is disabled
    if (!flags.disableTelemetry) {
      await track({
        command: 'init',
        config: this.config,
        distinctId: this.userConfig.distinctId,
        flags: {
          frontend: chosenFrontend,
          gitInit: initGit,
          installDeps,
          overwriteDir,
          template,
        },
        lifecycle: 'complete',
        runId: this.runId,
      });

      await shutdown()
    }

    process.exit(0)
  }

}
