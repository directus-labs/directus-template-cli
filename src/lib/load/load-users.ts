import {api} from '../api'
import generator from 'generate-password'

export default async (users: any[]) => {
  const cleanedUpUsers = users.map(user => {
    // TODO: Find user role by id in the saved roles.json file. If it's the Directus boostrapped admin role, replace it with the Administrator role id from the new Directus instance.
    delete user.role
    //
    delete user.last_page
    delete user.token
    // user.password = getNewPassword()
    return user
  })
  for (const user of cleanedUpUsers) {
    try {
      await api.post('users', user)
      // console.log('Uploaded User' + user.email)
    } catch (error) {
      console.log('Error uploading user.', error.response.data.errors)
    }
  }
}

const getNewPassword = () => {
  return generator.generate({
    length: 12,
    numbers: true,
  })
}
