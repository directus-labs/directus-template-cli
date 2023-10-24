import FormData from "form-data";
import { api } from "../api";

import fs from "node:fs";
import path from "node:path";

export default async (assets: any, dir: string) => {
  for (const asset of assets) {
    const fileName = asset.filename_disk;
    const assetPath = path.resolve(dir, "assets", fileName);
    const fileStream = fs.createReadStream(assetPath);

    const form = new FormData();
    form.append("id", asset.id);
    if (asset.title) form.append("title", asset.title);
    if (asset.description) form.append("description", asset.description);
    if (asset.folder) form.append("folder", asset.folder);
    form.append("file", fileStream);

    try {
      const { data }: { data: any } = await api.post("files", form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.log(error.response.data.errors);
    }
  }
  // console.log('file', file);
};
