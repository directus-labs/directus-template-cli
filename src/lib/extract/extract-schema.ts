import fs from "node:fs";
import path from "node:path";
import { api } from "../api";
import writeToFile from "../utils/write-to-file";

export default async function extractSchema(dir: string) {
  const schemaDir = path.join(dir, "schema");

  // Check if directory for schema exists, if not, then create it.
  if (!fs.existsSync(schemaDir)) {
    console.log(`Attempting to create directory at: ${schemaDir}`);
    fs.mkdirSync(schemaDir, { recursive: true });
  }

  // Get the schema
  try {
    const { data }: { data: any } = await api.get("/schema/snapshot", {
      params: {
        limit: "-1",
      },
    });

    // Write the schema to the specified directory
    await writeToFile("schema/snapshot", data.data, dir);
  } catch (error) {
    console.log("Error fetching schema snapshot:", error);
  }
}
