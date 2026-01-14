const path = require('node:path')
process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
process.env.NODE_ENV = 'development'

globalThis.oclif = globalThis.oclif || {}
globalThis.oclif.columns = 80
