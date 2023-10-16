import { api } from "../api";
import writeToFile from "../utils/write-to-file";
import filterFields from "../utils/filter-fields";

const systemFields = [
  "id",
  "storage",
  "filename_disk",
  "filename_download",
  "title",
  "type",
  "folder",
  "uploaded_by",
  "uploaded_on",
  "modified_by",
  "modified_on",
  "charset",
  "filesize",
  "width",
  "height",
  "duration",
  "embed",
  "description",
  "location",
  "tags",
  "metadata",
];

/**
 * Extract files from the API
 */
export default async function extractFiles(dir: string) {
  try {
    const { data }: { data: any } = await api.get("/files", {
      params: {
        limit: "-1",
      },
    });

    const filteredData = filterFields(data.data, systemFields);

    // Use the dynamic dir parameter
    await writeToFile("files", filteredData, dir);
  } catch (error) {
    console.log("Error extracting Files:", error.response.data.errors);
  }
}
