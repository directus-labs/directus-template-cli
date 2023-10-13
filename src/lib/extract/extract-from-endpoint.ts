import { api } from "../api";
import writeToFile from "../utils/write-to-file";

/**
 * [default query an endpoint and write the result to file]
 */

export default async (path: string, dir: string) => {
  const { data }: { data } = await api.get(`/${path}`, {
    params: {
      limit: "-1",
    },
  });
  writeToFile(`${dir}/${path}`, data.data);
};
