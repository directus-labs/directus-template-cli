import {spinner, log} from '@clack/prompts'
import {execa} from 'execa'
import net from 'node:net'
import {ux} from '@oclif/core'
import path from 'pathe'
import catchError from '../lib/utils/catch-error.js'
import {waitFor} from '../lib/utils/wait.js'

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

interface PortCheck {
  inUse: boolean
  process?: string
}

/**
 * Check if a port is in use and what's using it
 * @param port The port to check
 * @returns Object indicating if port is in use and what's using it
 */
async function checkPort(port: number): Promise<PortCheck> {
  return new Promise((resolve) => {
    const server = net.createServer()

    server.once('error', async (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Try to get information about what's using the port
        try {
          const {stdout} = await execa('lsof', ['-i', `:${port}`])
          const process = stdout.split('\n')[1]?.split(/\s+/)[0] // Get process name
          resolve({ inUse: true, process })
        } catch {
          resolve({ inUse: true })
        }
      } else {
        resolve({ inUse: false })
      }
    })

    server.once('listening', () => {
      server.close()
      resolve({ inUse: false })
    })

    server.listen(port)
  })
}

/**
 * Check if required ports are available and warn if they're in use
 * @returns Promise<void>
 */
async function checkRequiredPorts(): Promise<void> {
  const portsToCheck = [
    { port: 8055, name: 'Directus API' },
    { port: 5432, name: 'PostgreSQL' },
  ]

  let hasConflicts = false

  for (const {port, name} of portsToCheck) {
    const status = await checkPort(port)
    if (status.inUse) {
      hasConflicts = true
      const process = status.process ? ` by ${status.process}` : ''
      ux.warn(`Port ${port} (${name}) is already in use${process}`)
    }
  }

  if (hasConflicts) {
    ux.warn('Please stop any conflicting services before continuing.')
  }
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
async function startContainers(cwd: string): Promise<void> {
  try {
    // Check if required ports are available
    await checkRequiredPorts()

    const s = spinner()
    s.start('Starting Docker containers')

    return execa('docker-compose', ['up', '-d'], {
      cwd,
    }).then(() => {
      s.stop('Docker containers running!')
    })
  } catch (error) {
    catchError(error, {
      context: {cwd, function: 'startContainers'},
      fatal: true,
      logToFile: true,
    })
    throw error
  }
}

/**
 * Stop Docker containers
 * @param {string} cwd - The current working directory
 * @returns {Promise<void>} - Returns nothing
 */
async function stopContainers(cwd: string): Promise<void> {
  try {
    return execa('docker-compose', ['down'], {
      cwd,
    }).then(() => {})
  } catch (error) {
    catchError(error, {
      context: {cwd, function: 'stopContainers'},
      fatal: false,
      logToFile: true,
    })
    throw error
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
