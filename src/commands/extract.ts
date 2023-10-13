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

const separator = "------------------";

async function getTemplate() {
  const TEMPLATE_DIR = path.join(__dirname, "..", "..", "templates");
  const templates = await readTemplates(TEMPLATE_DIR);
  const templateChoices = templates.map((template: any) => {
    return { name: template.templateName, value: template };
  });

  const template: any = await inquirer.prompt([
    {
      name: "template",
      message: "Select a template.",
      type: "list",
      choices: templateChoices,
    },
  ]);

  return template;
}

export default class ExtractCommand extends Command {
  static description = "Extract a template from a Directus instance.";

  static examples = ["$ directus-template-cli extract"];

  static flags = {};

  public async run(): Promise<void> {
    const { flags } = await this.parse(ExtractCommand);

    const directory = await ux.prompt(
      "What directory would you like to extract the template to?"
    );

    this.log(`You selected ${directory}`);

    this.log(separator);

    const directusUrl = await getDirectusUrl();
    api.setBaseUrl(directusUrl);

    const directusToken = await getDirectusToken(directusUrl);
    api.setAuthToken(directusToken);

    this.log(separator);

    // Run load script
    ux.action.start(
      `Extracting template - from ${directusUrl} to ${directory}`
    );
    await extract(directory, this);
    ux.action.stop();

    this.log(separator);
    this.log("Template extracted successfully.");
    this.exit;
  }
}
