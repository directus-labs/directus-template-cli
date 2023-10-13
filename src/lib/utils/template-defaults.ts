import slugify from "slugify";

export const generatePackageJsonContent = (templateName: string) => {
  const slugifiedName = slugify(templateName, {
    lower: true, // Convert to lowercase
    strict: true, // Remove special characters
  });

  const packageName = `directus-template-${slugifiedName}`;

  return JSON.stringify(
    {
      name: packageName,
      templateName: templateName,
      version: "1.0.0",
      description: "",
      author: "",
      license: "MIT",
      files: ["src"],
    },
    null,
    2
  );
};

export const generateReadmeContent = (templateName: string) => {
  return `# ${templateName} Template

This is a template for [Directus](https://directus.io/) - an open-source headless CMS and API. Use the template-cli to load / apply this template to a blank instance.

## Why

## What

## License

This template is licensed under the [MIT License](https://opensource.org/licenses/MIT).
`;
};
