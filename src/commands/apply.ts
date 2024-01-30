import {Command, ux} from '@oclif/core'
import {downloadTemplate} from 'giget'
import * as inquirer from 'inquirer'
import fs from 'node:fs'
import path from 'node:path'
import {cwd} from 'node:process'

import apply from '../lib/load/'
import {getDirectusToken, getDirectusUrl} from '../lib/utils/auth'
import {readAllTemplates, readTemplate} from '../lib/utils/read-templates'
import {transformGitHubUrl} from '../lib/utils/transform-github-url'

const separator = '------------------'

async function getTemplate() {
  const templateType: any = await inquirer.prompt([
    {
      choices: [
        {
          name: 'Official templates',
          value: 'official',
        },
        {
          name: 'From a local directory',
          value: 'local',
        },
        {
          name: 'From a GitHub repository',
          value: 'github',
        },
      ],
      message: 'What type of template would you like to apply?',
      name: 'templateType',
      type: 'list',
    },
  ])

  let template: any

  if (templateType.templateType === 'official') {
    // Get official templates
    const {dir} = await downloadTemplate('github:directus-community/directus-template-cli/templates', {
      dir: 'downloads/',
      force: true,
      preferOffline: true,
    })

    const templates = await readAllTemplates(dir)

    const officialTemplateChoices = templates.map((template: any) => ({name: template.templateName, value: template}))
    template = await inquirer.prompt([
      {
        choices: officialTemplateChoices,
        message: 'Select a template.',
        name: 'template',
        type: 'list',
      },
    ])
  }

  if (templateType.templateType === 'local') {
    const localTemplateDir = await ux.prompt(
      'What is the local template directory?',
    )

    if (fs.existsSync(localTemplateDir)) {
      template = {template: await readTemplate(localTemplateDir)}
    } else {
      ux.error('Directory does not exist.')
    }
  }

  if (templateType.templateType === 'github') {
    const ghTemplateUrl = await ux.prompt('What is the GitHub repository URL?')

    const ghString = await transformGitHubUrl(ghTemplateUrl)

    const {dir} = await downloadTemplate(ghString, {
      dir: 'downloads/github',
    })

    template = {template: await readTemplate(dir)}
  }

  return template
}

export default class ApplyCommand extends Command {
  static description = 'Apply a template to a blank Directus instance.'

  static examples = ['$ directus-template-cli apply']

  static flags = {}

  public async run(): Promise<void> {
    const chosenTemplate = await getTemplate()
    this.log(`You selected ${chosenTemplate.template.templateName}`)

    this.log(separator)

    const directusUrl = await getDirectusUrl()
    await getDirectusToken(directusUrl)

    this.log(separator)

    // Run load script
    ux.action.start(
      `Applying template - ${chosenTemplate.template.templateName} to ${directusUrl}`,
    )

    await apply(chosenTemplate.template.directoryPath.toString())

    ux.action.stop()

    this.log(separator)

    this.log('Template applied successfully.')

    this.exit(0)
  }
}
