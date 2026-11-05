import {expect} from 'chai'

import {fetchDirectusVersion} from '../../../src/lib/license/index.js'
import {api} from '../../../src/lib/sdk.js'

describe('fetchDirectusVersion', () => {
  const realFetch = globalThis.fetch
  let calls: Array<{init?: Parameters<typeof fetch>[1]; url: string}>

  function respond(status: number, body: unknown) {
    globalThis.fetch = (async (url: string, init?: Parameters<typeof fetch>[1]) => {
      calls.push({init, url})
      return new Response(JSON.stringify(body), {status})
    }) as typeof fetch
  }

  beforeEach(async () => {
    calls = []
    api.initialize('https://example.com/directus')
    await api.loginWithToken('test-token')
  })

  afterEach(() => {
    globalThis.fetch = realFetch
  })

  it('reads the version from /server/info with the token', async () => {
    respond(200, {data: {version: '11.17.4'}})
    expect(await fetchDirectusVersion()).to.equal('11.17.4')
    expect(calls[0].url).to.equal('https://example.com/directus/server/info')
    expect((calls[0].init?.headers as Record<string, string>).Authorization).to.equal('Bearer test-token')
  })

  it('gives up on a 503 without retrying', async () => {
    respond(503, {errors: []})
    expect(await fetchDirectusVersion()).to.equal(undefined)
    expect(calls).to.have.length(1)
  })

  it('returns undefined when the request fails', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed')
    }) as typeof fetch
    expect(await fetchDirectusVersion()).to.equal(undefined)
  })
})
