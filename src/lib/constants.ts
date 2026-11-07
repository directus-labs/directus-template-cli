import chalk from 'chalk'
export const DIRECTUS_PURPLE = '#6644ff'
export const DIRECTUS_PINK = '#FF99DD'
export const SEPARATOR = '------------------'

export const pinkText = chalk.hex(DIRECTUS_PINK)
export const purpleText = chalk.hex(DIRECTUS_PURPLE)

export const COMMUNITY_TEMPLATE_REPO = {
  string: 'github:directus-labs/starters',
  url: 'https://github.com/directus-labs/starters',
}

export const DEFAULT_REPO = {
  owner: 'directus-labs',
  path: '',
  ref: 'main',
  repo: 'starters',
  url: 'https://github.com/directus-labs/starters',
}

export const POSTHOG_PUBLIC_KEY = 'phc_STopE6gj6LDIjYonVF7493kQJK8S4v0Xrl6YPr2z9br'
export const POSTHOG_HOST = 'https://us.i.posthog.com'

export const DEFAULT_BRANCH = 'main'

// Wording follows the License section of the Directus readme (directus/directus)
export const MSCL_LICENSE_URL = 'https://directus.com/license'
export const MSCL_OIG_URL = 'https://directus.com/oig'
export const MSCL_EMAIL = 'licensing@directus.io'

export const MSCL_LICENSE_HEADLINE = 'Directus is licensed under the Monospace Sustainable Core License (MSCL-1.0-GPL).'
export const MSCL_LICENSE_TEXT =
  'Organizations under $5M in annual revenue and 50 employees can use Directus for free under the Open Innovation Grant. A free core tier is available to everyone. Organizations above those thresholds using advanced or enterprise features require a commercial license.'

export const MSCL_LICENSE_CTA = `License: ${pinkText(MSCL_LICENSE_URL)} · Open Innovation Grant: ${pinkText(MSCL_OIG_URL)} · Questions: ${pinkText(MSCL_EMAIL)}`

export const BSL_LICENSE_URL = 'https://directus.io/bsl'
export const BSL_EMAIL = 'licensing@directus.io'

export const BSL_LICENSE_HEADLINE =
  'You REQUIRE a license to use Directus if your organization has more than $5MM USD a year in revenue and/or funding.'
export const BSL_LICENSE_TEXT =
  'For all organizations with less than $5MM USD a year in revenue and funding, Directus is free for personal projects, hobby projects and in production. This second group does not require a license. Directus is licensed under BSL 1.1.'

export const BSL_LICENSE_CTA = `Visit ${pinkText(BSL_LICENSE_URL)} for more information or reach out to us at ${pinkText(BSL_EMAIL)}.`

export const DEFAULT_DIRECTUS_URL = 'http://localhost:8055'

/**
 * Settings that identify one instance and its owner. Never extracted, never applied.
 */
export const INSTANCE_SETTINGS_KEYS = ['project_id', 'project_owner', 'project_usage', 'org_name', 'product_updates'] as const
