import {confirm, intro, select, text, isCancel, cancel, log as clackLog} from '@clack/prompts'
import {Args, Flags, ux} from '@oclif/core'
import chalk from 'chalk'
import fs from 'node:fs'
import os from 'node:os'
import path from 'pathe'
import {disableTelemetry} from '../flags/common.js'
import {DIRECTUS_PURPLE} from '../lib/constants.js'
import {init} from '../lib/init/index.js'
import {animatedBunny} from '../lib/utils/animated-bunny.js'
import {createGitHub} from '../services/github.js'
import {readTemplateConfig} from '../lib/utils/template-config.js'
import {createGigetString, parseGitHubUrl} from '../lib/utils/parse-github-url.js'
import {downloadTemplate} from 'giget'
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
    const isDirectUrl = template?.startsWith('http')

    while (!isDirectUrl && directories.length === 0) {
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
      if (templateInfo?.frontendOptions.length > 0 && (!chosenFrontend || !templateInfo.frontendOptions.find(f => f.id === chosenFrontend))) {
        const frontendResponse = await select({
          message: 'Which frontend framework do you want to use?',
          options: [
            ...templateInfo.frontendOptions.map(frontend => ({
              label: frontend.name,
              value: frontend.id,
            })),
            // { label: 'No frontend', value: '' },
          ],
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
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    }

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
    if (!flags.disableTelemetry) {
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
    if (!flags.disableTelemetry) {
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
      });

      await shutdown()
    }

    ux.exit(0)
  }

}
