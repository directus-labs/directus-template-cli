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

/**
 * Pick the license that applies to a Directus version. Directus 12 moved from BSL 1.1 to MSCL.
 * An unknown version gets MSCL, since every current release is 12 or later.
 * @param releaseId - The Directus version, e.g. "12.6.0"
 * @returns The license whose banner to show
 */
export function licenseForVersion(releaseId?: string): 'bsl' | 'mscl' {
  const major = Number.parseInt(releaseId?.split('.')[0] ?? '', 10)
  return Number.isNaN(major) || major >= 12 ? 'mscl' : 'bsl'
}

/**
 * Print the license banner for the connected Directus instance. Never throws, so it can't fail a successful run.
 * /server/health only includes releaseId for admins.
 */
export async function displayLicenseBanner() {
  let releaseId: string | undefined
  try {
    releaseId = (await api.client.request(serverHealth()))?.releaseId
  } catch {
    // Unreachable or not an admin: fall through to the default license
  }

  if (licenseForVersion(releaseId) === 'mscl') {
    console.warn(MSCL_LICENSE_HEADLINE)
    console.info(MSCL_LICENSE_TEXT)
    console.info(MSCL_LICENSE_CTA)
  } else {
    console.warn(BSL_LICENSE_HEADLINE)
    console.info(BSL_LICENSE_TEXT)
    console.info(BSL_LICENSE_CTA)
  }
}
