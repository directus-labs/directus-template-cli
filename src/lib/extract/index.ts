import fs from "node:fs";
import path from "node:path";

import { downloadAllFiles } from "./extract-assets";
import extractSchema from "./extract-schema";
import extractFromEndpoint from "./extract-from-endpoint";
import {
  extractPublicPermissions,
  extractPermissions,
} from "./extract-permissions";
import { extractContent } from "./extract-content";
import extractFolders from "./extract-folders";
import extractUsers from "./extract-users";
import extractRoles from "./extract-roles";
import extractFiles from "./extract-files";
import extractPresets from "./extract-presets";

const endpoints = [
  // "folders",
  // "fields",
  // "users",
  // "roles",
  // "files",
  "operations",
  // "permissions",
  "collections",
  "flows",
  "dashboards",
  "panels",
  // "presets",
  "settings",
];

export default async function extract(dir: string, cli: any) {
  // Get the destination directory for the actual files
  const destination = dir + "/src";

  // Check if directory exists, if not, then create it.
  if (!fs.existsSync(destination)) {
    console.log(`Attempting to create directory at: ${destination}`);
    fs.mkdirSync(destination, { recursive: true });
  }

  await extractSchema(destination);
  await extractFolders(destination);
  await extractUsers(destination);
  await extractRoles(destination);
  await extractFiles(destination);
  await extractPresets(destination);
  await extractPermissions(destination);
  await extractPermissions(destination);

  // Iterate through the endpoints
  for (const endpoint of endpoints) {
    await extractFromEndpoint(endpoint, destination);
  }

  // Extract public permissions
  await extractPublicPermissions(destination);

  // Extract content
  await extractContent(destination);

  // Extract assets
  await downloadAllFiles(destination);

  return {};
}
