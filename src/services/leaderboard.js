const LEADERBOARD_KEY = "pokememory-leaderboard";
const MAX_ENTRIES = 50;

function isValidEntry(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.username === "string" &&
    typeof entry.image === "string" &&
    typeof entry.points === "number" &&
    typeof entry.round === "number"
  );
}

export function getLeaderboard() {
  const raw = localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) return [];

  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isValidEntry);
  } catch {
    return [];
  }
}

function saveLeaderboard(entries) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

/**
 * Guarda o actualiza la mejor puntuación del usuario.
 * Si ya existe una entrada con el mismo username, solo se reemplaza
 * cuando la nueva puntuación es mayor.
 */
export function saveScore({ username, image, points, round }) {
  if (!username || typeof points !== "number" || points <= 0) return;

  const entries = getLeaderboard();
  const existingIndex = entries.findIndex(
    (entry) => entry.username.toLowerCase() === username.toLowerCase(),
  );

  const next = {
    username,
    image: image || "",
    points,
    round: round || 1,
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    if (points <= entries[existingIndex].points) return;
    entries[existingIndex] = next;
  } else {
    entries.push(next);
  }

  entries.sort((a, b) => b.points - a.points || b.round - a.round);
  saveLeaderboard(entries.slice(0, MAX_ENTRIES));
}
