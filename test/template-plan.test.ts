import {expect} from 'chai'

import {
  applyMetadataToPlan,
  buildTemplatePlan,
  createTemplateMetadata,
  getBrokenJunctionCollections,
  includesRelation,
} from '../src/lib/template-plan/index.js'

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
    expect(plan.relationStrategy).to.equal('preserve')
    expect(Object.values(plan.components).every(Boolean)).to.equal(true)
  })

  it('enables partial mode from component flags', () => {
    const plan = buildTemplatePlan({content: true, schema: true})

    expect(plan.partial).to.equal(true)
    expect(plan.relationStrategy).to.equal('empty')
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

  it('keeps schema relations to excluded collections for preserve strategy', () => {
    const plan = buildTemplatePlan({excludeCollections: 'assets', relationStrategy: 'preserve'})

    expect(includesRelation('posts', 'assets', plan)).to.equal(true)
  })

  it('drops relations to excluded collections for empty strategy', () => {
    const plan = buildTemplatePlan({excludeCollections: 'assets', relationStrategy: 'empty'})

    expect(includesRelation('posts', 'assets', plan)).to.equal(false)
  })

  it('keeps relations to included collections for deep strategy', () => {
    const plan = buildTemplatePlan({collections: 'posts,assets', relationStrategy: 'deep'})

    expect(includesRelation('posts', 'assets', plan)).to.equal(true)
  })

  it('drops relations to excluded collections for deep strategy', () => {
    const plan = buildTemplatePlan({excludeCollections: 'assets', relationStrategy: 'deep'})

    expect(includesRelation('posts', 'assets', plan)).to.equal(false)
  })

  it('keeps relations to system collections not explicitly excluded', () => {
    const plan = buildTemplatePlan({collections: 'posts', relationStrategy: 'empty'})

    expect(includesRelation('posts', 'directus_users', plan)).to.equal(true)
  })

  it('drops relations to system collections when explicitly excluded', () => {
    const plan = buildTemplatePlan({excludeCollections: 'directus_files', relationStrategy: 'empty'})

    expect(includesRelation('posts', 'directus_files', plan)).to.equal(false)
  })

  it('keeps relations to explicitly excluded system collections for preserve strategy', () => {
    const plan = buildTemplatePlan({excludeCollections: 'directus_files', relationStrategy: 'preserve'})

    expect(includesRelation('posts', 'directus_files', plan)).to.equal(true)
  })

  it('preserves metadata warnings', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({excludeCollections: 'directus_files'}), [
      {
        collection: 'posts',
        count: 1,
        field: 'image',
        relatedCollection: 'directus_files',
        type: 'excluded_relation',
      },
    ])

    expect(metadata.warnings).to.have.length(1)
  })

  it('returns plan unchanged when no metadata (legacy fallback)', () => {
    const plan = buildTemplatePlan({content: true, schema: true})
    const result = applyMetadataToPlan(plan)

    expect(result).to.equal(plan)
  })

  it('re-derives partial when metadata disables a component', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({files: false}))
    const plan = applyMetadataToPlan(buildTemplatePlan({}), metadata)

    expect(plan.partial).to.equal(true)
    expect(plan.components.files).to.equal(false)
  })

  it('preserves requested partial mode when applying full template metadata', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({}))
    const plan = applyMetadataToPlan(buildTemplatePlan({collections: 'posts'}), metadata)

    expect(plan.partial).to.equal(true)
  })

  it('uses metadata relation strategy when applying partial template metadata', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({
      excludeCollections: 'assets',
      relationStrategy: 'preserve',
    }))
    const plan = applyMetadataToPlan(buildTemplatePlan({collections: 'posts'}), metadata)

    expect(plan.relationStrategy).to.equal('preserve')
    expect(includesRelation('posts', 'assets', plan)).to.equal(true)
  })

  it('does not apply requested collections outside metadata bounds', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({collections: 'posts,pages'}))
    const plan = applyMetadataToPlan(buildTemplatePlan({collections: 'posts,authors'}), metadata)

    expect(plan.collections).to.deep.equal(['posts'])
  })

  it('errors when requested collections have no overlap with metadata', () => {
    const metadata = createTemplateMetadata(buildTemplatePlan({collections: 'posts'}))

    expect(() => applyMetadataToPlan(buildTemplatePlan({collections: 'authors'}), metadata)).to.throw(
      /No requested collections match this template/,
    )
  })

  it('errors when at least one component must be enabled', () => {
    expect(() => buildTemplatePlan({content: false, dashboards: false, extensions: false, files: false, flows: false, permissions: false, schema: false, settings: false, users: false})).to.throw(
      /At least one template component must be enabled/,
    )
  })

  it('parses array collection input', () => {
    const plan = buildTemplatePlan({collections: ['posts', 'pages']})
    expect(plan.collections).to.deep.equal(['posts', 'pages'])
  })

  it('round-trips metadata with mixed flags', () => {
    const original = buildTemplatePlan({
      collections: 'posts,pages',
      excludeCollections: 'directus_files',
      noAssets: true,
    })
    const metadata = createTemplateMetadata(original)
    const restored = applyMetadataToPlan(buildTemplatePlan({collections: 'posts,pages'}), metadata)

    expect(restored.components.files).to.equal(false)
    expect(restored.excludeCollections).to.include('directus_files')
    expect(restored.collections).to.deep.equal(['posts', 'pages'])
    expect(restored.partial).to.equal(true)
  })

  describe('getBrokenJunctionCollections', () => {
    it('returns empty set for non-partial plans', () => {
      const plan = buildTemplatePlan({})
      const relations = [
        {collection: 'posts_tags', meta: {junction_field: 'tag_id'}, related_collection: 'posts'},
        {collection: 'posts_tags', meta: {junction_field: 'post_id'}, related_collection: 'tags'},
      ]
      expect(getBrokenJunctionCollections(relations, plan).size).to.equal(0)
    })

    it('marks junction broken when one FK target is excluded', () => {
      const plan = buildTemplatePlan({collections: 'posts,posts_tags'})
      const relations = [
        {collection: 'posts_tags', meta: {junction_field: 'tag_id'}, related_collection: 'posts'},
        {collection: 'posts_tags', meta: {junction_field: 'post_id'}, related_collection: 'tags'},
      ]
      const broken = getBrokenJunctionCollections(relations, plan)
      expect(broken.has('posts_tags')).to.equal(true)
    })

    it('does not mark junction broken when target is a system collection', () => {
      const plan = buildTemplatePlan({collections: 'posts,posts_files'})
      const relations = [
        {collection: 'posts_files', meta: {junction_field: 'directus_files_id'}, related_collection: 'posts'},
        {collection: 'posts_files', meta: {junction_field: 'posts_id'}, related_collection: 'directus_files'},
      ]
      const broken = getBrokenJunctionCollections(relations, plan)
      expect(broken.has('posts_files')).to.equal(false)
    })

    it('does not mark junction broken when both targets included', () => {
      const plan = buildTemplatePlan({collections: 'posts,tags,posts_tags'})
      const relations = [
        {collection: 'posts_tags', meta: {junction_field: 'tag_id'}, related_collection: 'posts'},
        {collection: 'posts_tags', meta: {junction_field: 'post_id'}, related_collection: 'tags'},
      ]
      expect(getBrokenJunctionCollections(relations, plan).size).to.equal(0)
    })

    it('ignores non-junction relations', () => {
      const plan = buildTemplatePlan({collections: 'posts'})
      const relations = [
        {collection: 'posts', meta: {}, related_collection: 'missing'},
      ]
      expect(getBrokenJunctionCollections(relations, plan).size).to.equal(0)
    })
  })
})
