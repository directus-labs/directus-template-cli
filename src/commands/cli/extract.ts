import {Command, ux, Flags} from '@oclif/core';
import fs from 'node:fs';
import path from 'node:path';

import extract from '../../lib/extract';
import {getDirectusToken, getDirectusUrl} from '../../lib/utils/auth';
import {
  generatePackageJsonContent,
  generateReadmeContent,
} from '../../lib/utils/template-defaults';

const separator = '------------------';

export default class ExtractCommand extends Command {
  static description = 'Extract a template from a Directus instance.';
  static flags = {
    templateName: Flags.string(),
    directory: Flags.string(),
    directusUrl: Flags.string(),
    directusToken: Flags.string(),
  };

  static examples = ['$ directus-template-cli extract'];

  public async run(): Promise<void> {
    const {flags} = await this.parse(ExtractCommand)
    if (!flags.templateName || !flags.directory || !flags.directusUrl || !flags.directusToken) {
      this.log('Missing required flags: --templateName, --directory, --directusUrl, --directusToken')
      this.exit(1)
    }

    this.log(`You selected ${flags.directory}`);
    try {
      // Check if directory exists, if not, then create it.
      if (!fs.existsSync(flags.directory)) {
        fs.mkdirSync(flags.directory, {recursive: true});
      }

      // Create package.json and README.md
      const packageJSONContent = generatePackageJsonContent(flags.templateName);
      const readmeContent = generateReadmeContent(flags.templateName);

      // Write the content to the specified directory
      const packageJSONPath = path.join(flags.directory, 'package.json');
      const readmePath = path.join(flags.directory, 'README.md');

      fs.writeFileSync(packageJSONPath, packageJSONContent);
      fs.writeFileSync(readmePath, readmeContent);
    } catch (error) {
      console.error(`Failed to create directory or write files: ${error.message}`);
    }

    this.log(separator);

    // Assuming getDirectusToken and getDirectusUrl do not require user interaction
    const directusUrl = await getDirectusUrl(flags.directusUrl)
    const directusToken = await getDirectusToken(directusUrl, flags.directusToken);
    if (!directusToken) {
      this.log('Invalid credentials. Please try again.');
      this.exit(1);
    }

    this.log(separator);

    // Run the extract script
    ux.action.start(`Extracting template - from ${directusUrl} to ${flags.directory}`);

    await extract(flags.directory);

    ux.action.stop();

    this.log(separator);

    this.log('Template extracted successfully.');

    this.exit(0);
  }
}
