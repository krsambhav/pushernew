export async function checkUser(userId) {
  const url = "http://104.192.2.29:3000/users/";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const users = await response.json();

    const userExists = users.some((user) => user.id === userId);

    return userExists;
  } catch (error) {
    console.error("Error fetching users:", error);
    return false;
  }
}
