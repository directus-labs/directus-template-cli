import {Command, ux} from '@oclif/core'
import {downloadTemplate} from 'giget'
import * as inquirer from 'inquirer'
import path from 'node:path'

import apply from '../lib/load/'
import {getDirectusToken, getDirectusUrl} from '../lib/utils/auth'
import logError from '../lib/utils/log-error'
import openUrl from '../lib/utils/open-url'
import resolvePathAndCheckExistence from '../lib/utils/path'
import {readAllTemplates, readTemplate} from '../lib/utils/read-templates'
import {transformGitHubUrl} from '../lib/utils/transform-github-url'

const separator = '------------------'

async function getTemplate() {
  const templateType: any = await inquirer.prompt([
    {
      choices: [
        {
          name: 'Community templates',
          value: 'community',
        },
        {
          name: 'From a local directory',
          value: 'local',
        },
        {
          name: 'From a public GitHub repository',
          value: 'github',
        },
        {
          name: 'Get premium templates',
          value: 'directus-plus',
        },
      ],
      message: 'What type of template would you like to apply?',
      name: 'templateType',
      type: 'list',
    },
  ])

  let template: any

  if (templateType.templateType === 'community') {
    // Get community templates
    let templates: any[] = []

    // Resolve the path for downloading
    const downloadDir = resolvePathAndCheckExistence(path.join(__dirname, '..', 'downloads', 'official'), false)
    if (!downloadDir) {
      throw new Error(`Invalid download directory: ${path.join(__dirname, '..', 'downloads', 'official')}`)
    }

    try {
      const {dir} = await downloadTemplate('github:directus-labs/directus-templates', {
        dir: downloadDir,
        force: true,
        preferOffline: true,
      })

      templates = await readAllTemplates(dir)
    } catch (error) {
      logError(error, {fatal: true})
    }

    const communityTemplateChoices = templates.map((template: any) => ({name: template.templateName, value: template}))
    template = await inquirer.prompt([
      {
        choices: communityTemplateChoices,
        message: 'Select a template.',
        name: 'template',
        type: 'list',
      },
    ])
  }

  if (templateType.templateType === 'local') {
    let localTemplateDir = await ux.prompt(
      'What is the local template directory?',
    )

    localTemplateDir = resolvePathAndCheckExistence(localTemplateDir)

    if (localTemplateDir) {
      template = {template: await readTemplate(localTemplateDir)}
    } else {
      ux.error('Directory does not exist.')
    }
  }

  if (templateType.templateType === 'github') {
    const ghTemplateUrl = await ux.prompt('What is the public GitHub repository URL?')

    try {
      const ghString = await transformGitHubUrl(ghTemplateUrl)

      // Resolve the path for downloading
      const downloadDir = resolvePathAndCheckExistence(path.join(__dirname, '..', 'downloads', 'github'), false)
      if (!downloadDir) {
        throw new Error(`Invalid download directory: ${path.join(__dirname, '..', 'downloads', 'github')}`)
      }

      // Download the template
      const {dir} = await downloadTemplate(ghString, {
        dir: downloadDir,
        force: true,
        forceClean: true,
      })

      // Check if the directory exists after download
      const resolvedDir = resolvePathAndCheckExistence(dir)
      if (!resolvedDir) {
        throw new Error(`Downloaded template directory does not exist: ${dir}`)
      }

      template = {template: await readTemplate(dir)}
    } catch (error) {
      logError(error, {fatal: true})
    }
  }

  if (templateType.templateType === 'directus-plus') {
    openUrl('https://directus.io/plus?utm_source=directus-template-cli&utm_content=apply-command')
    ux.log('Redirecting to Directus website.')
    ux.exit(0)
  }

  return template
}

export default class ApplyCommand extends Command {
  static description = 'Apply a template to a blank Directus instance.'

  static examples = ['$ directus-template-cli apply']

  static flags = {}

  public async run(): Promise<void> {
    const chosenTemplate = await getTemplate()
    ux.log(`You selected ${chosenTemplate.template.templateName}`)

    ux.log(separator)

    const directusUrl = await getDirectusUrl()
    await getDirectusToken(directusUrl)

    ux.log(separator)

    // Run load script
    ux.log(
      `Applying template - ${chosenTemplate.template.templateName} to ${directusUrl}`,
    )

    await apply(chosenTemplate.template.directoryPath)

    ux.action.stop()

    ux.log(separator)

    ux.log('Template applied successfully.')

    ux.exit(0)
  }
}
