import {Command, ux} from '@oclif/core'
import * as inquirer from 'inquirer'
import fs from 'node:fs'
import path from 'node:path'
// import {cwd} from 'node:process'

import apply from '../lib/load/'
import {getDirectusToken, getDirectusUrl} from '../lib/utils/auth'
import {readAllTemplates, readTemplate} from '../lib/utils/read-templates'

const separator = '------------------'

async function getTemplate() {
  const TEMPLATE_DIR = path.join(__dirname, '..', '..', 'templates')
  const templates = await readAllTemplates(TEMPLATE_DIR)

  const officialTemplateChoices = templates.map((template: any) => ({name: template.templateName, value: template}))

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
        // {
        //   name: "From a git repository",
        //   value: "git",
        // },
      ],
      message: 'What type of template would you like to apply?',
      name: 'templateType',
      type: 'list',
    },
  ])

  let template: any

  if (templateType.templateType === 'official') {
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

    await apply(chosenTemplate.template.directoryPath.toString(), this)

    ux.action.stop()

    this.log(separator)

    this.log('Template applied successfully.')

    this.exit(0)
  }
}
