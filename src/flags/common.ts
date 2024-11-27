import {Flags} from '@oclif/core'

export const directusToken = Flags.string({
  description: 'Token to use for the Directus instance',
  env: 'DIRECTUS_TOKEN',
  exclusive: ['userEmail', 'userPassword'],
})

export const directusUrl = Flags.string({
  description: 'URL of the Directus instance',
  env: 'DIRECTUS_URL',
})

export const userEmail = Flags.string({
  dependsOn: ['userPassword'],
  description: 'Email for Directus authentication',
  env: 'DIRECTUS_EMAIL',
  exclusive: ['directusToken'],
})

export const userPassword = Flags.string({
  dependsOn: ['userEmail'],
  description: 'Password for Directus authentication',
  env: 'DIRECTUS_PASSWORD',
  exclusive: ['directusToken'],
})

export const programmatic = Flags.boolean({
  char: 'p',
  default: false,
  description: 'Run in programmatic mode (non-interactive) for use cases such as CI/CD pipelines.',
  summary: 'Run in programmatic mode',
})

export const templateLocation = Flags.string({
  dependsOn: ['programmatic'],
  description: 'Location of the template',
  env: 'TEMPLATE_LOCATION',
})

export const templateName = Flags.string({
  dependsOn: ['programmatic'],
  description: 'Name of the template',
  env: 'TEMPLATE_NAME',
})
