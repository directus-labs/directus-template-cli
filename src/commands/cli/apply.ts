import {Command, ux, Flags} from '@oclif/core'
import {downloadTemplate} from 'giget'
import * as inquirer from 'inquirer'
import path from 'node:path'

import apply from '../../lib/load/'
import {getDirectusToken, getDirectusUrl} from '../../lib/utils/auth'
import logError from '../../lib/utils/log-error'
import openUrl from '../../lib/utils/open-url'
import resolvePathAndCheckExistence from '../../lib/utils/path'
import {readAllTemplates, readTemplate} from '../../lib/utils/read-templates'
import {transformGitHubUrl} from '../../lib/utils/transform-github-url'

const separator = '------------------'

async function getTemplate(tType?: string, tLocation?: string) {
  let templateType: any;
  if (tType && tLocation && tType == 'local-cli') {
    templateType = {
      templateType: tType, 
      templateLocation: tLocation
    }
  } else {
    templateType = await inquirer.prompt([
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
  }

  let template: any

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

  if (templateType.templateType === 'local-cli') {
    let localTemplateDir = resolvePathAndCheckExistence(templateType.templateLocation)

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

  static flags = {
    templateType: Flags.string(),
    templateLocation: Flags.string(),
    directusUrl: Flags.string(),
    directusToken: Flags.string(),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ApplyCommand)
    const chosenTemplate = await getTemplate(flags.templateType, flags.templateLocation)
    ux.log(`You selected ${chosenTemplate.template.templateName}`)

    ux.log(separator)

    const directusUrl = await getDirectusUrl(flags.directusUrl)
    const directusToken = await getDirectusToken(directusUrl, flags.directusToken);
    if (!directusToken) {
      this.log('Invalid credentials. Please try again.');
      this.exit(1);
    }

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
