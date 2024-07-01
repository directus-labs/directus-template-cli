# Directus Template CLI

A CLI tool to make applying or extracting Directus "templates" a little easier...well a lot easier.

**Notes:**

- This is a pre-release. It is recommended for use on POC, demo, or greenfield projects only.
- ⚠️ Known issues with using MySQL currently, please use ONLY PostgreSQL or SQLite for your database provider.
- Templates are applied / extracted on an all or nothing basis – meaning that all the schema, content, and system settings are extracted or applied. We'd love to support more granular operations in the future. (PRs welcome 🙏)
- If you are extracting or applying from a remote source, the script can take quite a while depending on the "size" of your instance (how many collections, how many items in each collection, number and size of assets, etc). The script applies a strict rate limit of 10 requests per second using bottleneck.

## Breaking Changes in v0.4.0

- Templates are no longer being bundled with the CLI or included in this repository. Templates are stored in this repository - https://github.com/directus-community/directus-templates.
- When applying templates, the schema snapshot / schema diff is no longer used to create collections, fields, and relations. This allows support for loading multiple templates into a single instance.

## Usage

Using the @latest tag ensures you're receiving the latest version of the packaged templates with the CLI. You can review [the specific versions on NPM](https://www.npmjs.com/package/directus-template-cli) and use @{version} syntax to apply the templates included with that version.

### Applying a Template

1. Create a Directus instance on [Directus Cloud](https://directus.cloud) or using self-hosted version.
2. Login and create a Static Access Token for the admin user.
3. Copy the static token and your Directus URL.
4. Run the following command on the terminal and follow the prompts.

```
$ npx directus-template-cli@latest apply
```

You can choose from our templates bundled with the CLI or you can also choose a template from a local directory.

### Extracting a Template

The CLI can also extract a template from a Directus instance so that it can be applied to other instances.

1. Make sure you remove any sensitive data from the Directus instance you don't want to include in the template.
2. Login and create a Static Access Token for the admin user.
3. Copy the static token and your Directus URL.
4. Run the following command on the terminal and follow the prompts.

```
$ npx directus-template-cli@latest extract
```

## Extract Command

To extract a template named `name` from a directory `data/backup`, use the following command:

```
./bin/dev cli extract
    --templateName name
    --directory data/backup
    --directusUrl https://www.example.com
    --directusToken xxxxxx
```


### Parameters:

- `--templateName`: The name of the template you wish to extract.
- `--directory`: The path to the directory where the template will be extracted.
- `--directusUrl`: The URL of your Directus instance.
- `--directusToken`: An authentication token for accessing your Directus instance.



## Apply Command

To apply a locally stored template located at `data/backup` to your Directus instance, use the following command:

```
./bin/dev cli apply
    --templateType local-cli
    --templateLocation data/backup
    --directusUrl https://www.example.com
    --directusToken xxxxxx
```


### Parameters:

- `--templateType`: The type of the template you wish to apply (e.g., `local-cli`).
- `--templateLocation`: The path to the directory where the template is stored.
- `--directusUrl`: The URL of your Directus instance.
- `--directusToken`: An authentication token for accessing your Directus instance.



## License

This tool is licensed under the [MIT License](https://opensource.org/licenses/MIT).
