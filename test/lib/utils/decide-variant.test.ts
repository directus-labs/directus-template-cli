import {expect} from 'chai'

import {decideVariant} from '../../../src/lib/utils/template-config.js'

describe('decideVariant', () => {
  const licensed = [{id: 'licensed', name: 'CMS — Licensed', requiresLicense: true, template: './directus/template-licensed'}]
  const decide = (options: Partial<Parameters<typeof decideVariant>[0]>) =>
    decideVariant({hasLicenseKey: false, interactive: true, variantOptions: licensed, ...options})

  it('asks "do you have a license?" when the only variant needs one', () => {
    expect(decide({})).to.deep.equal({kind: 'ask-license', licensedVariant: 'licensed'})
  })

  it('uses the licensed variant for --license or a license key', () => {
    expect(decide({license: true})).to.deep.equal({kind: 'use', variant: 'licensed'})
    expect(decide({hasLicenseKey: true})).to.deep.equal({kind: 'use', variant: 'licensed'})
  })

  it('uses the core template for --no-license', () => {
    expect(decide({license: false})).to.deep.equal({kind: 'use'})
  })

  it('rejects flags that contradict --no-license', () => {
    expect(decide({hasLicenseKey: true, license: false}).kind).to.equal('error')
    expect(decide({license: false, variant: 'licensed'}).kind).to.equal('error')
  })

  it('uses the core template without asking when there is no terminal', () => {
    const several = [...licensed, {id: 'minimal', name: 'CMS — Minimal', requiresLicense: false, template: './directus/minimal'}]
    expect(decide({interactive: false})).to.deep.equal({kind: 'use'})
    expect(decide({interactive: false, variantOptions: several})).to.deep.equal({kind: 'use'})
    expect(decide({hasLicenseKey: true, interactive: false})).to.deep.equal({kind: 'use', variant: 'licensed'})
  })

  it('skips the question for templates without variants', () => {
    expect(decide({variantOptions: []})).to.deep.equal({kind: 'use'})
  })

  it('lets --variant pick directly and rejects unknown ones', () => {
    expect(decide({variant: 'licensed'})).to.deep.equal({kind: 'use', variant: 'licensed'})
    expect(decide({variant: 'nope'})).to.deep.equal({
      kind: 'error',
      message: 'Variant "nope" isn\'t available for this template. Available variants: licensed',
    })
  })

  it('falls back to the variant list when a template has more than the license variant', () => {
    const several = [...licensed, {id: 'minimal', name: 'CMS — Minimal', requiresLicense: false, template: './directus/minimal'}]
    expect(decide({variantOptions: several})).to.deep.equal({kind: 'ask-variant'})
  })
})
