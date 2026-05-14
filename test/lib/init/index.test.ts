import {expect} from 'chai'

import {installFrontendDependencies} from '../../../src/lib/init/index.js'

describe('installFrontendDependencies', () => {
  it('handles pnpm install failure without throwing', async () => {
    const warnings: string[] = []
    let skipped = false

    const failedInstall = await installFrontendDependencies({
      frontendDir: '/tmp/frontend',
      async install() {
        throw new Error('spawn pnpm ENOENT')
      },
      onSkip() {
        skipped = true
      },
      packageManager: {
        command: 'pnpm',
        name: 'pnpm',
        version: '9.15.4',
      },
      warn(message) {
        warnings.push(message)
      },
    })

    expect(failedInstall).to.equal(false)
    expect(skipped).to.equal(true)
    expect(warnings).to.deep.equal([
      'Failed to install dependencies',
      'This starter uses pnpm. From the frontend directory, try running: corepack enable && pnpm install',
      'You can install dependencies manually and continue using the generated project.',
    ])

    const calls: unknown[] = []

    const successfulInstall = await installFrontendDependencies({
      frontendDir: '/tmp/frontend',
      async install(options) {
        calls.push(options)
      },
      packageManager: {
        command: 'pnpm',
        name: 'pnpm',
        version: '9.15.4',
      },
    })

    expect(successfulInstall).to.equal(true)
    expect(calls).to.deep.equal([
      {
        cwd: '/tmp/frontend',
        packageManager: {
          command: 'pnpm',
          name: 'pnpm',
          version: '9.15.4',
        },
        silent: true,
      },
    ])
  })
})
