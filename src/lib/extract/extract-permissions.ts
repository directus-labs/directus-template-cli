import { api } from "../api";
import writeToFile from "../utils/write-to-file";

export async function extractPermissions(dir: string) {
  try {
    const { data }: { data: any } = await api.get("permissions", {
      params: {
        limit: "-1",
      },
    });

    // Delete the id field from the permissions so we don't have to reset the autoincrement on the db
    data.data.forEach((permission: any) => {
      delete permission.id;
    });

    // Write the public permissions to the specified directory
    await writeToFile("permissions", data.data, dir);
  } catch (error) {
    console.log("Error fetching permissions:", error);
  }
}
