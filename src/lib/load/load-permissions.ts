import { api } from "../api";
import loadToDestination from "../utils/load-to-destination";

async function removeallPublicPermissions() {
  const { data }: { data } = await api.get(
    "permissions?filter[role][_null]=true&limit=-1"
  );
  console.log("Removing all public permissions", data.data);
  const ids = data.data.map((i) => i.id);
  if (!ids) return;
  await api.delete("permissions", {
    data: ids,
  });
}

const clearAdminPermissions = (
  permissions: any[],
  legacyAdminRoleId: string | number
) => {
  return permissions.filter(
    (permission) => permission.role !== legacyAdminRoleId
  );
};

export async function loadPermissions(
  permissions: any,
  legacyAdminRoleId: string | number,
  newAdminRoleId: string | number
) {
  await removeallPublicPermissions();
  permissions = clearAdminPermissions(permissions, legacyAdminRoleId);

  await loadToDestination("permissions", permissions);
}
