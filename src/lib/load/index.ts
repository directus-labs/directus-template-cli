import { api } from "../api";
import readFile from "../utils/read-file";
import { checkPath } from "../utils/read-file";
import loadToDestination from "../utils/load-to-destination";
import loadSchema from "./load-schema";
import loadRoles from "./load-roles";
import loadDashboards from "./load-dashboards";
import loadFiles from "./load-files";
import loadFolders from "./load-folders";
import loadUsers from "./load-users";
import loadFlows from "./load-flows";
import loadOperations from "./load-operations";
import loadData from "./load-data";
import loadPresets from "./load-presets";
import loadSettings from "./load-settings";
import { loadPermissions } from "./load-permissions";

export default async function apply(dir: string, cli: any) {
  // Get the source directory for the actual files
  const source = dir + "/src";

  // Load the template files into the destination
  if ( checkPath("schema/snapshot", source) ){
    await loadSchema(source + "/schema");
    cli.log("Loaded Schema");
  }
  

  // Role Loading Logic
  // Several other elements depend on roles being present, to know about the old and new adminRoleID. 
  // Why are roles UUIDed anyway? Seems like something that could use a slug. What do I know...
  //if ( checkPath("roles", source) ){
    const roles = readFile("roles", source);
    const legacyAdminRoleId = roles.find(
      (role) => role.name === "Administrator"
    ).id;
    const currentUser = await api.get<any>("users/me");
    const newAdminRoleId = currentUser.data.data.role;
    await loadRoles(roles);
    cli.log("Loaded Roles");
  //}

  if ( checkPath("folders", source) ){
    await loadFolders(source);
    cli.log("Loaded Folders");
  }
  if ( checkPath("files", source) ){
    await loadFiles(readFile("files", source), source); // Comes after folders
    cli.log("Loaded Files");
  }

  if ( checkPath("users", source) ){
    await loadUsers(readFile("users", source), legacyAdminRoleId, newAdminRoleId); // Comes after roles, files
    cli.log("Loaded Users");
  }
  if ( checkPath("dashboard", source) ){
    await loadDashboards(readFile("dashboards", source));
    cli.log("Loaded Dashboards");

    await loadToDestination("panels", readFile("panels", source)); // Comes after dashboards
    cli.log("Loaded Panels");
  }

  if ( checkPath("collections", source) ){
    await loadData(readFile("collections", source), source);
    cli.log("Loaded Data");
  }

  if ( checkPath("flows", source) ){
    // Loading Flows and Operations after data so we don't trigger the flows on the data we're loading
    await loadFlows(readFile("flows", source));
    cli.log("Loaded Flows");

    await loadOperations(readFile("operations", source)); // Comes after flows
    cli.log("Loaded Operations");
  }

  if ( checkPath("presets", source) ){
    await loadPresets(readFile("presets", source));
    cli.log("Loaded Presets");
  }

  if ( checkPath("settings", source) ){
    await loadSettings(readFile("settings", source));
    cli.log("Loaded Settings");
  }

  await loadPermissions(
    readFile("permissions", source),
    legacyAdminRoleId,
    newAdminRoleId
  );
  cli.log("Loaded Permissions");

  return {};
}
