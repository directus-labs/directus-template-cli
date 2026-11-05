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
 * Ask the connected instance for its version. /server/info returns it to any logged-in user.
 * Uses a single fetch with a timeout, not the shared client, which retries 503 and 429 with no limit.
 * @returns The Directus version, or undefined if it can't be read
 */
export async function fetchDirectusVersion(): Promise<string | undefined> {
  if (!api.client || !api.url) return undefined

  try {
    const token = await api.client.getToken()
    const response = await fetch(`${api.url.replace(/\/$/, '')}/server/info`, {
      headers: token ? {Authorization: `Bearer ${token}`} : {},
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return undefined
    const {data} = await response.json()
    return data?.version
  } catch {
    return undefined
  }
}

/**
 * Print the license banner for the connected Directus instance. Never throws, so it can't fail a successful run.
 */
export async function displayLicenseBanner() {
  const releaseId = await fetchDirectusVersion()

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
