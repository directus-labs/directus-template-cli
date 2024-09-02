import {ux} from '@oclif/core'

import {api} from '../sdk'
import writeToFile from '../utils/write-to-file'

interface Access {
  id: string;
  policy: string;
  role: null | string;
  sort: null | number;
  user: null | string;
}

export default async function extractAccess(dir: string) {
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
    ux.log('Extracted access')
  } catch (error) {
    ux.warn('Error extracting access:')
    ux.warn(error.message)
  }
}
