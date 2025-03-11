import {confirm, intro, select, text} from '@clack/prompts'
import {Args, Command, Flags, ux} from '@oclif/core'
import chalk from 'chalk'
import path from 'pathe'

import {DIRECTUS_PURPLE} from '../lib/constants.js'
import {init} from '../lib/init.js'
import {animatedBunny} from '../lib/utils/animated-bunny.js'
import {createGitHub} from '../services/github.js'

interface InitFlags {
  frontend?: string
  gitInit?: boolean
  installDeps?: boolean
  overrideDir?: boolean
  programmatic: boolean
  template?: string

}

interface InitArgs {
  directory: string
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
    // if (!fs.existsSync(this.targetDir)) {
    //   fs.mkdirSync(this.targetDir, {recursive: true})
    // }

    await (typedFlags.programmatic ? this.runProgrammatic(typedFlags) : this.runInteractive(typedFlags, typedArgs))
  }

  /**
   * Interactive mode: prompts the user for each piece of info, with added template checks.
   * @param flags - The flags passed to the command.
   * @param args - The arguments passed to the command.
   * @returns void
   */
  private async runInteractive(flags: InitFlags, args: InitArgs): Promise<void> {
    await animatedBunny('Let\'s create a new Directus project!')

    intro(`${chalk.bgHex(DIRECTUS_PURPLE).white.bold('Directus Template CLI')} - Create Project`)

    // Create GitHub service
    const github = createGitHub()

    // If no dir is provided, ask for it
    if (!args.directory || args.directory === '.') {
      this.targetDir = await text({
        message: 'Enter the directory to create the project in:',
        placeholder: './my-directus-project',
      }).then(ans => ans as string)
    }

    // 1. Fetch available templates
    const availableTemplates = await github.getTemplates()

    // 2. Prompt for template if not provided
    let {template} = flags

    if (!template) {
      template = await select({
        message: 'Which Directus backend template would you like to use?',
        options: availableTemplates.map(template => ({
          label: template,
          value: template,
        })),
      }).then(ans => ans as string)
    }

    // 3. Validate that the template exists, fetch subdirectories
    let directories = await github.getTemplateDirectories(template)

    while (directories.length === 0) {
      this.log(`Template "${template}" doesn't seem to exist in directus-labs/directus-starters.`)
      // ts-ignore no-await-in-loop
      const templateName = await text({
        message: 'Please enter a valid template name, or Ctrl+C to cancel:',
      })
      template = templateName as string
      // ts-ignore no-await-in-loop
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
      chosenFrontend = await select({
        message: 'Which frontend framework do you want to use?',
        options: potentialFrontends.map(frontend => ({
          label: frontend,
          value: frontend,
        })),
      }).then(ans => ans as string)
    }

    flags.frontend = chosenFrontend

    const installDeps = await confirm({
      initialValue: true,
      message: 'Would you like to install project dependencies automatically?',
    }).then(ans => ans as boolean)

    const initGit = await confirm({
      initialValue: true,
      message: 'Initialize a new Git repository?',
    }).then(ans => ans as boolean)

    await init(this.targetDir, {
      frontend: chosenFrontend,
      gitInit: initGit,
      installDeps,
      template,
    })

    ux.exit(0)
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

    ux.exit(0)
  }
}
