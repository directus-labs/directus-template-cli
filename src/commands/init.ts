import {confirm, intro, select, text, isCancel, cancel, log as clackLog} from '@clack/prompts'
import {Args, Flags, ux} from '@oclif/core'
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'pathe'
import {disableTelemetry} from '../flags/common.js'
import {DIRECTUS_PURPLE} from '../lib/constants.js'
import {init} from '../lib/init/index.js'
import {animatedBunny} from '../lib/utils/animated-bunny.js'
import {createGitHub} from '../services/github.js'
import { BaseCommand } from './base.js'
import { track, shutdown } from '../services/posthog.js'

export interface InitFlags {
  frontend?: string
  gitInit?: boolean
  installDeps?: boolean
  overrideDir?: boolean
  template?: string
  disableTelemetry?: boolean
}

export interface InitArgs {
  directory: string
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
    overrideDir: Flags.boolean({
      default: false,
      description: 'Override the default directory',
    }),
    template: Flags.string({
      description: 'Template name (e.g., simple-cms) or GitHub URL (e.g., https://github.com/directus-labs/starters/tree/main/simple-cms)',
    }),
    disableTelemetry: disableTelemetry,
  }

  private targetDir = '.'

  /**
   * Entrypoint for the command.
   * @returns Promise that resolves when the command is complete.
   */
  public async run(): Promise<void> {
    const {args, flags} = await this.parse(InitCommand)
    const typedFlags = flags as InitFlags
    const typedArgs = args as InitArgs

    // Set the target directory and create it if it doesn't exist
    this.targetDir = path.resolve(args.directory as string)

    await this.runInteractive(typedFlags, typedArgs)
  }

  /**
   * Interactive mode: prompts the user for each piece of info, with added template checks.
   * @param flags - The flags passed to the command.
   * @param args - The arguments passed to the command.
   * @returns void
   */
  private async runInteractive(flags: InitFlags, args: InitArgs): Promise<void> {

    // Show animated intro
    await animatedBunny('Let\'s create a new Directus project!')
    intro(`${chalk.bgHex(DIRECTUS_PURPLE).white.bold('Directus Template CLI')} - Create Project`)

    // Create GitHub service
    const github = createGitHub()

    // If no dir is provided, ask for it
    if (!args.directory || args.directory === '.') {
      const dirResponse = await text({
        message: 'Enter the directory to create the project in:',
        placeholder: './my-directus-project',
      })

      if (isCancel(dirResponse)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      this.targetDir = dirResponse as string
    }

    if (fs.existsSync(this.targetDir) && !flags.overrideDir) {
      const overrideDirResponse = await confirm({
        message: 'Directory already exists. Would you like to overwrite it?',
      })

      if (isCancel(overrideDirResponse)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      if (overrideDirResponse) {
        flags.overrideDir = true
      }
    }

    // 1. Fetch available templates
    const availableTemplates = await github.getTemplates()

    // 2. Prompt for template if not provided
    let {template} = flags

    if (!template) {
      const templateResponse = await select({
        message: 'Which Directus backend template would you like to use?',
        options: availableTemplates.map(template => ({
          label: template,
          value: template,
        })),
      })

      if (isCancel(templateResponse)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      template = templateResponse as string
    }

    // 3. Validate that the template exists, fetch subdirectories
    let directories = await github.getTemplateDirectories(template)

    while (directories.length === 0) {
      this.log(`Template "${template}" doesn't seem to exist in directus-labs/directus-starters.`)
      const templateNameResponse = await text({
        message: 'Please enter a valid template name, or Ctrl+C to cancel:',
      })

      if (isCancel(templateNameResponse)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      template = templateNameResponse as string
      directories = await github.getTemplateDirectories(template)
    }

    flags.template = template

    // Filter out the 'directus' folder; the rest are potential frontends
    const potentialFrontends = directories.filter(dir => dir !== 'directus')
    if (potentialFrontends.length === 0) {
      this.error(`No frontends found for template "${template}". Exiting.`)
    }

    // 4. If user hasn't specified a valid flags.frontend, ask from the list
    let {frontend: chosenFrontend} = flags

    if (!chosenFrontend || !potentialFrontends.includes(chosenFrontend)) {
      const frontendResponse = await select({
        message: 'Which frontend framework do you want to use?',
        options: potentialFrontends.map(frontend => ({
          label: frontend,
          value: frontend,
        })),
      })

      if (isCancel(frontendResponse)) {
        cancel('Project creation cancelled.')
        process.exit(0)
      }

      chosenFrontend = frontendResponse as string
    }

    flags.frontend = chosenFrontend

    const installDepsResponse = await confirm({
      initialValue: true,
      message: 'Would you like to install project dependencies automatically?',
    })

    if (isCancel(installDepsResponse)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    const installDeps = installDepsResponse as boolean

    const initGitResponse = await confirm({
      initialValue: true,
      message: 'Initialize a new Git repository?',
    })

    if (isCancel(initGitResponse)) {
      cancel('Project creation cancelled.')
      process.exit(0)
    }

    const initGit = initGitResponse as boolean

    // Track the command start unless telemetry is disabled
    if (!flags.disableTelemetry && !this.userConfig.disableTelemetry) {
      await track({
        lifecycle: 'start',
        distinctId: this.userConfig.distinctId,
        command: 'init',
        flags: {
          frontend: chosenFrontend,
          gitInit: initGit,
          installDeps,
          template,
        },
        runId: this.runId,
        config: this.config,
        debug: true,
      });
    }

    // Initialize the project
    await init({
      dir: this.targetDir,
      flags: {
        frontend: chosenFrontend,
        gitInit: initGit,
        installDeps,
        template,
        overrideDir: flags.overrideDir,
      },

    })

    // Track the command completion unless telemetry is disabled
    if (!flags.disableTelemetry && !this.userConfig.disableTelemetry) {
      await track({
        command: 'init',
        lifecycle: 'complete',
        distinctId: this.userConfig.distinctId,
        flags: {
          frontend: chosenFrontend,
          gitInit: initGit,
          installDeps,
          template,
          overrideDir: flags.overrideDir,
        },
        runId: this.runId,
        config: this.config,
        debug: true,
      });

      await shutdown()
    }

    ux.exit(0)
  }


}
