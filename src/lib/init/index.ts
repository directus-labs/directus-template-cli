import {note, outro, spinner} from '@clack/prompts'
import {ux, type Config} from '@oclif/core'
import chalk from 'chalk'
import {execa} from 'execa'
import {type DownloadTemplateResult, downloadTemplate} from 'giget'
import {glob} from 'glob'
import fs from 'node:fs'
import {detectPackageManager, installDependencies, type PackageManager} from 'nypm'
import path from 'pathe'

import ApplyCommand from '../../commands/apply.js'
import {createDocker} from '../../services/docker.js'
import catchError from '../utils/catch-error.js'
import {createGigetString, parseGitHubUrl} from '../utils/parse-github-url.js'
import {DIRECTUS_CONFIG, DOCKER_CONFIG} from './config.js'
import type { InitFlags } from '../../commands/init.js'
import dotenv from 'dotenv'


export async function init({dir, flags, config, runId}: {dir: string, flags: InitFlags, config: Config, runId: string}) {

  // Call analytics unless telemetry is disabled
  if (!flags.disableTelemetry) {
    config.runHook('start', {
      command: 'init',
      flags,
      config,
      runId,
    })
  }

  // Check target directory
  const shouldForce: boolean = flags.overrideDir

  if (fs.existsSync(dir) && !shouldForce) {
    throw new Error('Directory already exists. Use --override-dir to override.')
  }

  const frontendDir = path.join(dir, flags.frontend)
  const directusDir = path.join(dir, 'directus')
  let template: DownloadTemplateResult
  let packageManager: PackageManager | null = null

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

    const directusInfo = {
      email: '',
      password: '',
      url: '',
    }

    const frontendInfo = {
      url: '',
    }

    for (const file of envFiles) {
      const envFile = file.replace('.env.example', '.env')
      fs.copyFileSync(file, envFile)
      // Read default Directus login info from .env
      const parsedEnv = dotenv.parse(fs.readFileSync(file, 'utf8'))
      directusInfo.email = parsedEnv.ADMIN_EMAIL
      directusInfo.password = parsedEnv.ADMIN_PASSWORD
      directusInfo.url = parsedEnv.PUBLIC_URL
      // Read default frontend URL from .env
      const urlPatterns = [
        'NEXT_PUBLIC_SITE_URL',
        'NUXT_PUBLIC_SITE_URL',
        'SITE_URL',
        'PUBLIC_SITE_URL',
      ]
      for (const pattern of urlPatterns) {
        const urlMatch = parsedEnv[pattern]
        if (urlMatch) {
          frontendInfo.url = urlMatch
          break
        }
      }
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
        ux.stdout(`Attempting to apply template from: ${templatePath}`)

        await ApplyCommand.run([
          '--directusUrl=http://localhost:8055',
          '-p',
          '--userEmail=admin@example.com',
          '--userPassword=d1r3ctu5',
          `--templateLocation=${templatePath}`,
        ])
      } catch (error) {
        ux.error('Failed to start Directus containers or apply template')
        throw error
      }
    }

    // Install dependencies for frontend if it exists
    if (flags.installDeps && fs.existsSync(frontendDir)) {
      const s = spinner()
      s.start('Installing dependencies')
      try {
        packageManager = await detectPackageManager(frontendDir)
        await installDependencies({
          cwd: frontendDir,
          packageManager,
          silent: true,
        })
      } catch (error) {
        ux.warn('Failed to install dependencies')
        throw error
      }

      // ux.action.stop()
      s.stop('Dependencies installed!')
    }

    // Initialize Git repo
    if (flags.gitInit) {
      const s = spinner()
      s.start('Initializing git repository')
      await initGit(dir)
      s.stop('Git repository initialized!')
    }

    // Finishing up
    const relativeDir = path.relative(process.cwd(), dir)

    const directusText= `- Directus is running on ${directusInfo.url ?? 'http://localhost:8055'}. You can login with the email: ${chalk.cyan(directusInfo.email)} and password: ${chalk.cyan(directusInfo.password)}. \n`
    const frontendText= frontendDir ? `- To start the frontend, run ${chalk.cyan(`cd ${frontendDir}`)} and then ${chalk.cyan(`${packageManager?.name} run dev`)}. \n` : ''
    const projectText= `- Navigate to your project directory using ${chalk.cyan(`cd ${relativeDir}`)}. \n`
    const readmeText= '- Review the \`./README.md\` file for more information and next steps.'

    const nextSteps = chalk.white(`${directusText}${projectText}${frontendText}`)

    note(nextSteps, 'Next Steps')

    outro(`Problems or questions? Hop into the community on Discord at ${chalk.underline(chalk.cyan('https://directus.chat'))}`)
  } catch (error) {
    catchError(error, {
      context: {dir, flags, function: 'init'},
      fatal: true,
      logToFile: true,
    })
  }

  return {
    directusDir,
    frontendDir,
    template,
  }
}

/**
 * Initialize a git repository
 * @param targetDir - The directory to initialize the git repository in
 * @returns void
 */
async function initGit(targetDir: string): Promise<void> {
  try {
    // ux.action.start('Initializing git repository')
    await execa('git', ['init'], {cwd: targetDir})
    // ux.action.stop()
  } catch (error) {
    catchError(error, {
      context: {function: 'initGit', targetDir},
      fatal: false,
      logToFile: true,
    })
  }
}
