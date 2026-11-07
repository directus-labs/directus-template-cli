# directus-template-cli

## 0.9.1

### Patch Changes

- 05cb747: Stop extracting the project id and owner info (`project_id`, `project_owner`, `project_usage`, `org_name`, `product_updates`) into templates, and skip them when applying older templates that include them (#124).

## 0.9.0

### Minor Changes

- 62c1052: `init` supports starters from directus-labs/starters with core and licensed variants, branch refs in template URLs, and community templates from the starters repo.
  - New `--variant`, `--license`/`--no-license` and `--licenseKey` flags. Without them, `init` asks whether you have a license (or which variant to use), and asks for the key when the chosen version needs one.
  - With no terminal to ask in, `init` uses the free core version. It exits if the template needs a license and no `--licenseKey` is given, or if `--license`/`--licenseKey` is given for a template with several variants and no `--variant`.
  - License keys are written to `directus/.env`, quoted when needed.
  - Templates that require a license (like cms-i18n) can't be used with `--no-license`.
  - Template URLs take `?ref=<branch>` for branch names with slashes. Branch names with characters the download can't handle (like `+` or `#`) are refused instead of quietly downloading another branch.
  - Breaking: `apply --templateType=community --templateLocation=AgencyOS` no longer works, since Agency OS is no longer in the community template list.

## 0.8.2

### Patch Changes

- fd52ba1: Stop sending `license_key` and `license_token` when applying settings, so templates apply on licensed Directus instances (#143).
- 273733d: Show the MSCL license banner for Directus 12 and later, and the BSL banner for earlier versions.
