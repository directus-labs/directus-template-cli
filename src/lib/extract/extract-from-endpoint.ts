import { api } from "../api";
import writeToFile from "../utils/write-to-file";

/**
 * [default query an endpoint and write the result to file]
 */
export default async function extractFromEndpoint(path: string, dir: string) {
  try {
    const { data }: { data: any } = await api.get(`/${path}`, {
      params: {
        limit: "-1",
      },
    });

    // Use the dynamic dir parameter
    await writeToFile(`${path}`, data.data, dir);
  } catch (error) {
    console.log(`Error querying endpoint ${path}:`, error);
  }
}
