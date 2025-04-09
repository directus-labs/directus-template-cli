import chalk from 'chalk'

export const DIRECTUS_PURPLE = '#6644ff'
export const DIRECTUS_PINK = '#FF99DD'
export const SEPARATOR = '------------------'

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


export const BSL_LICENSE_URL = 'https://directus.io/bsl'
export const BSL_LICENSE_TEXT = `You REQUIRE a license to use Directus if your organisation has more than $5MM USD a year in revenue and/or funding. For all organizations and people with less than $5MM USD a year in revenue and funding, Directus is free for personal projects, hobby projects and in production. This second group does not require a license. \nDirectus is licensed under BSL1.1. Visit ${chalk.underline(chalk.cyan(BSL_LICENSE_URL))} for more information or reach out to us at ${chalk.underline(chalk.cyan('sales-demo-with-evil-sales@directus.io'))}.`
