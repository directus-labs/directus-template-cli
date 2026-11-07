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

  it('lets template values override the instance', () => {
    const payload = buildSettingsPayload(
      {project_color: '#6644FF', project_name: 'Directus'},
      {project_color: '#FF0000', project_name: 'Simple CMS'},
    )

    expect(payload).to.include({project_color: '#FF0000', project_name: 'Simple CMS'})
  })

  it("keeps the instance's value when the template leaves it null", () => {
    const payload = buildSettingsPayload({project_url: 'https://example.com'}, {project_url: null})

    expect(payload).to.include({project_url: 'https://example.com'})
  })

  it('lets template keys win inside JSON strings', () => {
    const payload = buildSettingsPayload(
      {custom_css: JSON.stringify({a: 1, b: 1})},
      {custom_css: JSON.stringify({b: 2})},
    )

    expect(JSON.parse(payload.custom_css as string)).to.deep.equal({a: 1, b: 2})
  })

  it('adds template module bar entries without dropping existing ones', () => {
    const payload = buildSettingsPayload(
      {module_bar: [{id: 'content', type: 'module'}]},
      {module_bar: [{id: 'content', type: 'module'}, {id: 'insights', type: 'module'}]},
    )

    expect(payload.module_bar).to.deep.equal([
      {id: 'content', type: 'module'},
      {id: 'insights', type: 'module'},
    ])
  })

  it("never applies another instance's id or owner info", () => {
    const payload = buildSettingsPayload(
      {org_name: 'Mine', project_id: 'target-id', project_owner: 'me@target.dev'},
      {org_name: 'Theirs', product_updates: true, project_id: 'source-id', project_owner: 'author@source.dev', project_usage: 'commercial'},
    )

    expect(payload).to.include({org_name: 'Mine', project_id: 'target-id', project_owner: 'me@target.dev'})
    expect(payload).to.not.have.any.keys('product_updates', 'project_usage')
  })
})
