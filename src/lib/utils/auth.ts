import {readMe} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from './catch-error'
import validateUrl from './validate-url'

interface AuthFlags {
  directusToken?: string;
  directusUrl: string;
  userEmail?: string;
  userPassword?: string;
}

/**
 * Get the Directus URL from the user
 * @returns The Directus URL
 */

export async function getDirectusUrl() {
  const directusUrl = await ux.prompt('What is your Directus URL?', {default: 'http://localhost:8055'})

  // Validate URL
  if (!validateUrl(directusUrl)) {
    ux.warn('Invalid URL')
    return getDirectusUrl()
  }

  api.initialize(directusUrl)

  return directusUrl
}

/**
 * Get the Directus token from the user
 * @param directusUrl - The Directus URL
 * @returns The Directus token
 */

export async function getDirectusToken(directusUrl: string) {
  const directusToken = await ux.prompt('What is your Directus Admin Token?')

  // Validate token by fetching the user
  try {
    await api.loginWithToken(directusToken)
    const response = await api.client.request(readMe())
    return directusToken
  } catch (error) {
    catchError(error, {
      context: {
        directusUrl,
        message: 'Invalid token. Please try again.',
        operation: 'getDirectusToken',
      },
    })
    return getDirectusToken(directusUrl)
  }
}

/**
   * Initialize the Directus API with the provided flags
   * @param flags - The validated ApplyFlags
   */

export async function initializeDirectusApi(flags: AuthFlags): Promise<void> {
  api.initialize(flags.directusUrl)

  try {
    if (flags.directusToken) {
      await api.loginWithToken(flags.directusToken)
    } else if (flags.userEmail && flags.userPassword) {
      await api.login(flags.userEmail, flags.userPassword)
    }

    const response = await api.client.request(readMe())
    ux.log(`-- Logged in as ${response.first_name} ${response.last_name}`)
  } catch {
    catchError('-- Unable to authenticate with the provided credentials. Please check your credentials.', {
      fatal: true,
    })
  }
}

/**
 * Validate the authentication flags
 * @param flags - The AuthFlags
 */

export function validateAuthFlags(flags: AuthFlags): void {
  if (!flags.directusUrl) {
    ux.error('Directus URL is required.')
  }

  if (!flags.directusToken && (!flags.userEmail || !flags.userPassword)) {
    ux.error('Either Directus token or email and password are required.')
  }
}
