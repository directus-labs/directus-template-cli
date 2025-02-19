import {ux} from '@oclif/core'
import {type DownloadTemplateResult, downloadTemplate} from 'giget'
import {glob} from 'glob'
import fs from 'node:fs'
import path from 'node:path'
import {detectPackageManager, installDependencies} from 'nypm'

import ApplyCommand from '../../commands/apply'
import {createDocker} from '../../services/docker'
import catchError from '../utils/catch-error'
import {createGigetString, parseGitHubUrl} from '../utils/parse-github-url'
import {DIRECTUS_CONFIG, DOCKER_CONFIG} from './config'

interface InitFlags {
  frontend?: string
  gitInit?: boolean
  installDeps?: boolean
  overrideDir?: boolean
  template?: string
}

export async function init(dir: string, flags: InitFlags) {
  // Check target directory
  const shouldForce: boolean = flags.overrideDir

  if (fs.existsSync(dir) && !shouldForce) {
    throw new Error('Directory already exists. Use --override-dir to override.')
  }

  const frontendDir = path.join(dir, flags.frontend)
  const directusDir = path.join(dir, 'directus')
  let template: DownloadTemplateResult

  try {
    // Download the template from GitHub
    const parsedUrl = parseGitHubUrl(flags.template)
    template = await downloadTemplate(createGigetString(parsedUrl), {
      dir,
      force: shouldForce,
    })

    // Cleanup the template
    if (flags.frontend) {
      // Ensure directus directory exists before cleaning up
      if (!fs.existsSync(directusDir)) {
        fs.mkdirSync(directusDir, {recursive: true})
      }

      // Read and parse package.json
      const packageJsonPath = path.join(dir, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found in template')
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      const templateConfig = packageJson['directus:template']

      // Get all frontend paths from the configuration
      const frontendPaths = Object.values(templateConfig?.frontends || {})
      .map(frontend => (frontend as { path: string }).path.replace(/^\.\//, ''))
      .filter(path => path !== flags.frontend) // Exclude the selected frontend

      // Remove unused frontend directories
      for (const frontendPath of frontendPaths) {
        const pathToRemove = path.join(dir, frontendPath)
        if (fs.existsSync(pathToRemove)) {
          fs.rmSync(pathToRemove, {recursive: true})
        }
      }
    }

    // Find and copy all .env.example files
    const envFiles = glob.sync(path.join(dir, '**', '.env.example'))
    for (const file of envFiles) {
      const envFile = file.replace('.env.example', '.env')
      fs.copyFileSync(file, envFile)
    }

    // Start Directus and apply template only if directus directory exists
    if (fs.existsSync(directusDir)) {
      // Initialize Docker service
      const dockerService = createDocker(DOCKER_CONFIG)

      // Check if Docker is installed
      const dockerStatus = await dockerService.checkDocker()
      if (!dockerStatus.installed || !dockerStatus.running) {
        throw new Error(dockerStatus.message)
      }

      try {
        await dockerService.startContainers(directusDir)
        const healthCheckUrl = `${DIRECTUS_CONFIG.url}:${DIRECTUS_CONFIG.port}${DOCKER_CONFIG.healthCheckEndpoint}`
        await dockerService.waitForHealthy(healthCheckUrl)

        const templatePath = path.join(directusDir, 'template')
        ux.log(`Attempting to apply template from: ${templatePath}`)
        await ApplyCommand.run([
          '--directusUrl=http://localhost:8055',
          '-p',
          '--userEmail=admin@example.com',
          '--userPassword=d1r3ctu5',
          '--templateLocation=' + templatePath,
        ])
      } catch (error) {
        ux.error('Failed to start Directus containers or apply template')
        throw error
      }
    }

    // Install dependencies for frontend if it exists
    if (flags.installDeps && fs.existsSync(frontendDir)) {
      ux.action.start('Installing dependencies')
      try {
        const packageManager = await detectPackageManager(frontendDir)
        await installDependencies({
          cwd: frontendDir,
          packageManager,
        })
      } catch (error) {
        ux.warn('Failed to install dependencies')
        throw error
      }

      ux.action.stop()
    }

    // Initialize Git repo
    if (flags.gitInit) {
      ux.action.start('Initializing git repository')
      await initGit(dir)
      ux.action.stop()
    }

    // Finishing up
    ux.log(`🚀 Directus initialized with template – ${flags.template}`)
    ux.log('You\'ll find the following directories in your project:')
    ux.log('• directus')
    ux.log(`• ${flags.frontend}`)

    return {}
  } catch (error) {
    catchError(error, {
      context: {dir, flags, function: 'init'},
      fatal: true,
      logToFile: true,
    })
  }
}

/**
 * Initialize a git repository
 * @param targetDir - The directory to initialize the git repository in
 * @returns void
 */
async function initGit(targetDir: string): Promise<void> {
  try {
    ux.action.start('Initializing git repository')
    const {execa} = await import('execa')
    await execa('git', ['init'], {cwd: targetDir})
    ux.action.stop()
  } catch (error) {
    catchError(error, {
      context: {function: 'initGit', targetDir},
      fatal: false,
      logToFile: true,
    })
  }
}
