import {expect} from 'chai'

import {sanitizeFlags} from '../../../src/lib/utils/sanitize-flags.js'

describe('sanitizeFlags', () => {
  it('removes the license key and credentials', () => {
    expect(
      sanitizeFlags({directusToken: 't', licenseKey: 'secret', template: 'cms', userEmail: 'e', userPassword: 'p', variant: 'licensed'}),
    ).to.deep.equal({template: 'cms', variant: 'licensed'})
  })
})
