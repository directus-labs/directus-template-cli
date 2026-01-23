export { run } from '@oclif/core'

// Library exports for programmatic use
export { default as apply } from './lib/load/index.js'
export { default as extract } from './lib/extract/index.js'
export { initializeDirectusApi } from './lib/utils/auth.js'
export { getGithubTemplate, getLocalTemplate, getCommunityTemplates } from './lib/utils/get-template.js'
export type { ApplyFlags } from './lib/load/apply-flags.js'
