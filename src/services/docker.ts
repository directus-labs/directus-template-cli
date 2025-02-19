import {spinner} from '@clack/prompts'
import {ux} from '@oclif/core'
import {execa} from 'execa'

import catchError from '../lib/utils/catch-error'
import {waitFor} from '../lib/utils/wait'

export interface DockerConfig {
  composeFile: string
  healthCheckEndpoint: string
  interval: number
  maxAttempts: number
}

export interface DockerService {
  checkDocker: () => Promise<DockerCheckResult>
  startContainers: (cwd: string) => Promise<void>
  stopContainers: (cwd: string) => Promise<void>
  waitForHealthy: (healthCheckUrl: string) => Promise<boolean>
}

export interface DockerCheckResult {
  installed: boolean
  message?: string
  running: boolean
}

/**
 * Check if Docker is installed and running
 * @returns {Promise<DockerCheckResult>} Docker installation and running status
 */
async function checkDocker(): Promise<DockerCheckResult> {
  try {
    // Check if Docker is installed
    const versionResult = await execa('docker', ['--version'])
    const isInstalled = versionResult.exitCode === 0

    if (!isInstalled) {
      return {installed: false, message: 'Docker is not installed. Please install Docker at https://docs.docker.com/get-started/get-docker/', running: false}
    }

    // Check if Docker daemon is running
    const statusResult = await execa('docker', ['info'])
    const isRunning = statusResult.exitCode === 0

    return {
      installed: true,
      message: 'Docker is installed and running.',
      running: isRunning,
    }
  } catch {
    // If any command fails, Docker is either not installed or not running
    return {
      installed: false,
      message: 'Docker is not running. Please start Docker and try again.',
      running: false,
    }
  }
}

/**
 * Start Docker containers using docker-compose
 * @param {string} cwd - The current working directory
 * @returns {Promise<void>} - Returns nothing
 */
function startContainers(cwd: string): Promise<void> {
  try {
    // ux.action.start('Starting Docker containers')
    const s = spinner()
    s.start('Starting Docker containers')

    return execa('docker-compose', ['up', '-d'], {
      cwd,
      // stdio: 'inherit',
    }).then(() => {
      s.stop('Docker containers running!')
    })
  } catch (error) {
    catchError(error, {
      context: {cwd, function: 'startContainers'},
      fatal: true,
      logToFile: true,
    })
    return Promise.reject(error)
  }
}

/**
 * Stop Docker containers
 * @param {string} cwd - The current working directory
 * @returns {Promise<void>} - Returns nothing
 */
function stopContainers(cwd: string): Promise<void> {
  try {
    return execa('docker-compose', ['down'], {
      cwd,
      // stdio: 'inherit',
    }).then(() => {})
  } catch (error) {
    catchError(error, {
      context: {cwd, function: 'stopContainers'},
      fatal: false,
      logToFile: true,
    })
    return Promise.reject(error)
  }
}

/**
 * Wait for service health check to pass
 * @param {DockerConfig} config - The Docker configuration
 * @returns {Promise<boolean>} - Returns true if the service is healthy, false otherwise
 */
function createWaitForHealthy(config: DockerConfig) {
  async function waitForHealthy(healthCheckUrl: string): Promise<boolean> {
    const s = spinner()
    s.start('Waiting for Directus to be ready.')

    try {
      await waitFor(
        async () => {
          try {
            const response = await fetch(healthCheckUrl)
            return response.ok
          } catch {
            return false
          }
        },
        {
          errorMessage: 'Service failed to become healthy',
          interval: config.interval,
          maxAttempts: config.maxAttempts,
        },
      )

      s.stop('Directus is ready!')
      return true
    } catch (error) {
      s.stop('')
      catchError(error, {
        context: {function: 'waitForHealthy', url: healthCheckUrl},
        fatal: true,
        logToFile: true,
      })
      return false
    }
  }

  return waitForHealthy
}

/**
 * Create a Docker service instance
 * @param {DockerConfig} config - The Docker configuration
 * @returns {DockerService} - Returns a Docker service instance
 */
export function createDocker(config: DockerConfig): DockerService {
  return {
    checkDocker,
    startContainers,
    stopContainers,
    waitForHealthy: createWaitForHealthy(config),
  }
}
