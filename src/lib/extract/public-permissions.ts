import { api } from "../api";
import writeToFile from "../utils/write-to-file";

/**
 * [default query an endpoint and write the result to file]
 */
export default async function extractPublicPermissions(dir: string) {
  const { data }: { data } = await api.get("permissions", {
    params: {
      limit: "-1",
      "filter[role][_null]": true,
    },
  });
  writeToFile("public-permissions", data.data);
}
