import fs from "node:fs";
import path from "node:path";
import { api } from "../api";

export async function getAssetList() {
  const { data }: { data } = await api.get("/files", {
    params: {
      limit: "-1",
    },
  });
  return data.data;
}

export async function downloadFile(file: any) {
  const response = await api.get(`assets/${file.id}`, {
    responseType: "stream",
  });

  // Create assets folder if it doesnt exist
  const fullPath = path.join(__dirname, "..", "..", "source", "assets");
  if (path && !fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath);
  }

  const WritePath = path.resolve(
    __dirname,
    "..",
    "..",
    "source",
    "assets",
    file.filename_disk
  );
  const writer = fs.createWriteStream(WritePath);

  (response.data as NodeJS.ReadableStream).pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      console.log(`Wrote ${file.filename_disk}`);
      resolve(null);
    });
    writer.on("error", reject);
  });
}

export async function downloadAllFiles() {
  const fileList = await getAssetList();
  for (const file of fileList) {
    try {
      await downloadFile(file);
    } catch (error) {
      console.log(`error downloading ${file.filename_disk}`, error);
    }
  }
}
