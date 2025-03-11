import slugify from '@sindresorhus/slugify'

export function generatePackageJsonContent(templateName: string): string {
  const slugifiedName = slugify(templateName)

  const packageName = `directus-template-${slugifiedName}`

  return JSON.stringify(
    {
      author: '',
      description: '',
      directusTemplate: true,
      files: ['src'],
      name: packageName,
      templateName,
      version: '1.0.0',
    },
    null,
    2,
  )
}

export const generateReadmeContent = (templateName: string) => `# ${templateName} Template

This is a template for [Directus](https://directus.io/) - an open-source headless CMS and API. Use the template-cli to load / apply this template to a blank instance.

## Why

## What

## License

`
