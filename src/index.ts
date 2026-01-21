export { run } from '@oclif/core'

// Library exports for programmatic use
export { default as apply } from './lib/load/index.js'
export { default as extract } from './lib/extract/index.js'
export type { ApplyFlags } from './lib/load/apply-flags.js'
