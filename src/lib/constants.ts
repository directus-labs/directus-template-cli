import chalk from 'chalk'
export const DIRECTUS_PURPLE = '#6644ff'
export const DIRECTUS_PINK = '#FF99DD'
export const SEPARATOR = '------------------'

export const pinkText = chalk.hex(DIRECTUS_PINK)
export const purpleText = chalk.hex(DIRECTUS_PURPLE)

export const COMMUNITY_TEMPLATE_REPO = {
  string: 'github:directus-labs/directus-templates',
  url: 'https://github.com/directus-labs/directus-templates',
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


export const MSCL_LICENSE_URL = 'https://directus.com/license'

export const MSCL_LICENSE_HEADLINE = 'Directus is licensed under MSCL-1.0-GPL. A Competing Use—making the Software available in a way that competes with Directus\'s paid commercial offerings—is not permitted.'
export const MSCL_LICENSE_TEXT = 'Permitted uses include internal use, non-commercial education and research, and professional services to deploy or host Directus for licensees. You must not disable or circumvent license key functionality. Four years after release, the Software is also available under GPL-3.0.'

export const MSCL_LICENSE_CTA = `Visit ${pinkText(MSCL_LICENSE_URL)} for the full license terms.`

export const DEFAULT_DIRECTUS_URL = 'http://localhost:8055'
