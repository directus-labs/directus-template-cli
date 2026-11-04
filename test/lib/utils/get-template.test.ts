import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {buildSubpathUrl, getInteractiveLocalTemplate} from '../../../src/lib/utils/get-template.js'
import {parseGitHubUrl} from '../../../src/lib/utils/transform-github-url.js'

describe('get-template', () => {
  it('builds re-run URLs that keep the original subpath and a slash branch', () => {
    expect(buildSubpathUrl('https://github.com/acme/custom/tree/feature/foo/starters?ref=feature/foo', 'crm/directus/template')).to.equal(
      'https://github.com/acme/custom/tree/feature/foo/starters/crm/directus/template?ref=feature%2Ffoo',
    )
    expect(buildSubpathUrl('https://github.com/acme/custom/tree/main/starters', 'crm/directus/template')).to.equal(
      'https://github.com/acme/custom/tree/main/starters/crm/directus/template',
    )
  })

  it('builds re-run URLs that round-trip a ref with special characters', () => {
    const url = buildSubpathUrl('https://github.com/acme/custom?ref=release%23one', 'template')
    expect(url).to.equal('https://github.com/acme/custom/tree/release%23one/template?ref=release%23one')
    expect(parseGitHubUrl(url)).to.deep.equal({owner: 'acme', ref: 'release#one', repo: 'custom', subpath: 'template'})
  })

  it('finds the templates of a single starter folder through its directus:template config', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'get-template-'))
    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({
        'directus:template': {
          frontends: {},
          name: 'Help Center',
          template: './directus/template',
          variants: {licensed: {name: 'Help Center — Licensed', template: './directus/template-licensed'}},
        },
      }),
    )
    for (const dir of ['directus/template/src', 'directus/template-licensed/src']) fs.mkdirSync(path.join(root, dir), {recursive: true})

    const templates = await getInteractiveLocalTemplate(root)
    expect(templates.map(t => t.templateName)).to.deep.equal(['Help Center', 'Help Center — Licensed'])

    fs.rmSync(root, {force: true, recursive: true})
  })
})
