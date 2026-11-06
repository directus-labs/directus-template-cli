---
"directus-template-cli": minor
---

`init` supports starters from directus-labs/starters with core and licensed variants, branch refs in template URLs, and community templates from the starters repo.

- New `--variant`, `--license`/`--no-license` and `--licenseKey` flags. Without them, `init` asks whether you have a license (or which variant to use), and asks for the key when the chosen version needs one. With no terminal to ask in, it uses the free core tier.
- License keys are written to `directus/.env`, quoted when needed.
- Templates that require a license (like cms-i18n) can't be used with `--no-license`.
- `apply --templateLocation=AgencyOS` no longer works, since Agency OS is no longer in the community template list.
