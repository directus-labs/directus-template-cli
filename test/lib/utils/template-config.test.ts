import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type {DirectusTemplateConfig} from '../../../src/lib/types.js'

import {getTemplatePath, readTemplateConfig} from '../../../src/lib/utils/template-config.js'

const config: DirectusTemplateConfig = {
  description: 'Products and orders',
  frontends: {},
  name: 'Simple eCommerce',
  template: './directus/template',
  variants: {
    licensed: {
      name: 'Simple eCommerce — Licensed',
      requiresLicense: true,
      template: './directus/template-licensed',
    },
  },
}

describe('template-config', () => {
  it('returns the default template when no variant is given', () => {
    expect(getTemplatePath(config)).to.equal('./directus/template')
  })

  it('returns the variant template', () => {
    expect(getTemplatePath(config, 'licensed')).to.equal('./directus/template-licensed')
  })

  it('throws for an unknown variant and lists the available ones', () => {
    expect(() => getTemplatePath(config, 'team')).to.throw('Variant "team" not found in template configuration. Available variants: licensed')
  })

  it('reads variant options from package.json', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-config-'))
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({'directus:template': config}))

    expect(readTemplateConfig(dir)?.variantOptions).to.deep.equal([
      {
        description: undefined,
        id: 'licensed',
        name: 'Simple eCommerce — Licensed',
        requiresLicense: true,
        template: './directus/template-licensed',
      },
    ])

    fs.rmSync(dir, {force: true, recursive: true})
  })
})
