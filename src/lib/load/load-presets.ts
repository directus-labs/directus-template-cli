import { api } from "../api";

export default async (presets: any[]) => {
  const cleanPresets = presets.map((preset) => {
    preset.user = null;
    delete preset.id;
    return preset;
  });
  try {
    await api.post("presets", cleanPresets);
  } catch (error) {
    console.log("Error uploading preset", error.response.data.errors);
  }
};
