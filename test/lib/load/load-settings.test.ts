import {expect} from 'chai'

import {buildSettingsPayload} from '../../../src/lib/load/load-settings.js'

describe('buildSettingsPayload', () => {
  it('never sends the license fields, from either side', () => {
    const payload = buildSettingsPayload(
      {license_key: 'XXXX', license_token: 'tok', project_name: 'Directus'},
      {license_key: null, project_color: '#000'},
    )

    expect(payload).to.not.have.any.keys('license_key', 'license_token')
    expect(payload).to.include({project_color: '#000', project_name: 'Directus'})
  })

  it("doesn't replay the instance's masked AI keys", () => {
    const payload = buildSettingsPayload({ai_openai_api_key: '**********', project_name: 'Directus'}, {project_color: '#000'})

    expect(payload).to.not.have.property('ai_openai_api_key')
  })

  it('keeps an AI key the template sets on purpose', () => {
    const payload = buildSettingsPayload({ai_anthropic_api_key: null}, {ai_anthropic_api_key: 'sk-real'})

    expect(payload).to.include({ai_anthropic_api_key: 'sk-real'})
  })

  it('drops masked AI keys that came in with an extracted template', () => {
    const payload = buildSettingsPayload({ai_google_api_key: '**********'}, {ai_google_api_key: '**********'})

    expect(payload).to.not.have.property('ai_google_api_key')
  })
})
