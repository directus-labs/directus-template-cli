import {customEndpoint} from '@directus/sdk'
import {ux} from '@oclif/core'

import {api} from '../sdk'
import logError from '../utils/log-error'
import readFile from '../utils/read-file'

async function installExtension(extension: any) {
  await api.client.request(customEndpoint({
    path: '/extensions/registry/install',
    method: 'POST',
    body: JSON.stringify({
      extension: extension.id,
      version: extension.version,
    }),
  }))
}

export default async function loadExtensions(dir: string) {
  const extensions = readFile('extensions', dir)

  const registryExtensions = extensions.filter((extension: any) => extension.meta?.source === 'registry' && !extension.bundle)
  const bundles = extensions.reduce((acc: any, extension: any) => {
    if (extension.bundle) {
      if(acc.find((bundle: any) => bundle === extension.bundle)) {
        return acc
      }
      acc.push(extension.bundle)
    }
    return acc
  }, [])
  const localExtensions = extensions.filter((extension: any) => extension.meta?.source === 'local')

  const extensionsToInstall = extensions.filter((extension: any) => {
    if(extension.meta?.source === 'registry' && !extension.bundle) {
      return true
    }

    return false
  })

  ux.log(`Found ${extensions.length} extensions total: ${registryExtensions.length} registry extensions (including ${bundles.length} bundles), and ${localExtensions.length} local extensions`)

  if(extensionsToInstall.length > 0) {
    ux.action.start(`Installing ${extensionsToInstall.length} extensions (skipping local extensions. Please install them manually.)`)

    for (const extension of extensionsToInstall) {
      try {
        await installExtension({
          id: extension.id,
          version: extension.meta?.folder ?? undefined,
        })
      } catch (error) {
        logError(error)
      }
    }

    ux.action.stop()
    ux.log('Loaded Extensions')
  }
}
