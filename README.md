# Directus Template CLI

A streamlined CLI tool for creating new Directus projects and managing Directus templates - making it easy to apply and extract template configurations across instances.

This tool is best suited for:

- Proof of Concept (POC) projects
- Demo environments
- New project setups

⚠️ We strongly recommend against using this tool in existing production environments or as a critical part of your CI/CD pipeline without thorough testing. Always create backups before applying templates.

**Important Notes:**

- **Primary Purpose**: Built to deploy templates created by the Directus Core Team. While community templates are supported, the unlimited possible configurations make comprehensive support challenging.
- **Database Compatibility**: PostgreSQL is recommended. Applying templates that are extracted and applied between different databases (Extract from SQLite -> Apply to Postgres) can caused issues and is not recommended. MySQL users may encounter known issues.
- **Performance**: Remote operations (extract/apply) are rate-limited to 10 requests/second using bottleneck. Processing time varies based on your instance size (collections, items, assets).
- **Version Compatibility**:
  - v0.5.0+: Compatible with Directus 11 and up
  - v0.4.0: Use for Directus 10 compatibility (`npx directus-template-cli@0.4 extract/apply`)

Using the @latest tag ensures you're receiving the latest version of the packaged templates with the CLI. You can review [the specific versions on NPM](https://www.npmjs.com/package/directus-template-cli) and use @{version} syntax to apply the templates included with that version.

## Initializing a New Project

The CLI can initialize a new Directus project with an optional frontend framework using official or community templates.

1. Run the following command and follow the interactive prompts:

```
npx directus-template-cli@latest init
```

You'll be guided through:

- Selecting a directory for your new project
- Choosing a Directus backend template
- Selecting a frontend framework (if available for the template)
- Setting up Git and installing dependencies

### Command Options

You can also provide arguments and flags:

```
npx directus-template-cli@latest init my-project
```

The first argument (`my-project` in the example above) specifies the directory where the project will be created. If not provided, you'll be prompted to enter a directory during the interactive process.

```
npx directus-template-cli@latest init --frontend=nextjs --template=cms
npx directus-template-cli@latest init my-project --frontend=nextjs --template=cms
npx directus-template-cli@latest init --template=https://github.com/directus-labs/starters/tree/main/cms
```

Available flags:

- `--frontend`: Frontend framework to use (e.g., nextjs, nuxt, astro)
- `--gitInit`: Initialize a new Git repository (defaults to true, use --no-gitInit to disable)
- `--installDeps`: Install dependencies automatically (defaults to true, use --no-installDeps to disable)
- `--overwriteDir`: Override the default directory if it already exists (defaults to false)
- `--template`: Template name (e.g., simple-cms) or GitHub URL (e.g., https://github.com/directus-labs/starters/tree/main/cms)
- `--disableTelemetry`: Disable telemetry collection

You can use any public GitHub repository URL for the `--template` parameter, pointing to the specific directory containing the template. This is especially useful for using community-maintained templates or your own custom templates hosted on GitHub.

### Creating Custom Templates

You can create your own custom templates for use with the `init` command. A template is defined by a `package.json` file with a `directus:template` property that specifies the template configuration.

NOTE: the `init` command will NOT work without this step of the process.

Here's an example of a template configuration:

```json
{
  "name": "directus-cms-starter",
  "version": "1.0.0",
  "description": "A starter template for Directus CMS projects",
  "directus:template": {
    "name": "CMS",
    "description": "A ready-to-use CMS with block builder, visual editing, and integration with your favorite framework.",
    "template": "./directus/template",
    "frontends": {
      "nextjs": {
        "name": "Next.js",
        "path": "./nextjs"
      },
      "nuxt": {
        "name": "Nuxt",
        "path": "./nuxt"
      },
      "astro": {
        "name": "Astro",
        "path": "./astro"
      },
      "svelte": {
        "name": "Svelte",
        "path": "./sveltekit"
      }
    }
  }
}
```

The `directus:template` property contains:

- `name`: Display name for the template in the CLI
- `description`: A brief description of the template's purpose and features
- `template`: Path to the Directus template directory (containing schema, permissions, etc.) - this should point to a template extracted using the `extract` command
- `frontends`: Object defining available frontend frameworks for this template
  - Each key is a frontend identifier used with the `--frontend` flag
  - Each frontend has a `name` (display name) and `path` (directory containing the frontend code)

When you use this template with the `init` command, it will:

1. Copy the Directus template files from the specified template directory
2. Copy the selected frontend code based on your choice or the `--frontend` flag
3. Set up the project structure with both backend and frontend integrated

> **Note**: The template directory (`./directus/template` in the example above) should contain a valid Directus template created using the `extract` command. The directory structure should match what is created by the CLI when extracting a template, with subdirectories for schema, permissions, content, etc.

## Applying a Template

🚧 Make backups of your project/database before applying templates.

1. Create a Directus instance on [Directus Cloud](https://directus.cloud) or using self-hosted version.
2. Login and create a Static Access Token for the admin user.
3. Copy the static token and your Directus URL.
4. Run the following command on the terminal and follow the prompts.

```
npx directus-template-cli@latest apply
```

You can choose from our community maintained templates or you can also choose a template from a local directory or a public GitHub repository.

### Programmatic Mode

By default, the CLI will run in interactive mode. For CI/CD pipelines or automated scripts, you can use the programmatic mode:

Using a token:

```
npx directus-template-cli@latest apply -p --directusUrl="http://localhost:8055" --directusToken="admin-token-here" --templateLocation="./my-template" --templateType="local"
```

Using email/password:

```
npx directus-template-cli@latest apply -p --directusUrl="http://localhost:8055" --userEmail="admin@example.com" --userPassword="admin" --templateLocation="./my-template" --templateType="local"
```

Partial apply (apply only some parts of a template):

```
npx directus-template-cli@latest apply -p --directusUrl="http://localhost:8055" --userEmail="admin@example.com" --userPassword="your-password" --templateLocation="./my-template" --templateType="local" --schema --permissions --no-content
```

Available flags:

- `--directusUrl`: URL of the Directus instance to apply the template to (required)
- `--directusToken`: Token to use for the Directus instance (required if not using email/password)
- `--userEmail`: Email for Directus authentication (required if not using token)
- `--userPassword`: Password for Directus authentication (required if not using token)
- `--templateLocation`: Location of the template to apply (required)
- `--templateType`: Type of template to apply. Options: community, local, github. Defaults to `local`.
- `--partial`: Enable partial template mode explicitly. Component and collection flags also imply partial mode.
- `--content`: Load Content (data)
- `--dashboards`: Load Dashboards
- `--extensions`: Load Extensions
- `--files`: Load Files
- `--flows`: Load Flows
- `--permissions`: Load Permissions
- `--schema`: Load Schema
- `--settings`: Load Settings
- `--users`: Load Users
- `--collections`: Only apply these comma-separated collections
- `--exclude-collections`: Exclude these comma-separated collections
- `--relation-strategy`: How to handle omitted relation targets. Options: `empty`, `preserve`, `deep`.
- `--allow-broken-relations`: Apply templates that intentionally preserve references to omitted records
- `--no-assets`: Shorthand for `--no-files` and excluding `directus_files`
- `--disableTelemetry`: Disable telemetry collection

When using `--partial`, you can also use `--no` flags to exclude specific components from being applied. For example:

```
npx directus-template-cli@latest apply -p --directusUrl="http://localhost:8055" --userEmail="admin@example.com" --userPassword="your-password" --templateLocation="./my-template" --templateType="local" --partial --no-content --no-users
```

This command will apply the template but exclude content and users. Available `--no` flags include:

- `--no-content`: Skip loading Content (data)
- `--no-dashboards`: Skip loading Dashboards
- `--no-extensions`: Skip loading Extensions
- `--no-files`: Skip loading Files
- `--no-flows`: Skip loading Flows
- `--no-permissions`: Skip loading Permissions
- `--no-schema`: Skip loading Schema
- `--no-settings`: Skip loading Settings
- `--no-users`: Skip loading Users

For how partial templates handle schema, content, and relations, see [Partial Templates and Relation Strategies](#partial-templates-and-relation-strategies).

#### Using Environment Variables

You can also pass flags as environment variables. This can be useful for CI/CD pipelines or when you want to avoid exposing sensitive information in command-line arguments. Here are the available environment variables:

- `DIRECTUS_URL`: Equivalent to `--directusUrl`
- `DIRECTUS_TOKEN`: Equivalent to `--directusToken`
- `DIRECTUS_EMAIL`: Equivalent to `--userEmail`
- `DIRECTUS_PASSWORD`: Equivalent to `--userPassword`
- `TEMPLATE_LOCATION`: Equivalent to `--templateLocation`
- `TEMPLATE_TYPE`: Equivalent to `--templateType`

### Existing Data

You can apply a template to an existing Directus instance. This is nice because you can have smaller templates that you can "compose" for various use cases. The CLI tries to be smart about existing items in the target Directus instance. But mileage may vary depending on the size and complexity of the template and the existing instance.

**System Collections**

In most of the system collections (collections,roles, permissions, etc.), if an item with the same identifier already exists, it will be typically be SKIPPED vs overwritten.

Exceptions:

- `directus_settings`: The CLI attempts to merge the template's project settings with the existing settings in the target instance. Using the existing settings as a base and updating them with the values from the template. This should prevent overwriting branding, themes, and other customizations.

**Your Collections:**

For data in your own user-created collections, if an item has the same primary key, the data will be overwritten with the incoming data from the template.

---

## Extracting a Template

The CLI can also extract a template from a Directus instance so that it can be applied to other instances.

Full extraction remains the default. Partial extraction is available with component flags, collection filters, and relation strategies.

For how partial templates handle schema, content, and relations, see [Partial Templates and Relation Strategies](#partial-templates-and-relation-strategies).

1. Make sure you remove any sensitive data from the Directus instance you don't want to include in the template.
2. Login and create a Static Access Token for the admin user.
3. Copy the static token and your Directus URL.
4. Run the following command on the terminal and follow the prompts.

```
npx directus-template-cli@latest extract
```

### Programmatic Mode

By default, the CLI will run in interactive mode. For CI/CD pipelines or automated scripts, you can use the programmatic mode:

Using a token:

```
npx directus-template-cli@latest extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055"
```

Using email/password:

```
npx directus-template-cli@latest extract -p --templateName="My Template" --templateLocation="./my-template" --userEmail="admin@example.com" --userPassword="admin" --directusUrl="http://localhost:8055"
```

Available flags:

- `--directusUrl`: URL of the Directus instance to extract the template from (required)
- `--directusToken`: Token to use for the Directus instance (required if not using email/password)
- `--userEmail`: Email for Directus authentication (required if not using token)
- `--userPassword`: Password for Directus authentication (required if not using token)
- `--templateLocation`: Directory to extract the template to (required)
- `--templateName`: Name of the template (required)
- `--partial`: Enable partial template mode explicitly. Component and collection flags also imply partial mode.
- `--schema` / `--no-schema`: Include or skip schema
- `--content` / `--no-content`: Include or skip content
- `--files` / `--no-files`: Include or skip files and assets
- `--flows` / `--no-flows`: Include or skip flows
- `--dashboards` / `--no-dashboards`: Include or skip dashboards
- `--permissions` / `--no-permissions`: Include or skip permissions
- `--settings` / `--no-settings`: Include or skip settings
- `--extensions` / `--no-extensions`: Include or skip extensions
- `--users` / `--no-users`: Include or skip users
- `--collections`: Only extract these comma-separated collections
- `--exclude-collections`: Exclude these comma-separated collections
- `--relation-strategy`: How to handle omitted relation targets. Options: `empty`, `preserve`, `deep`.
- `--allow-broken-relations`: Mark intentionally incomplete relation references as allowed in metadata
- `--no-assets`: Shorthand for `--no-files` and excluding `directus_files`
- `--disableTelemetry`: Disable telemetry collection

Examples:

`--collections` limits content scope. Schema may still include additional collections needed by the data model.

Skip assets safely:

```
npx directus-template-cli@latest extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055" --schema --content --collections posts,pages --no-assets --relation-strategy empty
```

Preserve asset IDs but do not export assets:

```
npx directus-template-cli@latest extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055" --schema --content --collections posts,pages --no-assets --relation-strategy preserve --allow-broken-relations
```

Portable partial snapshot:

```
npx directus-template-cli@latest extract -p --templateName="My Template" --templateLocation="./my-template" --directusToken="admin-token-here" --directusUrl="http://localhost:8055" --schema --content --collections posts,pages --relation-strategy deep
```

#### Using Environment Variables

Similar to the Apply command, you can use environment variables for the Extract command as well:

- `DIRECTUS_URL`: Equivalent to `--directusUrl`
- `DIRECTUS_TOKEN`: Equivalent to `--directusToken`
- `DIRECTUS_EMAIL`: Equivalent to `--userEmail`
- `DIRECTUS_PASSWORD`: Equivalent to `--userPassword`
- `TEMPLATE_LOCATION`: Equivalent to `--templateLocation`

## Partial Templates and Relation Strategies

Partial templates can intentionally omit components or collections. The CLI writes and reads `src/template-meta.json` so apply can understand what was extracted.

Partial templates have two scopes:

- **Schema scope**: the data model needed to keep selected collections valid. This can include related, junction, translation, page-builder, and grouping collections even when no records are exported for them.
- **Content scope**: the records exported from collections requested with `--collections`, or records added by `deep`.

Example: extracting `pages,posts` may still include schema for `page_blocks`, block collections, translations, and groups. Only `pages.json` and `posts.json` are exported unless you use `deep`.

Relation strategies:

| Strategy   | What it exports            | What happens to omitted relations                                           | Best for                                    |
| ---------- | -------------------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| `empty`    | Selected content only      | M2O fields become `null`; alias/O2M/M2M/M2A fields are omitted from records | Clean subsets, skipping assets safely       |
| `preserve` | Selected content only      | Keeps IDs/arrays as-is and writes warnings                                  | Targets where related records already exist |
| `deep`     | Selected + related content | Keeps relation values and recursively exports related records               | Portable partial snapshots                  |

Tradeoffs:

- `empty` produces directly applyable templates, but applying to an existing instance can clear omitted M2O references.
- `preserve` can intentionally leave references to records that are not in the template. Apply requires `--allow-broken-relations` when metadata reports these references.
- `deep` is the most portable, but can expand into many collections and export much more data.

For example, a source record might contain both a file relation and a page-builder alias field:

```json
{
  "id": "post-1",
  "image": "file-uuid",
  "blocks": ["block-1", "block-2"]
}
```

With `--relation-strategy empty`, omitted relations are cleared or skipped:

```json
{
  "id": "post-1",
  "image": null
}
```

With `--relation-strategy preserve`, relation values stay in the record and metadata records warnings:

```json
{
  "id": "post-1",
  "image": "file-uuid",
  "blocks": ["block-1", "block-2"]
}
```

With `--relation-strategy deep`, the record stays the same and related content collections are exported too:

```jsonc
// content/posts.json
{
  "id": "post-1",
  "image": "file-uuid",
  "blocks": ["block-1", "block-2"],
}

// also exported:
// content/page_blocks.json
// content/block_hero.json
```

Skip assets safely:

```
npx directus-template-cli@latest apply -p --directusUrl="http://localhost:8055" --directusToken="admin-token-here" --templateLocation="./my-template" --templateType="local" --content --collections posts,pages --no-assets --relation-strategy empty
```

## Logs

The Directus Template CLI logs information to a file in the `.directus-template-cli/logs` directory.

Logs are automatically generated for each run of the CLI. Here's how the logging system works:

- A new log file is created for each CLI run.
- Log files are stored in the `.directus-template-cli/logs` directory within your current working directory.
- Each log file is named `run-[timestamp].log`, where `[timestamp]` is the ISO timestamp of when the CLI was initiated.

The logger automatically sanitizes sensitive information such as passwords, tokens, and keys before writing to the log file. But it may not catch everything. Just be aware of this and make sure to remove the log files when they are no longer needed.

Note: If you encounter any issues with the CLI, providing these log files can greatly assist in diagnosing and resolving the problem.

## License

This tool is licensed under the [MIT License](https://opensource.org/licenses/MIT).
