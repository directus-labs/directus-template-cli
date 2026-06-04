import {serverHealth} from '@directus/sdk'

import {
  BSL_LICENSE_CTA,
  BSL_LICENSE_HEADLINE,
  BSL_LICENSE_TEXT,
  MSCL_LICENSE_CTA,
  MSCL_LICENSE_HEADLINE,
  MSCL_LICENSE_TEXT,
} from '../constants.js'
import {api} from '../sdk.js'

export const displayLicenseBanner = async () => {
  const {releaseId} = await api.client.request(serverHealth())

  const mainVersion = Number(releaseId.split('.')[0])

  const isMSCL = mainVersion >= 12

  if (isMSCL) {
    console.warn(MSCL_LICENSE_HEADLINE)
    console.info(MSCL_LICENSE_TEXT)
    console.info(MSCL_LICENSE_CTA)
  } else {
    console.warn(BSL_LICENSE_HEADLINE)
    console.info(BSL_LICENSE_TEXT)
    console.info(BSL_LICENSE_CTA)
  }
}
