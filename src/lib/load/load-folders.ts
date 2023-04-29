import {api} from '../api'
import readFile from '../utils/read-file'

export default async function loadFolders(dir: string) {
  try {
    const folders = await readFile('folders', dir)
    const {data}:{data} = await api.post('/folders', folders)
    console.log('Folder creation', data)
  } catch (error) {
    console.log('Error loading Folders', error.response.data.errors)
  }
}
