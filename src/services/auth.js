/**
 * Retrieves the current user and their auth token from localStorage.
 * Supports both old format (separate keys) and new format (user object)
 */
export const getCurrentUser = () => {
  // Try getting the user object first (new format)
  const userString = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  if (userString) {
    try {
      const user = JSON.parse(userString);
      return {
        ...user,
        token: token || user.token,
        // Ensure _id is available for socket connection
        _id: user._id || user.userId || user.id,
        id: user.id || user.userId || user._id
      };
    } catch (err) {
      console.error("❌ Error parsing user from localStorage:", err);
    }
  }

  // Fallback: construct user from individual keys (old format)
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email");
  const fullName = localStorage.getItem("fullName");
  const tenantId = localStorage.getItem("tenantId");

  if (!token || !userId) return null;

  return {
    _id: userId,
    id: userId,
    userId,
    token,
    role,
    email,
    fullName,
    name: fullName,
    tenantId
  };
};

/**
 * Helper to update user data without losing the session
 */
export const updateLocalUser = (newData) => {
  const current = getCurrentUser();
  if (current) {
    const updated = { ...current, ...newData };
    localStorage.setItem("user", JSON.stringify(updated));
    return updated;
  }
  return null;
};
