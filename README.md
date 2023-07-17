# Directus Template CLI

A CLI tool to apply Directus "templates" to a blank Directus instance.

Note: This is a pre-release. It is recommended for use on POC or demo projects only.

## Usage

1. Create a Directus instance on [Directus Cloud](https://directus.cloud) or using self-hosted version.
2. Login and create a Static Access Token for the admin user.
3. Copy the static token and your Directus URL.
4. Run the following command on the terminal and follow the prompts.
```
$ npx directus-template-cli apply
```

### Tips for use with Docker

If you are running a local Docker instance, you need to run this script from the Docker shell. 
After step 3. enter the Docker command line:
```
$ docker exec -it <directus-instance> sh
```

Also, if your Directus setup has a port mapping configured (e.g. `- 8066:8055`), make sure to 
use the _internal_ URL to Directus, which usually is `http://0.0.0.0:8055`. 

## License

This template is licensed under the [MIT License](https://opensource.org/licenses/MIT).
