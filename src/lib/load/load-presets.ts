import { api } from "../api";

export default async (presets: any[]) => {
  await deleteAllPresets();
  const cleanPresets = presets.map((preset) => {
    preset.user = null;
    return preset;
  });
  try {
    await api.post("presets", cleanPresets);
  } catch (error) {
    console.log("Error uploading preset", error.response.data.errors);
  }
};

const deleteAllPresets = async () => {
  try {
    const { data: presets } = await api.get<any>("presets");
    const ids = presets.data.map((preset) => preset.id);
    await api.delete("presets", {
      data: ids,
    });
  } catch (error) {
    console.log("Error removing existing presets", error.response.data.errors);
  }
};
