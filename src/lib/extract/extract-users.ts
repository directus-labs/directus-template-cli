import { api } from "../api";
import writeToFile from "../utils/write-to-file";
import filterFields from "../utils/filter-fields";

const systemFields = [
  "id",
  "status",
  "first_name",
  "last_name",
  "email",
  "password",
  "token",
  "last_access",
  "last_page",
  "external_identifier",
  "tfa_secret",
  "auth_data",
  "provider",
  "theme",
  "role",
  "language",
  "avatar",
  "title",
  "description",
  "location",
  "tags",
  "email_notifications",
];

/**
 * Extract users from the API
 */
export default async function extractUsers(dir: string) {
  try {
    const { data }: { data: any } = await api.get("/users", {
      params: {
        limit: "-1",
      },
    });

    const filteredData = filterFields(data.data, systemFields);

    // Use the dynamic dir parameter
    await writeToFile("users", filteredData, dir);
  } catch (error) {
    console.log("Error extracting Users:", error.response.data.errors);
  }
}
