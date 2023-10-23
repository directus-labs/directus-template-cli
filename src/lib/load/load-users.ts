import { api } from "../api";
import readFile from "../utils/read-file";

export default async (
  users: any[],
  legacyAdminRoleId: string | number,
  newAdminRoleId: string | number
) => {
  const cleanedUpUsers = users.map((user) => {
    // If the user is an admin, we need to change their role to the new admin role
    const isAdmin = user.role === legacyAdminRoleId;
    user.role = isAdmin ? newAdminRoleId : user.role;

    // Delete the unneeded fields
    delete user.last_page;
    delete user.token;

    return user;
  });

  for (const user of cleanedUpUsers) {
    try {
      await api.post("users", user);

      // console.log('Uploaded User' + user.email)
    } catch (error) {
      console.log("Error uploading user.", error.response.data.errors);
    }
  }
};
