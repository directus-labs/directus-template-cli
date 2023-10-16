import { api } from "../api";
import writeToFile from "../utils/write-to-file";

/**
 * Extract Presets from the API
 */
export default async function extractPresets(dir: string) {
  try {
    const { data }: { data: any } = await api.get("/presets", {
      params: {
        limit: "-1",
        // Only get the global presets
        "filter[user][_null]": true,
      },
    });

    // Remove the id field from the presets so we don't have to reset the autoincrement on the db
    const filteredData = data.data.map((preset: any) => {
      delete preset.id;
      return preset;
    });

    await writeToFile("presets", filteredData, dir);
  } catch (error) {
    console.log("Error extracting Users:", error.response.data.errors);
  }
}
