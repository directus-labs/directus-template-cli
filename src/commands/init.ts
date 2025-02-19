import {Args, Command, Flags, ux} from '@oclif/core'
import inquirer from 'inquirer'
import fs from 'node:fs'
import path from 'node:path'

import {init} from '../lib/init'
import {createGitHub} from '../services/github'

interface InitFlags {
  frontend?: string
  gitInit?: boolean
  installDeps?: boolean
  overrideDir?: boolean
  programmatic: boolean
  template?: string

}

export default class InitCommand extends Command {
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
    '$ directus-template-cli init --frontend=nextjs --template=simple-cms --programmatic',
    '$ directus-template-cli init my-project --frontend=nextjs --template=simple-cms --programmatic',
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
    programmatic: Flags.boolean({
      char: 'p',
      default: false,
      description: 'Run in programmatic mode (non-interactive)',
    }),
    template: Flags.string({
      description: 'Template name (e.g., simple-cms) or GitHub URL (e.g., https://github.com/directus-labs/starters/tree/main/simple-cms)',
    }),
  }

  private targetDir: string = '.'

  /**
   * Entrypoint for the command.
   * @returns Promise that resolves when the command is complete.
   */
  public async run(): Promise<void> {
    const {args, flags} = await this.parse(InitCommand)
    const typedFlags = flags as InitFlags

    // Set the target directory and create it if it doesn't exist
    this.targetDir = path.resolve(args.directory as string)
    // if (!fs.existsSync(this.targetDir)) {
    //   fs.mkdirSync(this.targetDir, {recursive: true})
    // }

    await (typedFlags.programmatic ? this.runProgrammatic(typedFlags) : this.runInteractive(typedFlags))
  }

  /**
   * Interactive mode: prompts the user for each piece of info, with added template checks.
   * @param flags - The flags passed to the command.
   * @returns void
   */
  private async runInteractive(flags: InitFlags): Promise<void> {
    ux.styledHeader('Directus Template CLI - Init')

    // Create GitHub service
    const github = createGitHub()

    // 1. Fetch available templates
    const availableTemplates = await github.getTemplates()

    // 2. Prompt for template if not provided
    let {template} = flags
    if (!template) {
      template = await inquirer
      .prompt<{ template: string }>([
        {
          choices: availableTemplates,
          message: 'Which Directus starters template would you like to use?',
          name: 'template',
          type: 'list',
        },
      ])
      .then(ans => ans.template)
    }

    // 3. Validate that the template exists, fetch subdirectories
    let directories = await github.getTemplateDirectories(template)

    while (directories.length === 0) {
      this.log(`Template "${template}" doesn't seem to exist in directus-labs/directus-starters.`)
      template = await ux.prompt('Please enter a valid template name, or Ctrl+C to cancel:')
      directories = await github.getTemplateDirectories(template)
    }

    flags.template = template

    // Filter out the 'directus' folder; the rest are potential frontends
    const potentialFrontends = directories.filter(dir => dir !== 'directus')
    if (potentialFrontends.length === 0) {
      this.error(`No frontends found for template "${template}". Exiting.`)
    }

    // 4. If user hasn't specified a valid flags.frontend, ask from the list
    let chosenFrontend = flags.frontend
    if (!chosenFrontend || !potentialFrontends.includes(chosenFrontend)) {
      chosenFrontend = await inquirer
      .prompt<{ chosenFrontend: string }>([
        {
          choices: potentialFrontends,
          message: 'Which frontend framework do you want to use?',
          name: 'chosenFrontend',
          type: 'list',
        },
      ])
      .then(ans => ans.chosenFrontend)
    }

    flags.frontend = chosenFrontend

    // 5. Continue with the rest of the interactive flow:
    // if (!this.checkDockerInstalled()) {
    //   const {installDocker} = await inquirer.prompt<{ installDocker: boolean }>([
    //     {
    //       default: false,
    //       message: 'Docker is not installed. Do you want to install Docker?',
    //       name: 'installDocker',
    //       type: 'confirm',
    //     },
    //   ])
    //   if (installDocker) {
    //     ux.log('Please follow Docker\'s official instructions to install Docker, then re-run the init command.')
    //     this.exit(0)
    //   }
    // }

    const {installDeps} = await inquirer.prompt<{ installDeps: boolean }>([
      {
        default: true,
        message: 'Would you like to install project dependencies automatically?',
        name: 'installDeps',
        type: 'confirm',
      },
    ])

    const {initGit} = await inquirer.prompt<{ initGit: boolean }>([
      {
        default: true,
        message: 'Initialize a new Git repository?',
        name: 'initGit',
        type: 'confirm',
      },
    ])

    await init(this.targetDir, {
      frontend: chosenFrontend,
      gitInit: initGit,
      installDeps,
      template,
    })
  }

  /**
   * Programmatic mode: relies on flags only, with checks for template existence and valid frontend.
   * @param flags - The flags passed to the command.
   * @returns void
   */
  private async runProgrammatic(flags: InitFlags): Promise<void> {
    const github = createGitHub()

    if (!flags.template) {
      ux.error('Missing --template parameter for programmatic mode.')
    }

    if (!flags.frontend) {
      ux.error('Missing --frontend parameter for programmatic mode.')
    }

    const template = flags.template as string
    const directories = await github.getTemplateDirectories(template)
    if (directories.length === 0) {
      ux.error(`Template "${template}" doesn't seem to exist in directus-labs/directus-starters.`)
    }

    const potentialFrontends = directories.filter(dir => dir !== 'directus')
    const frontend = flags.frontend as string
    if (!potentialFrontends.includes(frontend)) {
      ux.error(`Frontend "${frontend}" doesn't exist in template "${template}". Available frontends: ${potentialFrontends.join(', ')}`)
    }

    await init(this.targetDir, {
      frontend,
      installDeps: true,
      template,
    })
  }
}
