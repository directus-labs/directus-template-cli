import {Args, Command, Flags, ux} from '@oclif/core'
import inquirer from 'inquirer'
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

  private async applyTemplate(template: string) {
    // Implement the logic to apply the template using existing template-cli code
    // This is a placeholder and should be replaced with the actual implementation
    await ApplyCommand.run([
      '--directusUrl=http://localhost:8055',
      '-p',
      '--userEmail=admin@example.com',
      '--userPassword=d1r3ctu5',
      '--templateLocation=' + template,
    ])
  }

  /**
   * Helper to check Docker is installed by attempting `docker --version`.
   * @returns true if Docker is installed, false otherwise.
   */
  private checkDockerInstalled(): boolean {
    try {
      const result = spawnSync('docker', ['--version'], {stdio: 'ignore'})
      return result.status === 0
    } catch {
      return false
    }
  }

  /**
   * Creates a directory if it does not exist.
   * @param dirName - The name of the directory to create.
   * @returns void
   */
  private createDir(dirName: string): void {
    const fullPath = path.join(this.targetDir, dirName)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, {recursive: true})
    }
  }

  /**
   * Write a .gitignore if it doesn't exist.
   * @returns void
   */
  private createGitignore(): void {
    const gitignorePath = path.join(this.targetDir, '.gitignore')
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(
        gitignorePath,
        [
          'node_modules',
          '.DS_Store',
          '.env',
          'dist',
          'logs',
        ].join('\n'),
      )
    }
  }

  /**
   * Create a simple README.md to explain project structure.
   * @param template - The name of the template used.
   * @param frontend - The name of the frontend framework used.
   * @returns void
   */
  private createReadme(template: string, frontend: string): void {
    const readmePath = path.join(this.targetDir, 'README.md')
    const content = `# ${template.toUpperCase()} Monorepo

This monorepo was created with Directus + ${frontend}.
Contains two main folders:
- directus
- ${frontend}

Enjoy building your project!`
    fs.writeFileSync(readmePath, content)
  }

  /**
   * Download a template using giget.
   * @param options - The options for the download.
   * @returns Promise that resolves when the download is complete.
   */
  private async downloadStarter(options: {repoString: string; targetDir: string}): Promise<void> {
    ux.action.start(`Downloading starter from ${options.repoString} into ${options.targetDir}`)
    await downloadTemplate(options.repoString, {
      dir: options.targetDir,
      force: true,
    })
    ux.action.stop()
  }

  /**
   * Fetch available templates from GitHub repo root.
   * @returns Promise of array of template names, or empty if none/failure
   */
  private async fetchAvailableTemplates(): Promise<string[]> {
    try {
      const url = 'https://api.github.com/repos/directus-labs/starters/contents'
      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      if (!response.ok) {
        this.debug(`GitHub API request failed: ${response.status} ${response.statusText}`)
        return []
      }

      const data = await response.json() as Array<{ name: string; type: string }>
      return data
      .filter(item => item.type === 'dir')
      .map(item => item.name)
    } catch (error) {
      this.debug(`Error fetching templates: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }

  /**
   * Fetch directories in GitHub repo for a given template.
   * This uses the GitHub API to list subdirectories in the "template" folder
   * @param template - The template name to check
   * @returns Promise of array of directory names, or empty if none/failure
   */
  private async fetchTemplateDirectories(template: string): Promise<string[]> {
    try {
      const url = 'https://api.github.com/repos/directus-labs/starters/contents'
      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })

      if (!response.ok) {
        this.debug(`GitHub API request failed: ${response.status} ${response.statusText}`)
        return []
      }

      const data = await response.json() as Array<{ name: string; type: string }>

      // console.log(data)

      // First check if the template exists in root
      const templateDir = data.find(item => item.name === template && item.type === 'dir')
      if (!templateDir) {
        return []
      }

      // Then fetch contents of the template directory
      const templateUrl = `https://api.github.com/repos/directus-labs/starters/contents/${template}`
      const templateResponse = await fetch(templateUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',

        },
      })

      if (!templateResponse.ok) {
        console.log(templateResponse)
        return []
      }

      const templateContents = await templateResponse.json() as Array<{ name: string; type: string }>
      return templateContents
      .filter(item => item.type === 'dir' && item.name !== 'directus')
      .map(item => item.name)
    } catch (error) {
      this.debug(`Error fetching template directories: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }

  /**
   * Initialize Git repo in the current directory.
   * @returns void
   */
  private gitInit(): void {
    spawnSync('git', ['init'], {cwd: this.targetDir, stdio: 'inherit'})
  }

  /**
   * Install dependencies in the given folder.
   * @param folder - The name of the folder to install dependencies in.
   * @returns void
   */
  private installDependencies(folder: string): void {
    spawnSync('npm', ['install'], {cwd: path.join(this.targetDir, folder), stdio: 'inherit'})
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
