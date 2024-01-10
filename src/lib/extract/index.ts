import fs from "node:fs";
import path from "node:path";

import { downloadAllFiles } from "./extract-assets";
import extractSchema from "./extract-schema";
import extractFromEndpoint from "./extract-from-endpoint";
import { extractPermissions } from "./extract-permissions";
import { extractContent } from "./extract-content";
import extractFolders from "./extract-folders";
import extractUsers from "./extract-users";
import extractRoles from "./extract-roles";
import extractFiles from "./extract-files";
import extractPresets from "./extract-presets";
import extractAdminRole from "./extract-admin-role";

export const aspects = {
  "schema" : async (destination:string) => {
    await extractSchema( destination );
  },
  "roles and permission" : async (destination:string) => {
    await extractRoles( destination );
    await extractPermissions( destination );
  },
  "folders"     : async (destination:string) => await extractFolders( destination ),
  "users"       : async (destination:string) => await extractUsers( destination ),  
  "presets"     : async (destination:string) => await extractPresets( destination ),
  "settings"    : async (destination:string) => await extractFromEndpoint( "settings", destination ),

  "flows and operations" : async (destination:string) => {
    await extractFromEndpoint( "flows", destination );
    await extractFromEndpoint( "operations", destination );
  },
  "dashboards"  : async (destination:string) => {
    await extractFromEndpoint( "dashboards", destination );
    await extractFromEndpoint( "panels", destination );
  },
  "content" : async (destination:string) => {
    await extractFromEndpoint( "collections", destination );
    await extractFiles( destination );
    await downloadAllFiles( destination );
    await extractFolders( destination );
    await extractContent( destination );
  }
};

export default async function extract(dir: string, cli: any) {
  // Get the destination directory for the actual files
  const destination = dir + "/src";

  // Check if directory exists, if not, then create it.
  if (!fs.existsSync(destination)) {
    console.log(`Attempting to create directory at: ${destination}`);
    fs.mkdirSync(destination, { recursive: true });
  }

  //We need to make sure that we do have the admin role!
  await extractAdminRole(destination);

  for (const key of cli.selectedAspects) {
    const callback = aspects[key]
    console.log(`Fetching ${key}`)
    await callback( destination )
  }

  return {};
}
