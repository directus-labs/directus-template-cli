import {expect} from 'chai'

import {applyMetadataToPlan, buildTemplatePlan, createTemplateMetadata, includesRelation} from '../src/lib/template-plan/index.js'

describe('template plan', () => {
  it('defaults to full template', () => {
    const plan = buildTemplatePlan({})

    expect(plan.partial).to.equal(false)
    expect(plan.relationStrategy).to.equal('deep')
    expect(Object.values(plan.components).every(Boolean)).to.equal(true)
  })

  it('enables partial mode from --partial alone', () => {
    const plan = buildTemplatePlan({partial: true})

    expect(plan.partial).to.equal(true)
    expect(plan.relationStrategy).to.equal('ids')
    expect(Object.values(plan.components).every(Boolean)).to.equal(true)
  })

  it('enables partial mode from component flags', () => {
    const plan = buildTemplatePlan({content: true, schema: true})

    expect(plan.partial).to.equal(true)
    expect(plan.relationStrategy).to.equal('ids')
    expect(plan.components.content).to.equal(true)
    expect(plan.components.schema).to.equal(true)
    expect(plan.components.files).to.equal(false)
  })

  it('supports negative component flags', () => {
    const plan = buildTemplatePlan({files: false})

    expect(plan.partial).to.equal(true)
    expect(plan.components.files).to.equal(false)
    expect(plan.components.content).to.equal(true)
  })

  it('supports explicit relation strategy', () => {
    const plan = buildTemplatePlan({relationStrategy: 'empty'})

    expect(plan.partial).to.equal(true)
    expect(plan.relationStrategy).to.equal('empty')
  })

  it('does not treat default false booleans as partial-only flags', () => {
    const plan = buildTemplatePlan({allowBrokenRelations: false, noAssets: false})

    expect(plan.partial).to.equal(false)
  })

  it('supports allow broken relations', () => {
    const plan = buildTemplatePlan({allowBrokenRelations: true})

    expect(plan.partial).to.equal(true)
    expect(plan.allowBrokenRelations).to.equal(true)
  })

  it('parses collection filters', () => {
    const plan = buildTemplatePlan({collections: 'posts, pages', excludeCollections: 'directus_files'})

    expect(plan.partial).to.equal(true)
    expect(plan.collections).to.deep.equal(['posts', 'pages'])
    expect(plan.excludeCollections).to.deep.equal(['directus_files'])
  })

  it('expands noAssets', () => {
    const plan = buildTemplatePlan({noAssets: true})

    expect(plan.partial).to.equal(true)
    expect(plan.components.files).to.equal(false)
    expect(plan.excludeCollections).to.deep.equal(['directus_files'])
  })

  it('writes metadata with excludedCollections only', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({excludeCollections: 'directus_files'}))

    expect(metadata.excludedCollections).to.deep.equal(['directus_files'])
    expect(metadata).not.to.have.property('excludeCollections')
  })

  it('applies metadata as available template bounds', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({collections: 'posts,pages', files: false}))
    const plan = applyMetadataToPlan(buildTemplatePlan({collections: 'posts,authors'}), metadata)

    expect(plan.components.files).to.equal(false)
    expect(plan.collections).to.deep.equal(['posts'])
  })

  it('merges requested and metadata excluded collections', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({excludeCollections: 'directus_files,assets'}))
    const plan = applyMetadataToPlan(buildTemplatePlan({excludeCollections: 'analytics_events,assets'}), metadata)

    expect(plan.excludeCollections).to.deep.equal(['analytics_events', 'assets', 'directus_files'])
  })

  it('keeps relations to excluded collections for ids strategy', () => {
    const plan = buildTemplatePlan({excludeCollections: 'assets', relationStrategy: 'ids'})

    expect(includesRelation('posts', 'assets', plan)).to.equal(true)
  })

  it('drops relations to excluded collections for empty strategy', () => {
    const plan = buildTemplatePlan({excludeCollections: 'assets', relationStrategy: 'empty'})

    expect(includesRelation('posts', 'assets', plan)).to.equal(false)
  })

  it('drops relations to excluded collections for deep strategy until traversal is implemented', () => {
    const plan = buildTemplatePlan({excludeCollections: 'assets', relationStrategy: 'deep'})

    expect(includesRelation('posts', 'assets', plan)).to.equal(false)
  })

  it('preserves metadata warnings', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({excludeCollections: 'directus_files'}), [{
      collection: 'posts',
      count: 1,
      field: 'image',
      relatedCollection: 'directus_files',
      type: 'excluded_relation',
    }])

    expect(metadata.warnings).to.have.length(1)
  })
})
