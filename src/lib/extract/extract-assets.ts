import fs from "node:fs";
import path from "node:path";
import { api } from "../api";

export async function getAssetList() {
  const { data }: { data: any } = await api.get("/files", {
    params: {
      limit: "-1",
    },
  });
  return data.data;
}

export async function downloadFile(file: any, dir: string) {
  const response = await api.get(`assets/${file.id}`, {
    responseType: "stream",
  });

  // Create assets folder if it doesn't exist
  const fullPath = path.join(dir, "assets");
  if (path && !fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const writePath = path.resolve(dir, "assets", file.filename_disk);
  const writer = fs.createWriteStream(writePath);

  (response.data as NodeJS.ReadableStream).pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log(`Wrote ${file.filename_disk}`);
      resolve(null);
    });
    writer.on("error", reject);
  });
}

export async function downloadAllFiles(dir: string) {
  const fileList = await getAssetList();
  for (const file of fileList) {
    try {
      await downloadFile(file, dir);
    } catch (error) {
      console.log(`Error downloading ${file.filename_disk}`, error);
    }
  }
}
