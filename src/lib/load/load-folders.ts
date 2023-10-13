import { api } from "../api";
import readFile from "../utils/read-file";

export default async function loadFolders(dir: string) {
  try {
    const folders = await readFile("folders", dir);

    const folderSkeleton = folders.map((folder) => {
      return { id: folder.id, name: folder.name };
    });

    // Create the folders
    const { data }: { data } = await api.post("/folders", folderSkeleton);

    // Loop through the folders and update them with relationships
    folders.forEach(async (folder) => {
      const { id, ...rest } = folder;
      await api.patch(`/folders/${id}`, rest);
    });

    console.log("Folder creation", data);
  } catch (error) {
    console.log("Error loading Folders", error.response.data.errors);
  }
}
