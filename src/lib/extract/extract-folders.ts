import { api } from "../api";
import writeToFile from "../utils/write-to-file";
import filterFields from "../utils/filter-fields";
const systemFields = ["id", "name", "parent"];

/**
 * Extract folders from the API
 */
export default async function extractFolders(dir: string) {
  try {
    const { data }: { data: any } = await api.get("/folders", {
      params: {
        limit: "-1",
      },
    });

    const filteredData = filterFields(data.data, systemFields);

    // Use the dynamic dir parameter
    await writeToFile("folders", filteredData, dir);
  } catch (error) {
    console.log("Error extracting Folders:", error.response.data.errors);
  }
}
