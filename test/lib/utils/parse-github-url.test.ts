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

  it('ignores refs on bare template names instead of splitting them into owner/repo', () => {
    expect(createGigetString(parseGitHubUrl('simple-crm#feature/foo'))).to.equal('gh:directus-labs/starters/simple-crm#main')
    expect(createGigetString(parseGitHubUrl('simple-crm?ref=feature/foo'))).to.equal('gh:directus-labs/starters/simple-crm#main')
  })

  it('keeps the path when the tree ref is percent-encoded', () => {
    expect(parseGitHubUrl('https://github.com/acme/custom/tree/feature%2Ffoo/templates/x?ref=feature%2Ffoo')).to.include({
      path: 'templates/x',
      ref: 'feature/foo',
    })
  })

  it('treats an explicit ref that does not match the tree segment as an override', () => {
    expect(parseGitHubUrl('https://github.com/acme/custom/tree/main/templates/x?ref=feature/foo')).to.include({
      path: 'templates/x',
      ref: 'feature/foo',
    })
  })

  it('handles partly encoded refs', () => {
    expect(parseGitHubUrl('https://github.com/acme/custom/tree/feature%2Ffoo/bar/templates/x?ref=feature/foo/bar')).to.include({
      path: 'templates/x',
      ref: 'feature/foo/bar',
    })
    expect(parseGitHubUrl('https://github.com/acme/custom/tree/feature/foo%2Fbar/templates/x?ref=feature/foo/bar')).to.include({
      path: 'templates/x',
      ref: 'feature/foo/bar',
    })
  })

  it('only reads ref from the query string, not the path', () => {
    expect(parseGitHubUrl('https://github.com/acme/custom/tree/main/folder&ref=next')).to.include({path: 'folder&ref=next', ref: 'main'})
  })

  it('decodes an encoded tree ref', () => {
    expect(parseGitHubUrl('https://github.com/acme/custom/tree/release%23one/template')).to.include({path: 'template', ref: 'release#one'})
  })

  it('prefers ?ref= over #ref', () => {
    expect(parseGitHubUrl('https://github.com/acme/custom/tree/main/templates/x?ref=next#other')).to.include({ref: 'next'})
  })

  it('refuses refs giget would cut short instead of downloading another branch', () => {
    expect(() => createGigetString(parseGitHubUrl('https://github.com/acme/custom/tree/main/x?ref=release%2Bone'))).to.throw('release+one')
    expect(() => createGigetString(parseGitHubUrl('https://github.com/acme/custom/tree/main/x?ref=release%23one'))).to.throw('release#one')
    expect(createGigetString(parseGitHubUrl('https://github.com/acme/custom/tree/main/x?ref=feat/v1.2_rc@next'))).to.equal('gh:acme/custom/x#feat/v1.2_rc@next')
  })
})
