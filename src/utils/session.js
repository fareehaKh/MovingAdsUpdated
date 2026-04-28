// Session management using localStorage

export const setUserSession = (user) => {
  localStorage.setItem("movingads_user", JSON.stringify(user));
};

export const getUserSession = () => {
  const data = localStorage.getItem("movingads_user");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const clearUserSession = () => {
  localStorage.removeItem("movingads_user");
};

export const isLoggedIn = () => {
  return getUserSession() !== null;
};
