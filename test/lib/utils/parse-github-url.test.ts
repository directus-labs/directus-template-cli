import {expect} from 'chai'

import {createGigetString, parseGitHubUrl} from '../../../src/lib/utils/parse-github-url.js'

describe('parse-github-url', () => {
  it('defaults template names to the starters main branch', () => {
    expect(createGigetString(parseGitHubUrl('simple-crm'))).to.equal('gh:directus-labs/starters/simple-crm#main')
  })

  it('keeps a single-segment tree ref for starters', () => {
    const parts = parseGitHubUrl('https://github.com/directus-labs/starters/tree/next/cms')
    expect(parts).to.include({owner: 'directus-labs', path: 'cms', ref: 'next', repo: 'starters'})
    expect(createGigetString(parts)).to.equal('gh:directus-labs/starters/cms#next')
  })

  it('uses ?ref= to split a tree URL whose branch has slashes', () => {
    const parts = parseGitHubUrl('https://github.com/directus-labs/starters/tree/bry/v12-templates/simple-crm?ref=bry/v12-templates')
    expect(parts).to.include({path: 'simple-crm', ref: 'bry/v12-templates'})
    expect(createGigetString(parts)).to.equal('gh:directus-labs/starters/simple-crm#bry/v12-templates')
  })

  it('reads a #ref suffix', () => {
    const parts = parseGitHubUrl('https://github.com/directus-labs/starters/simple-crm#bry/v12-templates')
    expect(parts).to.include({path: 'simple-crm', ref: 'bry/v12-templates'})
  })

  it('reads ?ref= without a tree segment', () => {
    expect(parseGitHubUrl('https://github.com/directus-labs/agency-os?ref=bry/nuxt-upgrade')).to.include({
      path: undefined,
      ref: 'bry/nuxt-upgrade',
      repo: 'agency-os',
    })
  })

  it('reads #ref on a template name', () => {
    expect(createGigetString(parseGitHubUrl('simple-crm#bry/v12-templates'))).to.equal(
      'gh:directus-labs/starters/simple-crm#bry/v12-templates',
    )
  })
})
