import { api } from "../api";
import writeToFile from "../utils/write-to-file";
import filterFields from "../utils/filter-fields";

const systemFields = [
  "id",
  "name"
];

/**
 * Extract roles from the API
 */
export default async function extractAdminRole(dir: string) {
  try {
    const { data }: { data: any } = await api.get("/roles", {
      params: {
        limit: "-1",
        filter: {
          "name": {
            "_eq": "Administrator"
          }
        }
      },
    });

    const filteredData = filterFields(data.data, systemFields);

    // Use the dynamic dir parameter
    await writeToFile("admin-role", filteredData, dir);
  } catch (error) {
    console.log("Error extracting Roles:", error.response.data.errors);
  }
}
