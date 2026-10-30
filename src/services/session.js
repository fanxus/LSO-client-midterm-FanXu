const SESSION_KEY = "pokememory-session";

function isValidSession(data) {
  return (
    data !== null &&
    typeof data === "object" &&
    typeof data.username === "string" &&
    typeof data.id === "number" &&
    typeof data.name === "string" &&
    typeof data.image === "string"
  );
}

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    if (!isValidSession(data)) {
      clearSession();
      return null;
    }
    return data;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(profile) {
  if (!isValidSession(profile)) {
    throw new Error("Invalid session profile");
  }

  const { username, id, name, image } = profile;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ username, id, name, image }),
  );
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
