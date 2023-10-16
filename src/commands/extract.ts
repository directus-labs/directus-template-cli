import { Command, Flags } from "@oclif/core";
import { ux } from "@oclif/core";
import * as inquirer from "inquirer";
import readTemplates from "../lib/utils/read-templates";
import validateUrl from "../lib/utils/validate-url";
import { cwd } from "node:process";
import fs from "node:fs";
import path from "node:path";

import { api } from "../lib/api";
import extract from "../lib/extract/";
import { getDirectusUrl, getDirectusToken } from "../lib/utils/auth";
import {
  generatePackageJsonContent,
  generateReadmeContent,
} from "../lib/utils/template-defaults";

const separator = "------------------";

export default class ExtractCommand extends Command {
  static description = "Extract a template from a Directus instance.";

  static examples = ["$ directus-template-cli extract"];

  static flags = {};

  public async run(): Promise<void> {
    const { flags } = await this.parse(ExtractCommand);

    const templateName = await ux.prompt("What is the name of the template?.");

    const directory = await ux.prompt(
      "What directory would you like to extract the template to? If it doesn't exist, it will be created."
    );

    this.log(`You selected ${directory}`);

    try {
      // Check if directory exists, if not, then create it.
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // Create package.json and README.md
      const packageJSONContent = generatePackageJsonContent(templateName);
      const readmeContent = generateReadmeContent(templateName);

      // Write the content to the specified directory
      const packageJSONPath = path.join(directory, "package.json");
      const readmePath = path.join(directory, "README.md");

      fs.writeFileSync(packageJSONPath, packageJSONContent);
      fs.writeFileSync(readmePath, readmeContent);
    } catch (error) {
      console.error(
        `Failed to create directory or write files: ${error.message}`
      );
    }

    this.log(separator);

    const directusUrl = await getDirectusUrl();
    api.setBaseUrl(directusUrl);

    const directusToken = await getDirectusToken(directusUrl);
    api.setAuthToken(directusToken);

    this.log(separator);

    // Run the extract script
    ux.action.start(
      `Extracting template - from ${directusUrl} to ${directory}`
    );

    await extract(directory, this);

    ux.action.stop();

    this.log(separator);

    this.log("Template extracted successfully.");

    this.exit(0);
  }
}
