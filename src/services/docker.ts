import { spinner, log } from '@clack/prompts'
import { execa } from 'execa'
import net from 'node:net'
import { ux } from '@oclif/core'
import path from 'pathe'
import catchError from '../lib/utils/catch-error.js'
import { waitFor } from '../lib/utils/wait.js'

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
          const { stdout } = await execa('lsof', ['-i', `:${port}`])
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

  for (const { port, name } of portsToCheck) {
    const status = await checkPort(port)
    if (status.inUse) {
      hasConflicts = true
      const process = status.process ? ` by ${status.process}` : ''
      ux.warn(`Port ${port} (${name}) is already in use${process}`)
    }
  }

  if (hasConflicts) {
    ux.warn('Please stop any conflicting services before continuing.')
    process.exit(1)
  }
}

/**
 * Check if Docker is installed and running
 * @returns {Promise<DockerCheckResult>} Docker installation and running status
 */
async function checkDocker(): Promise<DockerCheckResult> {
  // First check if Docker is installed
  try {
    await execa('docker', ['--version'])
  } catch {
    // Docker is not installed
    return {
      installed: false,
      message: 'Docker is not installed. Please install Docker at https://docs.docker.com/get-started/get-docker/',
      running: false,
    }
  }

  // Docker is installed, now check if it's running
  try {
    await execa('docker', ['info'])
    return {
      installed: true,
      message: 'Docker is installed and running.',
      running: true,
    }
  } catch {
    // Docker is installed but not running
    return {
      installed: true,
      message: 'Docker is installed but not running. Please start Docker before running the init command.',
      running: false,
    }
  }
}

/**
 * Get the list of image names defined in the docker-compose file
 * @param {string} cwd - The current working directory
 * @returns {Promise<string[]>} - A list of image names
 */
async function getRequiredImagesFromCompose(cwd: string): Promise<string[]> {
  try {
    const { stdout } = await execa('docker', ['compose', 'config', '--images'], { cwd });
    // stdout contains a list of image names, one per line
    return stdout.split('\n').filter(img => img.trim() !== ''); // Filter out empty lines
  } catch (error) {
    // Handle potential errors, e.g., compose file not found or invalid
    log.error('Failed to get images from docker-compose file.');
    catchError(error, {
      context: { cwd, function: 'getRequiredImagesFromCompose' },
      fatal: false, // Don't necessarily exit, maybe let startContainers handle it
      logToFile: true,
    });
    return []; // Return empty list on error
  }
}

/**
 * Check if a list of Docker images exist locally
 * @param {string[]} imageNames - An array of Docker image names (e.g., "postgres:16")
 * @returns {Promise<boolean>} - True if all images exist locally, false otherwise
 */
async function checkImagesExist(imageNames: string[]): Promise<boolean> {
  if (imageNames.length === 0) {
    return true; // No images to check, technically they all "exist"
  }
  try {
    // Use Promise.allSettled to check all images even if some commands fail
    const results = await Promise.allSettled(
      imageNames.map(imageName => execa('docker', ['inspect', '--type=image', imageName]))
    );

    // Check if all inspect commands succeeded (exit code 0)
    return results.every(result => result.status === 'fulfilled' && result.value.exitCode === 0);
  } catch (error) {
    // This catch block might be redundant due to allSettled, but good for safety
    log.error('Error checking for Docker images.');
    catchError(error, {
      context: { imageNames, function: 'checkImagesExist' },
      fatal: false,
      logToFile: true,
    });
    return false; // Assume images don't exist if there's an error checking
  }
}

/**
 * Start Docker containers using docker compose
 * @param {string} cwd - The current working directory
 * @returns {Promise<void>} - Returns nothing
 */
async function startContainers(cwd: string): Promise<void> {
  const s = spinner()
  try {
    // Check if required ports are available
    await checkRequiredPorts()

    // Get required images from compose file
    const requiredImages = await getRequiredImagesFromCompose(cwd);
    const imagesExist = await checkImagesExist(requiredImages);

    // Log a message if images need downloading
    if (!imagesExist && requiredImages.length > 0) {
      log.info('Required Docker image(s) are missing and will be downloaded.');
    }

    const startMessage = imagesExist || requiredImages.length === 0 ? 'Starting Docker containers...' : 'Downloading required Docker images...';
    const endMessage = imagesExist || requiredImages.length === 0 ? 'Docker containers running!' : 'Docker images downloaded and containers started!';

    s.start(startMessage); // Start spinner with the appropriate message

    await execa('docker', ['compose', 'up', '-d'], {
      cwd,
    })

    s.stop(endMessage); // Update spinner message on success

  } catch (error) {
    s.stop('Error starting Docker containers.') // Stop spinner on error
    catchError(error, {
      context: { cwd, function: 'startContainers' },
      fatal: true,
      logToFile: true,
    })
    throw error
  }
}

/**
 * Stop Docker containers using docker compose
 * @param {string} cwd - The current working directory
 * @returns {Promise<void>} - Returns nothing
 */
async function stopContainers(cwd: string): Promise<void> {
  try {
    return execa('docker', ['compose', 'down'], {
      cwd,
    }).then(() => { })
  } catch (error) {
    catchError(error, {
      context: { cwd, function: 'stopContainers' },
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
        context: { function: 'waitForHealthy', url: healthCheckUrl },
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
