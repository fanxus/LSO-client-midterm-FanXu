import { getJSON, setJSON } from "./storage.js";

const HISTORY_KEY = "pokememory-history";
const MAX_ENTRIES = 100;

function isValidEntry(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.id === "string" &&
    typeof entry.username === "string" &&
    typeof entry.favorite === "string" &&
    typeof entry.time === "number" &&
    Number.isFinite(entry.time) &&
    entry.time >= 0 &&
    typeof entry.cards === "number" &&
    Number.isInteger(entry.cards) &&
    entry.cards > 0 &&
    entry.cards % 2 === 0
  );
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function compareResults(a, b) {
  if (b.cards !== a.cards) return b.cards - a.cards;
  return a.time - b.time;
}

export function getLeaderboard() {
  const data = getJSON(HISTORY_KEY, []);
  if (!Array.isArray(data)) return [];
  return data.filter(isValidEntry).sort(compareResults);
}

function saveLeaderboard(entries) {
  setJSON(HISTORY_KEY, entries);
}

/**
 * Guarda una partida completada en localStorage.
 * Devuelve la entrada creada (o null si los datos no son válidos).
 */
export function saveResult({ username, favorite, favoriteImage, time, cards }) {
  const entry = {
    id: createId(),
    username: String(username ?? "").trim(),
    favorite: String(favorite ?? "").trim(),
    favoriteImage:
      typeof favoriteImage === "string" ? favoriteImage : "",
    time: Number(time),
    cards: Number(cards),
  };

  if (!isValidEntry(entry) || !entry.username || !entry.favorite) {
    return null;
  }

  const entries = getLeaderboard();
  entries.push(entry);
  entries.sort(compareResults);
  saveLeaderboard(entries.slice(0, MAX_ENTRIES));
  return entry;
}

/**
 * Vista compacta del ranking:
 * - ≤5: todos
 * - >5: primeras posiciones + indicación de omitidos
 * - la partida recién terminada siempre visible y marcada
 */
export function getRankingView(entries, highlightId, topCount = 5) {
  const ranked = entries.map((entry, index) => ({
    entry,
    position: index + 1,
    highlighted: Boolean(highlightId) && entry.id === highlightId,
  }));

  if (ranked.length <= topCount) {
    return { rows: ranked, omittedCount: 0 };
  }

  const topRows = ranked.slice(0, topCount);
  const highlightIndex = ranked.findIndex((row) => row.highlighted);

  if (highlightIndex === -1 || highlightIndex < topCount) {
    return {
      rows: topRows,
      omittedCount: ranked.length - topCount,
    };
  }

  return {
    rows: [...topRows, ranked[highlightIndex]],
    omittedCount: ranked.length - topCount - 1,
    gapBeforeHighlight: true,
  };
}

export function formatRankTime(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}m ${s}s`;
}
