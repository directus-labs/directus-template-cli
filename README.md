# Directus Template CLI

A CLI tool to make applying or extracting Directus "templates" a little easier...well a lot easier.

**Notes:**

- This is a pre-release. It is recommended for use on POC or demo projects only.
- ⚠️ Known issues with using MySQL currently, please use ONLY PostgreSQL or SQLite for your database provider.
- Templates are applied / extracted on an all or nothing basis – meaning that all the schema, content, and system settings are extracted or applied. We'd love to support more granular operations in the future. (PRs welcome 🙏)

## Usage

### Applying a Template

**To avoid potential conflicts and bad outcomes, templates can only be applied to a blank instance currently.**

1. Create a Directus instance on [Directus Cloud](https://directus.cloud) or using self-hosted version.
2. Login and create a Static Access Token for the admin user.
3. Copy the static token and your Directus URL.
4. Run the following command on the terminal and follow the prompts.

```
$ npx directus-template-cli apply
```

You can choose from our templates bundled with the CLI or you can also choose a template from a local directory.

### Extracting a Template

The CLI can also extract a template from a Directus instance so that it can be applied to other instances.

1. Make sure you remove any sensitive data from the Directus instance you don't want to include in the template.
2. Login and create a Static Access Token for the admin user.
3. Copy the static token and your Directus URL.
4. Run the following command on the terminal and follow the prompts.

```
$ npx directus-template-cli extract
```

## License

This tool is licensed under the [MIT License](https://opensource.org/licenses/MIT).
