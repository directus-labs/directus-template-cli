import {readMe} from '@directus/sdk'
import {text, log, isCancel, password} from '@clack/prompts'
import {ux} from '@oclif/core'

import {api} from '../sdk.js'
import catchError from './catch-error.js'
import validateUrl from './validate-url.js'
import { DEFAULT_DIRECTUS_URL } from '../../lib/constants.js'
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
  const directusUrl = await text({
    placeholder: DEFAULT_DIRECTUS_URL,
    message: 'What is your Directus URL?',
  })


  if (isCancel(directusUrl)) {
    log.info('Exiting...')
    ux.exit(0)
  }

  if (!directusUrl) {
    ux.warn(`No URL provided, using default: ${DEFAULT_DIRECTUS_URL}`)
    return DEFAULT_DIRECTUS_URL
  }

  // Validate URL
  if (!validateUrl(directusUrl as string)) {
    ux.warn('Invalid URL')
    return getDirectusUrl()
  }

  api.initialize(directusUrl as string)

  return directusUrl
}

/**
 * Get the Directus token from the user
 * @param directusUrl - The Directus URL
 * @returns The Directus token
 */
export async function getDirectusToken(directusUrl: string) {
  const directusToken = await text({
    placeholder: 'admin-token-here',
    message: 'What is your Directus Admin Token?',
  })

  if (isCancel(directusToken)) {
    log.info('Exiting...')
    ux.exit(0)
  }

  // Validate token by fetching the user
  try {
    await api.loginWithToken(directusToken as string)
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

export async function getDirectusEmailAndPassword() {
  const userEmail = await text({
    message: 'What is your email?',
    validate(value) {
      if (!value) {
        return 'Email is required'
      }
    },
  })

  if (isCancel(userEmail)) {
    log.info('Exiting...')
    ux.exit(0)
  }

  const userPassword = await password({
    message: 'What is your password?',
    validate(value) {
      if (!value) {
        return 'Password is required'
      }
    },
  })

  if (isCancel(userPassword)) {
    log.info('Exiting...')
    ux.exit(0)
  }

  return {userEmail, userPassword}
}

/**
 * Initialize the Directus API with the provided flags and log in the user
 * @param flags - The validated ApplyFlags
 * @returns {Promise<void>} - Returns nothing
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
    ux.stdout(`-- Logged in as ${response.first_name} ${response.last_name}`)
  } catch {
    catchError('-- Unable to authenticate with the provided credentials. Please check your credentials.', {
      fatal: true,
    })
  }
}

/**
* Validate the authentication flags
* @param flags - The AuthFlags
* @returns {void} - Errors if the flags are invalid
*/
export function validateAuthFlags(flags: AuthFlags): void {
  if (!flags.directusUrl) {
    ux.error('Directus URL is required.')
  }

  if (!flags.directusToken && (!flags.userEmail || !flags.userPassword)) {
    ux.error('Either Directus token or email and password are required.')
  }
}
