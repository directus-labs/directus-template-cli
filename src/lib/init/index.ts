import {log as clackLog, note, outro, spinner} from '@clack/prompts'
import {ux} from '@oclif/core'
import dotenv from 'dotenv'
import {execa} from 'execa'
import {downloadTemplate, type DownloadTemplateResult} from 'giget'
import {glob} from 'glob'
import fs from 'node:fs'
import {detectPackageManager, installDependencies, type PackageManager} from 'nypm'
import path from 'pathe'

import type {InitFlags} from '../../commands/init.js'

import ApplyCommand from '../../commands/apply.js'
import {createDocker} from '../../services/docker.js'
import {pinkText} from '../constants.js'
import {displayLicenseBanner} from '../license/index.js'
import catchError from '../utils/catch-error.js'
import {createGigetString, parseGitHubUrl} from '../utils/parse-github-url.js'
import {sanitizeFlags} from '../utils/sanitize-flags.js'
import {getTemplatePath, readTemplateConfig} from '../utils/template-config.js'
import {DOCKER_CONFIG} from './config.js'


export async function init({dir, flags}: {dir: string, flags: InitFlags}) {
  // Check target directory
  const shouldForce: boolean = flags.overwriteDir

  if (fs.existsSync(dir) && !shouldForce) {
    throw new Error('Directory already exists. Use --overwrite-dir to override.')
  }

  // If template is a URL, we need to handle it differently
  const isDirectUrl = flags.template?.startsWith('http')
  const directusDir = path.join(dir, 'directus')
  let template: DownloadTemplateResult
  let packageManager: null | PackageManager = null

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
    if (isDirectUrl && !fs.existsSync(directusDir)) {
        // Move all files to directus directory
        fs.mkdirSync(directusDir, {recursive: true})
        const files = fs.readdirSync(dir)
        for (const file of files) {
          if (file !== 'directus') {
            fs.renameSync(path.join(dir, file), path.join(directusDir, file))
          }
        }
      }

    // Read template configuration
    const templateInfo = readTemplateConfig(dir)
    const configuredTemplate = templateInfo?.config ? getTemplatePath(templateInfo.config, flags.variant) : null
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

    if (flags.licenseKey && fs.existsSync(directusDir)) {
      const current = fs.existsSync(directusEnvFile) ? fs.readFileSync(directusEnvFile, 'utf8') : ''
      fs.writeFileSync(directusEnvFile, setEnvValue(current, 'LICENSE_KEY', flags.licenseKey))
    }

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

        // Check if a template path is specified in the config and exists
        let templatePath: string | undefined;
        if (configuredTemplate) {
          templatePath = path.join(dir, configuredTemplate); // Path relative to root dir
        }

        if (templatePath && fs.existsSync(templatePath)) {
          ux.stdout(`Applying template from: ${templatePath}`)
          await ApplyCommand.run([
            `--directusUrl=${directusInfo.url || 'http://localhost:8055'}`,
            '-p',
            '--noExit',
            `--userEmail=${directusInfo.email}`,
            `--userPassword=${directusInfo.password}`,
            `--templateLocation=${templatePath}`,
          ])
        } else {
           ux.stdout('Skipping backend template application.')
        }
    }

    // Detect package manager even if not installing dependencies
    packageManager = await detectPackageManager(frontendDir)

    // Install dependencies if requested
    if (flags.installDeps) {
      const s = spinner()
      let dependenciesInstalled = true
      s.start('Installing dependencies')

      if (fs.existsSync(frontendDir)) {
        dependenciesInstalled = await installFrontendDependencies({
          frontendDir,
          onSkip: () => s.stop('Dependency installation skipped'),
          packageManager,
        })
      }

      if (dependenciesInstalled) {
        s.stop('Dependencies installed!')
      }
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

    const directusText = `- Directus is running on ${directusUrl}. \n`
    const directusLoginText = directusInfo.email && directusInfo.password
      ? `- You can login with the email: ${pinkText(directusInfo.email)} and password: ${pinkText(directusInfo.password)}. \n`
      : `- Complete the onboarding form at ${pinkText(directusInfo.url || 'http://localhost:8055')} to create your admin account. \n`;
    const frontendText = flags.frontend ? `- To start the frontend, run ${pinkText(`cd ${flags.frontend}`)} and then ${pinkText(`${packageManager?.name} run dev`)}. \n` : ''
    const projectText = `- Navigate to your project directory using ${pinkText(`cd ${relativeDir}`)}. \n`
    const readmeText = '- Review the `./README.md` file for more information and next steps.'

    const nextSteps = `${directusText}${directusLoginText}${projectText}${frontendText}${readmeText}`

    note(nextSteps, 'Next Steps')

    await displayLicenseBanner()

    outro(`Problems or questions? Hop into the community at ${pinkText('https://directus.chat')}`)
  } catch (error) {
    catchError(error, {
      context: {dir, flags: sanitizeFlags(flags as Record<string, unknown>), function: 'init'},
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

type DependencyInstaller = (options: {
  cwd: string
  packageManager?: PackageManager
  silent: boolean
}) => Promise<unknown>

type InstallFrontendDependenciesOptions = {
  frontendDir: string
  install?: DependencyInstaller
  onSkip?: () => void
  packageManager: null | PackageManager
  warn?: (message: string) => void
}

export async function installFrontendDependencies({
  frontendDir,
  install = installDependencies,
  onSkip,
  packageManager,
  warn = ux.warn,
}: InstallFrontendDependenciesOptions): Promise<boolean> {
  try {
    await install({
      cwd: frontendDir,
      packageManager: packageManager ?? undefined,
      silent: true,
    })

    return true
  } catch {
    onSkip?.()
    warn('Failed to install dependencies')
    if (packageManager?.name === 'pnpm') {
      warn('This starter uses pnpm. From the frontend directory, try running: corepack enable && pnpm install')
    }

    warn('You can install dependencies manually and continue using the generated project.')
    return false
  }
}

/**
 * Set a key in .env file contents. Replaces the first active assignment (dropping any duplicates),
 * otherwise the first commented-out one, otherwise appends it.
 * @param contents - The .env file contents
 * @param key - The variable name
 * @param value - The value to set
 * @returns The updated .env file contents
 */
export function setEnvValue(contents: string, key: string, value: string): string {
  // Quote values dotenv would otherwise cut at a space or #
  const line = `${key}=${/[\s#"'`]/.test(value) ? JSON.stringify(value) : value}`
  const lines = contents.split('\n')
  // Same forms dotenv reads: optional `export` and spaces around `=`
  const active = new RegExp(`^\\s*(export\\s+)?${key}\\s*=`)
  const commented = new RegExp(`^\\s*#\\s*(export\\s+)?${key}\\s*=`)

  const activeIndexes = lines.flatMap((l, i) => (active.test(l) ? [i] : []))
  if (activeIndexes.length > 0) {
    lines[activeIndexes[0]] = line
    return lines.filter((_, i) => !activeIndexes.slice(1).includes(i)).join('\n')
  }

  const commentedIndex = lines.findIndex(l => commented.test(l))
  if (commentedIndex !== -1) {
    lines[commentedIndex] = line
    return lines.join('\n')
  }

  const trimmed = contents.replace(/\n*$/, '')
  return trimmed ? `${trimmed}\n${line}\n` : `${line}\n`
}
