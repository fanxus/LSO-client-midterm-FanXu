const SESSION_KEY = "pokememory-session";

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (
      typeof data.username !== "string" ||
      typeof data.id !== "number" ||
      typeof data.name !== "string" ||
      typeof data.image !== "string"
    ) {
      clearSession();
      return null;
    }
    return data;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession({ username, id, name, image }) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ username, id, name, image }),
  );
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function hasSession() {
  return getSession() !== null;
}
