import { api } from "../api";
import writeToFile from "../utils/write-to-file";
import filterFields from "../utils/filter-fields";

const systemFields = [
  "id",
  "name",
  "description",
  "icon",
  "enforce_tfa",
  "external_id",
  "ip_whitelist",
  "app_access",
  "admin_access",
];

/**
 * Extract roles from the API
 */
export default async function extractRoles(dir: string) {
  try {
    const { data }: { data: any } = await api.get("/roles", {
      params: {
        limit: "-1",
      },
    });

    const filteredData = filterFields(data.data, systemFields);

    // Use the dynamic dir parameter
    await writeToFile("roles", filteredData, dir);
  } catch (error) {
    console.log("Error extracting Roles:", error.response.data.errors);
  }
}
