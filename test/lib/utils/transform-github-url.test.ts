import {expect} from 'chai'

import {parseGitHubUrl, transformGitHubUrl} from '../../../src/lib/utils/transform-github-url.js'

describe('transform-github-url', () => {
  it('parses a GitHub repository URL', () => {
    expect(parseGitHubUrl('https://github.com/directus-labs/starters')).to.deep.equal({
      owner: 'directus-labs',
      ref: undefined,
      repo: 'starters',
      subpath: undefined,
    })
  })

  it('parses a GitHub tree URL with a subpath', () => {
    expect(parseGitHubUrl('github.com/directus-labs/starters/tree/main/simple-cms')).to.deep.equal({
      owner: 'directus-labs',
      ref: 'main',
      repo: 'starters',
      subpath: 'simple-cms',
    })
  })

  it('rejects strings that only contain a GitHub URL', () => {
    expect(() => parseGitHubUrl('foo github.com/directus-labs/starters')).to.throw(
      'Invalid GitHub URL: foo github.com/directus-labs/starters',
    )
  })

  it('rejects non-GitHub URLs', () => {
    expect(() => parseGitHubUrl('https://example.com/directus-labs/starters')).to.throw(
      'Invalid GitHub URL: https://example.com/directus-labs/starters',
    )
  })

  it('transforms a GitHub URL into a giget string', () => {
    expect(transformGitHubUrl('https://github.com/directus-labs/starters/tree/main/simple-cms')).to.equal(
      'github:directus-labs/starters/simple-cms#main',
    )
  })

  it('uses ?ref= to split a tree URL whose branch has slashes', () => {
    expect(
      transformGitHubUrl('https://github.com/directus-labs/starters/tree/bry/v12-templates/simple-crm/directus/template?ref=bry/v12-templates'),
    ).to.equal('github:directus-labs/starters/simple-crm/directus/template#bry/v12-templates')
  })

  it('reads a #ref suffix on a tree URL', () => {
    expect(parseGitHubUrl('https://github.com/directus-labs/starters/tree/bry/v12-templates/simple-crm#bry/v12-templates')).to.deep.equal({
      owner: 'directus-labs',
      ref: 'bry/v12-templates',
      repo: 'starters',
      subpath: 'simple-crm',
    })
  })

  it('keeps the subpath when the tree ref is percent-encoded', () => {
    expect(transformGitHubUrl('https://github.com/acme/custom/tree/feature%2Ffoo/templates/x?ref=feature%2Ffoo')).to.equal(
      'github:acme/custom/templates/x#feature/foo',
    )
  })

  it('treats an explicit ref that does not match the tree segment as an override', () => {
    expect(transformGitHubUrl('https://github.com/acme/custom/tree/main/templates/x?ref=feature/foo')).to.equal(
      'github:acme/custom/templates/x#feature/foo',
    )
  })

  it('prefers ?ref= over #ref, like the init parser', () => {
    expect(parseGitHubUrl('https://github.com/acme/custom/tree/main/templates/x?ref=next#other').ref).to.equal('next')
  })
})
