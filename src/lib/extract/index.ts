import { downloadAllFiles } from "./extract-assets";
import extractFromEndpoint from "./extract-from-endpoint";
import extractPublicPermissions from "./public-permissions";
import { extractContent } from "./extract-content";

const endpoints = [
  "schema/snapshot",
  "folders",
  "operations",
  "fields",
  "users",
  "roles",
  "files",
  "permissions",
  "collections",
  "flows",
  "dashboards",
  "panels",
  "presets",
  "settings",
];

export default async function extract(dir: string, cli: any) {
  // Get the destination directory for the actual files
  const destination = dir + "/src";

  // Iterate through the endpoints
  for (const endpoint of endpoints) {
    await extractFromEndpoint(endpoint, destination);
  }

  // Extract public permissions
  await extractPublicPermissions(destination);

  // Extract content
  await extractContent(destination);

  // Extract assets
  await downloadAllFiles();

  return {};
}
