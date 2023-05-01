import {Command, Flags} from '@oclif/core'
import {ux} from '@oclif/core'
import * as inquirer from 'inquirer'
import readTemplates from '../lib/utils/read-templates'
import validateUrl from '../lib/utils/validate-url'

import {api} from '../lib/api'
import apply from '../lib/load/'

const separator = '------------------'

async function getTemplate() {
  const templates = await readTemplates('./src/templates/')
  const templateChoices = templates.map((template: any) => {
    return {name: template.templateName, value: template}
  })

  const template: any = await inquirer.prompt([{
    name: 'template',
    message: 'Select a template.',
    type: 'list',
    choices: templateChoices,
  }])

  return template
}

async function getDirectusUrl() {
  const directusUrl = await ux.prompt('What is your Directus URL?')
  // Validate URL
  if (!validateUrl(directusUrl)) {
    ux.warn('Invalid URL')
    return getDirectusUrl()
  }

  return directusUrl
}

async function getDirectusToken(directusUrl: string) {
  const directusToken = await ux.prompt('What is your Directus Admin Token?')
  // Validate token
  try {
    await api.get('/users/me', {
      headers: {
        Authorization: `Bearer ${directusToken}`,
      },
    })
    return directusToken
  } catch {
    ux.warn('Invalid token')
    return getDirectusToken(directusUrl)
  }
}

export default class ApplyCommand extends Command {
  static description = 'Apply a template to a blank Directus instance.'

  static examples = [
    '$ directus-template-cli apply',
  ]

  static flags = {}

  public async run(): Promise<void> {
    const {flags} = await this.parse(ApplyCommand)

    const chosenTemplate = await getTemplate()
    this.log(`You selected ${chosenTemplate.template.templateName}`)
    this.log(separator)

    const directusUrl = await getDirectusUrl()
    api.setBaseUrl(directusUrl)

    const directusToken = await getDirectusToken(directusUrl)
    api.setAuthToken(directusToken)

    this.log(separator)

    // Check if Directus instance is empty, if not, throw error
    const {data}: {data: any} = await api.get('/collections')
    // Look for collections that don't start with directus_
    const collections = data.data.filter((collection: any) => {
      return !collection.collection.startsWith('directus_')
    })

    if (collections.length > 0) {
      ux.error('Directus instance is not empty. Please use a blank instance. Copying a template into an existing instance is not supported at this time.')
    }

    // Run load script
    ux.action.start(`Applying template - ${chosenTemplate.template.templateName}`)
    await apply(chosenTemplate.template.directoryPath, this)
    ux.action.stop()

    this.log(separator)
    this.log('Template applied successfully.')
    this.exit
  }
}
