import {note, outro, spinner, log as clackLog} from '@clack/prompts'
import {ux} from '@oclif/core'
import chalk from 'chalk'
import {execa} from 'execa'
import {type DownloadTemplateResult, downloadTemplate} from 'giget'
import {glob} from 'glob'
import fs from 'node:fs'
import {detectPackageManager, installDependencies, type PackageManager} from 'nypm'
import path from 'pathe'
import dotenv from 'dotenv'
import terminalLink from 'terminal-link'

import ApplyCommand from '../../commands/apply.js'
import {createDocker} from '../../services/docker.js'
import catchError from '../utils/catch-error.js'
import {createGigetString, parseGitHubUrl} from '../utils/parse-github-url.js'
import {readTemplateConfig} from '../utils/template-config.js'
import {DIRECTUS_CONFIG, DOCKER_CONFIG} from './config.js'
import type {InitFlags} from '../../commands/init.js'
import {BSL_LICENSE_TEXT, pinkText} from '../constants.js'


export async function init({dir, flags}: {dir: string, flags: InitFlags}) {
  // Check target directory
  const shouldForce: boolean = flags.overrideDir

  if (fs.existsSync(dir) && !shouldForce) {
    throw new Error('Directory already exists. Use --override-dir to override.')
  }

  // If template is a URL, we need to handle it differently
  const isDirectUrl = flags.template?.startsWith('http')
  const directusDir = path.join(dir, 'directus')
  let template: DownloadTemplateResult
  let packageManager: PackageManager | null = null

  try {
    // Download the template from GitHub
    const parsedUrl = parseGitHubUrl(flags.template)

    // If it's a direct URL, we download the entire repository
    // Otherwise, we use the template from the starters repo
    template = await downloadTemplate(createGigetString(parsedUrl), {
      dir,
      force: shouldForce,
    })

    // For direct URLs, we need to check if there's a directus directory
    // If not, assume the entire repo is a directus template
    if (isDirectUrl) {
      if (!fs.existsSync(directusDir)) {
        // Move all files to directus directory
        fs.mkdirSync(directusDir, {recursive: true})
        const files = fs.readdirSync(dir)
        for (const file of files) {
          if (file !== 'directus') {
            fs.renameSync(path.join(dir, file), path.join(directusDir, file))
          }
        }
      }
    }

    // Read template configuration
    const templateInfo = readTemplateConfig(dir)
    let frontendDir: string | undefined

    // Handle frontends based on template configuration
    if (flags.frontend && templateInfo) {
      // Find the selected frontend in the configuration
      const selectedFrontend = templateInfo.frontendOptions.find(f => f.id === flags.frontend)

      if (!selectedFrontend) {
        throw new Error(`Frontend "${flags.frontend}" not found in template configuration`)
      }

      // Remove all frontend directories except the selected one
      for (const frontend of templateInfo.frontendOptions) {
        if (frontend.id !== flags.frontend) {
          const pathToRemove = path.join(dir, frontend.path)
          if (fs.existsSync(pathToRemove)) {
            fs.rmSync(pathToRemove, {recursive: true})
          }
        }
      }

      // Move the selected frontend to the correct location if needed
      frontendDir = path.join(dir, selectedFrontend.path)
      if (frontendDir !== path.join(dir, flags.frontend)) {
        fs.renameSync(frontendDir, path.join(dir, flags.frontend))
        frontendDir = path.join(dir, flags.frontend)
      }
    }

    const directusInfo = {
      email: '',
      password: '',
      url: '',
    }

    // Find and copy all .env.example files
    const envFiles = glob.sync(path.join(dir, '**', '.env.example'))

    // Process all env files first
    for (const file of envFiles) {
      const envFile = file.replace('.env.example', '.env')
      fs.copyFileSync(file, envFile)
    }

    // Then read Directus-specific info only from the Directus env file
    const directusEnvFile = path.join(directusDir, '.env')
    if (fs.existsSync(directusEnvFile)) {
      const parsedEnv = dotenv.parse(fs.readFileSync(directusEnvFile, 'utf8'))
      directusInfo.email = parsedEnv.ADMIN_EMAIL
      directusInfo.password = parsedEnv.ADMIN_PASSWORD
      directusInfo.url = parsedEnv.PUBLIC_URL
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


        await dockerService.startContainers(directusDir)
        const healthCheckUrl = `${directusInfo.url || 'http://localhost:8055'}${DOCKER_CONFIG.healthCheckEndpoint}`

        // Wait for healthy before proceeding
        const isHealthy = await dockerService.waitForHealthy(healthCheckUrl)

        if (!isHealthy) {
          throw new Error('Directus failed to become healthy')
        }

        const templatePath = path.join(directusDir, 'template')
        ux.stdout(`Attempting to apply template from: ${templatePath}`)

        await ApplyCommand.run([
          '--directusUrl=http://localhost:8055',
          '-p',
          '--userEmail=admin@example.com',
          '--userPassword=d1r3ctu5',
          `--templateLocation=${templatePath}`,
        ])

    }

    // Install dependencies if requested
    if (flags.installDeps) {
      const s = spinner()
      s.start('Installing dependencies')
      try {
        if (fs.existsSync(frontendDir)) {
          packageManager = await detectPackageManager(frontendDir)
          await installDependencies({
            cwd: frontendDir,
            packageManager,
            silent: true,
          })
        }
      } catch (error) {
        ux.warn('Failed to install dependencies')
        throw error
      }

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

    const directusUrl = directusInfo.url ?? 'http://localhost:8055'

    const directusText = `- Directus is running on ${terminalLink(directusUrl, directusUrl)}. You can login with the email: ${pinkText(directusInfo.email)} and password: ${pinkText(directusInfo.password)}. \n`
    const frontendText = flags.frontend ? `- To start the frontend, run ${pinkText(`cd ${flags.frontend}`)} and then ${pinkText(`${packageManager?.name} run dev`)}. \n` : ''
    const projectText = `- Navigate to your project directory using ${pinkText(`cd ${relativeDir}`)}. \n`
    const readmeText = '- Review the \`./README.md\` file for more information and next steps.'

    const nextSteps = `${directusText}${projectText}${frontendText}${readmeText}`

    note(nextSteps, 'Next Steps')

    clackLog.warn(BSL_LICENSE_TEXT)

    outro(`Problems or questions? Hop into the community on Discord at ${pinkText(terminalLink('https://directus.chat', 'https://directus.chat'))}`)
  } catch (error) {
    catchError(error, {
      context: {dir, flags, function: 'init'},
      fatal: true,
      logToFile: true,
    })
  }

  return {
    directusDir,
    frontendDir: flags.frontend ? path.join(dir, flags.frontend) : undefined,
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
    await execa('git', ['init'], {cwd: targetDir})
  } catch (error) {
    catchError(error, {
      context: {function: 'initGit', targetDir},
      fatal: false,
      logToFile: true,
    })
  }
}
