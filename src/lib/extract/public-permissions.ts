import { api } from "../api";
import writeToFile from "../utils/write-to-file";

export default async function extractPublicPermissions(dir: string) {
  try {
    const { data }: { data: any } = await api.get("permissions", {
      params: {
        limit: "-1",
        "filter[role][_null]": true,
      },
    });

    // Write the public permissions to the specified directory
    await writeToFile("public-permissions", data.data, dir);
  } catch (error) {
    console.log("Error fetching public permissions:", error);
  }
}
