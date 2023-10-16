import { Command, Flags } from "@oclif/core";
import { ux } from "@oclif/core";
import * as inquirer from "inquirer";
import { cwd } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { readTemplate, readAllTemplates } from "../lib/utils/read-templates";
import { api } from "../lib/api";
import apply from "../lib/load/";
import { getDirectusUrl, getDirectusToken } from "../lib/utils/auth";

const separator = "------------------";

async function getTemplate() {
  const TEMPLATE_DIR = path.join(__dirname, "..", "..", "templates");
  const templates = await readAllTemplates(TEMPLATE_DIR);

  const officialTemplateChoices = templates.map((template: any) => {
    return { name: template.templateName, value: template };
  });

  const templateType: any = await inquirer.prompt([
    {
      name: "templateType",
      message: "What type of template would you like to apply?",
      type: "list",
      choices: [
        {
          name: "Official templates",
          value: "official",
        },
        {
          name: "From a local directory",
          value: "local",
        },
        // {
        //   name: "From a git repository",
        //   value: "git",
        // },
      ],
    },
  ]);

  let template: any;

  if (templateType.templateType === "official") {
    template = await inquirer.prompt([
      {
        name: "template",
        message: "Select a template.",
        type: "list",
        choices: officialTemplateChoices,
      },
    ]);
  }

  if (templateType.templateType === "local") {
    const localTemplateDir = await ux.prompt(
      "What is the local template directory?"
    );

    if (!fs.existsSync(localTemplateDir)) {
      ux.error("Directory does not exist.");
    } else {
      template = { template: await readTemplate(localTemplateDir) };
    }
  }

  return template;
}

export default class ApplyCommand extends Command {
  static description = "Apply a template to a blank Directus instance.";

  static examples = ["$ directus-template-cli apply"];

  static flags = {};

  public async run(): Promise<void> {
    const { flags } = await this.parse(ApplyCommand);

    const chosenTemplate = await getTemplate();
    this.log(`You selected ${chosenTemplate.template.templateName}`);
    this.log(separator);

    const directusUrl = await getDirectusUrl();
    api.setBaseUrl(directusUrl);

    const directusToken = await getDirectusToken(directusUrl);
    api.setAuthToken(directusToken);

    this.log(separator);

    // Check if Directus instance is empty, if not, throw error
    const { data }: { data: any } = await api.get("/collections");
    // Look for collections that don't start with directus_
    const collections = data.data.filter((collection: any) => {
      return !collection.collection.startsWith("directus_");
    });

    if (collections.length > 0) {
      ux.error(
        "Directus instance is not empty. Please use a blank instance. Copying a template into an existing instance is not supported at this time."
      );
    }

    // Run load script
    ux.action.start(
      `Applying template - ${chosenTemplate.template.templateName}`
    );

    await apply(chosenTemplate.template.directoryPath, this);

    ux.action.stop();

    this.log(separator);

    this.log("Template applied successfully.");

    this.exit(0);
  }
}
