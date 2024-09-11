import {readMe} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from './catch-error'
import validateUrl from './validate-url'

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

export async function getDirectusToken(directusUrl: string) {
  const directusToken = await ux.prompt('What is your Directus Admin Token?')

  // Validate token
  try {
    api.setAuthToken(directusToken)
    const response = await api.client.request(readMe())
    ux.log(`Logged in as ${response.first_name} ${response.last_name}`)
    return directusToken
  } catch (error) {
    catchError(error, {
      context: {
        directusUrl,
        message: 'Invalid token. Please try again.',
        operation: 'Validating Directus token',
      },
    })
    return getDirectusToken(directusUrl)
  }
}
