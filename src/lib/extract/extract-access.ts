import {ux} from '@oclif/core'

import {DIRECTUS_PINK} from '../constants.js'
import {api} from '../sdk.js'
import catchError from '../utils/catch-error.js'
import writeToFile from '../utils/write-to-file.js'

interface Access {
  id: string;
  policy: string;
  role: null | string;
  sort: null | number;
  user: null | string;
}

export default async function extractAccess(dir: string) {
  ux.action.start(ux.colorize(DIRECTUS_PINK, 'Extracting access'))
  try {
    const response = await api.client.request<Access[]>(() => ({
      method: 'GET',
      path: '/access?limit=-1',
    }))

    // Delete the id field from the permissions so we don't have to reset the autoincrement on the db
    // for (const access of response) {
    //   delete access.id
    // }

    await writeToFile('access', response, dir)
  } catch (error) {
    catchError(error)
  }

  ux.action.stop()
}
