import { api } from "../api";
import writeToFile from "../utils/write-to-file";

export async function getCollections() {
  const { data }: { data } = await api.get("/collections");

  const collections = data.data
    .filter((item) => !item.collection.startsWith("directus_", 0))
    .filter((item) => item.schema != null)
    .map((i) => i.collection);
  return collections;
}

export async function getDataFromCollection(collection: string, dir: string) {
  try {
    const { data }: { data } = await api.get(`items/${collection}`); // ADD limit = -1
    writeToFile(`${collection}`, data.data, `${dir}/content/`);
  } catch {
    console.log(`error getting items from ${collection}`);
    // Errors are thrown for 'folder' collections
  }
}

export async function extractContent(dir: string) {
  const collections = await getCollections();
  for (const collection of collections) {
    await getDataFromCollection(collection, dir);
  }
}
