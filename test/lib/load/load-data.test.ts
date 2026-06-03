import {expect} from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'pathe'

import {getUserCollections} from '../../../src/lib/load/load-data.js'
import {buildTemplatePlan} from '../../../src/lib/template-plan/index.js'

describe('load data', () => {
  it('does not require relations.json for content-only partial templates', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'directus-template-cli-'))

    try {
      fs.mkdirSync(path.join(dir, 'content'))
      fs.writeFileSync(
        path.join(dir, 'collections.json'),
        JSON.stringify([{collection: 'posts', meta: {singleton: false}, schema: {}}]),
      )
      fs.writeFileSync(path.join(dir, 'content', 'posts.json'), JSON.stringify([]))

      const collections = getUserCollections(dir, buildTemplatePlan({content: true}))

      expect(collections.map((collection) => collection.collection)).to.deep.equal(['posts'])
    } finally {
      fs.rmSync(dir, {force: true, recursive: true})
    }
  })
})
