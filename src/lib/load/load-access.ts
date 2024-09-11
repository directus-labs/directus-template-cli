import {ux} from '@oclif/core'

import {api} from '../sdk'
import catchError from '../utils/catch-error'
import readFile from '../utils/read-file'

interface Access {
  id: string;
  policy: string;
  role: null | string;
  sort: null | number;
  user: null | string;
}

export default async function loadAccess(dir: string) {
  const access = readFile('access', dir) as Access[]
  ux.action.start(`Loading ${access.length} accesses`)

  // Fetch existing accesses
  const existingAccesses = await api.client.request(() => ({
    method: 'GET',
    params: {
      limit: -1,
    },
    path: '/access',
  })) as Access[]

  const existingAccessById = new Map(existingAccesses.map(acc => [acc.id, acc]))
  const existingAccessByCompositeKey = new Map(existingAccesses.map(acc => [getCompositeKey(acc), acc]))

  for await (const acc of access) {
    try {
      if (existingAccessById.has(acc.id)) {
        ux.log(`Skipping existing access with ID: ${acc.id}`)
        continue
      }

      const compositeKey = getCompositeKey(acc)
      if (existingAccessByCompositeKey.has(compositeKey)) {
        ux.log(`Skipping existing access with composite key: ${compositeKey}`)
        continue
      }

      // If the role is null, delete the role key to avoid errors
      if (acc.role === null) {
        delete acc.role
      }

      await api.client.request(() => ({
        body: JSON.stringify(acc),
        method: 'POST',
        path: '/access',
      }))

      ux.log(`Created new access: ${acc.id}`)

      // Add the new access to our maps
      existingAccessById.set(acc.id, acc)
      existingAccessByCompositeKey.set(compositeKey, acc)
    } catch (error) {
      catchError(error, {
        context: {
          access: acc,
        },
      })
    }
  }

  ux.action.stop()
  ux.log('Loaded Accesses')
}

// Helper function to generate a composite key for each access
function getCompositeKey(acc: Access): string {
  return `${acc.role ?? 'null'}-${acc.user ?? 'null'}-${acc.policy}`
}
