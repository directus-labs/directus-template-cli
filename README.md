# Directus Template CLI

A CLI tool to make applying or extracting Directus "templates" a little easier...well a lot easier.

**Notes:**

- This is a beta release. It is recommended for use on POC, demo, or greenfield projects only. When applying templates, you should always backup your project/database before applying a template.
- ⚠️ Known issues with using MySQL currently. We highly recommend using PostgreSQL or SQLite for your database provider. If you're using PostgreSQL in production, we recommend using PostgreSQL in local development as well.
- If you are extracting or applying from a remote source, the script can take quite a while depending on the "size" of your instance (how many collections, how many items in each collection, number and size of assets, etc). The script applies a strict rate limit of 10 requests per second using bottleneck.
- As of v0.5.0, the CLI is compatible with Directus 11 and up. If you need to apply or extract to an instance of Directus 10, you can use v0.4.0 of the CLI. `npx directus-template-cli@0.4 extract` or `npx directus-template-cli@0.4 apply`.

Using the @latest tag ensures you're receiving the latest version of the packaged templates with the CLI. You can review [the specific versions on NPM](https://www.npmjs.com/package/directus-template-cli) and use @{version} syntax to apply the templates included with that version.

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

Partial apply (apply only some of the parts of a template to the instance):

```
npx directus-template-cli@latest apply -p --directusUrl="http://localhost:8055" --userEmail="admin@example.com" --userPassword="your-password" --templateLocation="./my-template" --templateType="local" --partial --schema --permissions --no-content

```

Available flags for programmatic mode:

- `--directusUrl`: URL of the Directus instance to apply the template to (required)
- `--directusToken`: Token to use for the Directus instance (required if not using email/password)
- `--userEmail`: Email for Directus authentication (required if not using token)
- `--userPassword`: Password for Directus authentication (required if not using token)
- `--templateLocation`: Location of the template to apply (required)
- `--templateType`: Type of template to apply. Options: community, local, github. Defaults to `local`.
- `--partial`: Enable partial template application
- `--content`: Load Content (data)
- `--dashboards`: Load Dashboards
- `--extensions`: Load Extensions
- `--files`: Load Files
- `--flows`: Load Flows
- `--permissions`: Load Permissions
- `--schema`: Load Schema
- `--settings`: Load Settings
- `--users`: Load Users

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
- `--no-permissions`: Skip loading PermissionsI
- `--no-schema`: Skip loading Schema
- `--no-settings`: Skip loading Settings
- `--no-users`: Skip loading Users


#### Template Component Dependencies

When applying templates, certain components have dependencies on others. Here are the key relationships to be aware of:

- `--users`: Depends on `--permissions`. If you include users, permissions will automatically be included.
- `--permissions`: Depends on `--schema`. If you include permissions, the schema will automatically be included.
- `--content`: Depends on `--schema`. If you include content, the schema will automatically be included.
- `--files`: No direct dependencies, but often related to content. Consider including `--content` if you're including files.
- `--flows`: No direct dependencies, but may interact with other components. Consider your specific use case.
- `--dashboards`: No direct dependencies, but often rely on data from other components.
- `--extensions`: No direct dependencies, but may interact with other components.
- `--settings`: No direct dependencies, but affects the overall system configuration.

When using the `--partial` flag, keep these dependencies in mind. For example:

```
npx directus-template-cli@latest apply -p --directusUrl="http://localhost:8055" --directusToken="admin-token-here" --templateLocation="./my-template" --templateType="local" --partial --users
```

This command will automatically include `--permissions` and `--schema` along with `--users`, even if not explicitly specified.

If you use `--no-` flags, be cautious about excluding dependencies. For instance, using `--no-schema` while including `--content` may lead to errors or incomplete application of the template.


### Existing Data

You can apply a template to an existing Directus instance. This is nice because you can have smaller templates that you can "compose" for various use cases. The CLI tries to be smart about existing items in the target Directus instance. But mileage may vary depending on the size and complexity of the template and the existing instance.

**System Collections**

In most of the system collections (collections,roles, permissions, etc.), if an item with the same identifier already exists, it will be typically be SKIPPED vs overwritten.

Exceptions:

- directus_settings: The CLI attempts to merge the template's project settings with the existing settings in the target instance. Using the existing settings as a base and updating them with the values from the template. This should prevent overwriting branding, themes, and other customizations.

**Your Collections:**

For data in your own user-created collections, if an item has the same primary key, the data will be overwritten with the incoming data from the template.

---

## Extracting a Template

The CLI can also extract a template from a Directus instance so that it can be applied to other instances.

Note: We do not currently support partial extraction. The entire template will be extracted. We thought it better to have the data and not need it, than need it and not have it.

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

Available flags for programmatic mode:

- `--directusUrl`: URL of the Directus instance to extract the template from (required)
- `--directusToken`: Token to use for the Directus instance (required if not using email/password)
- `--userEmail`: Email for Directus authentication (required if not using token)
- `--userPassword`: Password for Directus authentication (required if not using token)
- `--templateLocation`: Directory to extract the template to (required)
- `--templateName`: Name of the template (required)

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
