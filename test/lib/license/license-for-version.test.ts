import {expect} from 'chai'

import {licenseForVersion} from '../../../src/lib/license/index.js'

describe('licenseForVersion', () => {
  it('uses MSCL for Directus 12 and later', () => {
    expect(licenseForVersion('12.0.0')).to.equal('mscl')
    expect(licenseForVersion('12.6.0')).to.equal('mscl')
    expect(licenseForVersion('13.1.2')).to.equal('mscl')
  })

  it('uses BSL before Directus 12', () => {
    expect(licenseForVersion('11.17.4')).to.equal('bsl')
    expect(licenseForVersion('10.13.0')).to.equal('bsl')
  })

  it('defaults to MSCL when the version is missing or unreadable', () => {
    expect(licenseForVersion()).to.equal('mscl')
    expect(licenseForVersion('')).to.equal('mscl')
    expect(licenseForVersion('main')).to.equal('mscl')
  })
})
