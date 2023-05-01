import {api} from '../api'

export default async (presets: any[]) => {
  const cleanPresets = presets.map(preset => {
    preset.user = null
    return preset
  })
  for (const preset of cleanPresets) {
    try {
      await api.post('presets', preset)
    } catch (error) {
      console.log('Error uploading preset', error.response.data.errors)
    }
  }
}
