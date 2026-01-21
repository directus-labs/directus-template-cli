import {customEndpoint, readExtensions} from '@directus/sdk'
import {ux} from '@oclif/core'

import type {Extension} from '../types/extension.js'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import readFile from '../utils/read-file.js'

async function installExtension(extension: any): Promise<void> {
  await api.client.request(customEndpoint({
    body: JSON.stringify({
      extension: extension.id,
      version: extension.version,
    }),
    method: 'POST',
    path: '/extensions/registry/install',
  }))
}

export default async function loadExtensions(dir: string): Promise<void> {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Loading extensions'))

  try {
    const extensions: Extension[] = readFile('extensions', dir)

    if (extensions && extensions.length > 0) {
      const installedExtensions = await api.client.request(readExtensions())

      const registryExtensions = extensions.filter(ext => ext.meta?.source === 'registry' && !ext.bundle)
      const bundles = [...new Set(extensions.filter(ext => ext.bundle).map(ext => ext.bundle))]
      const localExtensions = extensions.filter(ext => ext.meta?.source === 'local')

      const extensionsToInstall = extensions.filter(ext =>
        ext.meta?.source === 'registry'
        && !ext.bundle
        // @ts-ignore - ignore
        && !installedExtensions.some(installed => installed.id === ext.id),
      )

      ux.stdout(`Found ${extensions.length} extensions total: ${registryExtensions.length} registry extensions (including ${bundles.length} bundles), and ${localExtensions.length} local extensions`)

      if (extensionsToInstall.length > 0) {
        ux.action.start(ux.colorize(DIRECTUS_PINK, `Installing ${extensionsToInstall.length} extensions`))
        const results = await Promise.allSettled(extensionsToInstall.map(async ext => {
          try {
            await installExtension({
              id: ext.id,
              // The extension version UUID is the folder name
              version: ext.meta?.folder,
            })
            return `-- Installed ${ext.schema?.name}`
          } catch (error) {
            catchError(error, {
      context: {operation: 'load_extensions'},
      fatal: true,
    })
            return `-- Failed to install ${ext.schema?.name}`
          }
        }))

        for (const result of results) {
          if (result.status === 'fulfilled') {
            ux.stdout(result.value)
          }
        }

        ux.action.stop()
        ux.stdout('Finished installing extensions')
      } else {
      // All extensions are already installed
        ux.stdout('All extensions are already installed')
      }

      if (localExtensions.length > 0) {
        ux.stdout(`Note: ${localExtensions.length} local extensions need to be installed manually.`)
      }
    }
  } catch {
    ux.stdout(`${ux.colorize('dim', '--')} No extensions found or extensions file is empty. Skipping extension installation.`)
  }

  ux.action.stop()
}
