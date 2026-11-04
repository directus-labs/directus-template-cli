import {expect} from 'chai'

import {setEnvValue} from '../../../src/lib/init/index.js'

describe('setEnvValue', () => {
  it('replaces a commented-out key', () => {
    expect(setEnvValue('A=1\n# LICENSE_KEY=\nB=2\n', 'LICENSE_KEY', 'abc')).to.equal('A=1\nLICENSE_KEY=abc\nB=2\n')
  })

  it('replaces an existing key', () => {
    expect(setEnvValue('LICENSE_KEY=old\n', 'LICENSE_KEY', 'new')).to.equal('LICENSE_KEY=new\n')
  })

  it('appends a missing key', () => {
    expect(setEnvValue('A=1\n\n', 'LICENSE_KEY', 'abc')).to.equal('A=1\nLICENSE_KEY=abc\n')
  })

  it('prefers an active assignment over a commented one and drops duplicates', () => {
    expect(setEnvValue('# LICENSE_KEY=\nLICENSE_KEY=old\nA=1\nLICENSE_KEY=older\n', 'LICENSE_KEY', 'new')).to.equal(
      '# LICENSE_KEY=\nLICENSE_KEY=new\nA=1\n',
    )
  })

  it('writes a new file when there are no contents', () => {
    expect(setEnvValue('', 'LICENSE_KEY', 'abc')).to.equal('LICENSE_KEY=abc\n')
  })

  it('keeps dollar signs in the value', () => {
    expect(setEnvValue('# LICENSE_KEY=\n', 'LICENSE_KEY', 'a$&b')).to.equal('LICENSE_KEY=a$&b\n')
  })
})
