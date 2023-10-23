import readFile from "../utils/read-file";
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
import { loadPermissions } from "./load-public-permissions";

export default async function apply(dir: string, cli: any) {
  // Get the source directory for the actual files
  const source = dir + "/src";

  // Load the template files into the destination
  await loadSchema(source + "/schema");
  cli.log("Loaded Schema");
  await loadRoles(readFile("roles", source));
  cli.log("Loaded Roles");
  await loadFiles(readFile("files", source), source); // Comes after folders
  cli.log("Loaded Files");
  await loadUsers(readFile("users", source)); // Comes after roles, files
  cli.log("Loaded Users");
  await loadFolders(source);
  cli.log("Loaded Folders");
  await loadDashboards(readFile("dashboards", source));
  cli.log("Loaded Dashboards");
  await loadToDestination("panels", readFile("panels", source)); // Comes after dashboards
  cli.log("Loaded Panels");
  await loadData(readFile("collections", source), source);
  cli.log("Loaded Data");

  // Loading Flows and Operations after data so we don't trigger the flows on the data we're loading
  await loadFlows(readFile("flows", source));
  cli.log("Loaded Flows");
  await loadOperations(readFile("operations", source)); // Comes after flows
  cli.log("Loaded Operations");

  await loadPresets(readFile("presets", source));
  cli.log("Loaded Presets");
  await loadSettings(readFile("settings", source));
  cli.log("Loaded Settings");
  await loadPermissions(readFile("permissions", source));
  cli.log("Loaded Permissions");
  return {};
}
