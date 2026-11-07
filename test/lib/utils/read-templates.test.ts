import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {readAllTemplates} from '../../../src/lib/utils/read-templates.js'

function write(file: string, data: object) {
  fs.mkdirSync(path.dirname(file), {recursive: true})
  fs.writeFileSync(file, JSON.stringify(data))
}

function templateDir(root: string, relative: string, templateName?: string) {
  const dir = path.join(root, relative)
  write(path.join(dir, 'package.json'), templateName ? {templateName} : {})
  fs.mkdirSync(path.join(dir, 'src'), {recursive: true})
}

describe('readAllTemplates', () => {
  let root: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'read-templates-'))
  })

  afterEach(() => {
    fs.rmSync(root, {force: true, recursive: true})
  })

  it('reads legacy top-level templates', async () => {
    templateDir(root, 'agencyos', 'AgencyOS')

    const templates = await readAllTemplates(root)
    expect(templates.map(t => t.templateName)).to.deep.equal(['AgencyOS'])
  })

  it('reads starters through directus:template, including variants, and skips blank starters', async () => {
    write(path.join(root, 'simple-ecommerce', 'package.json'), {
      'directus:template': {
        frontends: {},
        name: 'Simple eCommerce',
        template: './directus/template',
        variants: {licensed: {name: 'Simple eCommerce — Licensed', requiresLicense: true, template: './directus/template-licensed'}},
      },
    })
    templateDir(root, 'simple-ecommerce/directus/template', 'Simple eCommerce')
    templateDir(root, 'simple-ecommerce/directus/template-licensed', 'Simple eCommerce — Licensed')
    write(path.join(root, 'blank', 'package.json'), {'directus:template': {frontends: null, name: 'Blank', template: null}})

    const templates = await readAllTemplates(root)

    expect(templates.map(t => [t.templateName, path.relative(root, t.directoryPath)])).to.deep.equal([
      ['Simple eCommerce', 'simple-ecommerce/directus/template'],
      ['Simple eCommerce — Licensed', 'simple-ecommerce/directus/template-licensed'],
    ])
  })

  it('skips starter templates without a templateName, since they can\'t be applied from a URL', async () => {
    write(path.join(root, 'cms', 'package.json'), {
      'directus:template': {
        frontends: {},
        name: 'CMS',
        template: './directus/template',
        variants: {licensed: {name: 'CMS — Licensed', requiresLicense: true, template: './directus/template-licensed'}},
      },
    })
    templateDir(root, 'cms/directus/template', 'CMS')
    templateDir(root, 'cms/directus/template-licensed')

    const templates = await readAllTemplates(root)
    expect(templates.map(t => t.templateName)).to.deep.equal(['CMS'])
  })
})
