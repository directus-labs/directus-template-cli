import {customEndpoint, readExtensions} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import {Extension} from '../types/extension'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

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
  const extensions: Extension[] = readFile('extensions', dir)

  if (!extensions || extensions.length === 0) {
    ux.log('No extensions found')
    return
  }

  const installedExtensions = await api.client.request(readExtensions())

  const registryExtensions = extensions.filter(ext => ext.meta?.source === 'registry' && !ext.bundle)
  const bundles = [...new Set(extensions.filter(ext => ext.bundle).map(ext => ext.bundle))]
  const localExtensions = extensions.filter(ext => ext.meta?.source === 'local')

  const extensionsToInstall = extensions.filter(ext =>
    ext.meta?.source === 'registry'
    && !ext.bundle
    // @ts-expect-error
    && !installedExtensions.some(installed => installed.id === ext.id),
  )

  ux.log(`Found ${extensions.length} extensions total: ${registryExtensions.length} registry extensions (including ${bundles.length} bundles), and ${localExtensions.length} local extensions`)

  if (extensionsToInstall.length > 0) {
    ux.action.start(`Installing ${extensionsToInstall.length} extensions`)
    const results = await Promise.allSettled(extensionsToInstall.map(async ext => {
      try {
        await installExtension({
          id: ext.id,
          // The extension version UUID is the folder name
          version: ext.meta?.folder,
        })
        return `Installed ${ext.schema?.name}`
      } catch (error) {
        catchError(error)
        return `Failed to install ${ext.schema?.name}`
      }
    }))

    for (const result of results) {
      if (result.status === 'fulfilled') {
        ux.log(result.value)
      }
    }

    ux.action.stop()
    ux.log('Finished installing extensions')
  } else {
    // All extensions are already installed
    ux.log('All extensions are already installed')
  }

  if (localExtensions.length > 0) {
    ux.log(`Note: ${localExtensions.length} local extensions need to be installed manually.`)
  }
}
