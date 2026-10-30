import cardBackImg from "../assets/cartapokemon.png";
import { clearSession } from "../services/session.js";
import { apiGetPokemonList, apiGetPokemon } from "../services/api.js";
import {
  getLeaderboard,
  saveResult,
  getRankingView,
  formatRankTime,
} from "../services/leaderboard.js";

const MAX_CARDS = 32;

export function renderGame(container, { session, onLogout }) {
  container.innerHTML = `
    <div class="game-page">
      <header class="game-header">
        <div class="game-player">
          <img class="game-player-avatar" id="player-avatar" alt="" />
          <div>
            <h1 id="player-username"></h1>
            <p class="game-stats">
              Favorite: <span id="player-favorite"></span>
            </p>
          </div>
        </div>
        <button type="button" class="btn btn-secondary" id="logout">
          Log out
        </button>
      </header>

      <section id="setup-view" class="setup-view">
        <h2>Start a game</h2>
        <p class="setup-hint">Choose how many cards to begin with</p>
        <label class="setup-field">
          Cards
          <select id="card-count">
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8" selected>8</option>
            <option value="10">10</option>
            <option value="12">12</option>
            <option value="16">16</option>
          </select>
        </label>
        <button type="button" class="btn" id="start-game">Start</button>
        <p id="setup-error" class="field-error"></p>
      </section>

      <section id="play-view" class="play-view" hidden>
        <div class="play-toolbar">
          <button type="button" class="btn btn-secondary" id="menu-btn">
            Menu
          </button>
          <button type="button" class="btn" id="next-level" hidden>
            Next level
          </button>
          <button
            type="button"
            class="icon-btn"
            id="reset-game"
            aria-label="Reset"
            title="Reset"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-2.6-6.4" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </button>
        </div>

        <div class="game-stats">
          <span id="round">Round: 1</span>
          <span id="timer">0m 0s</span>
          <span id="score">Points: 0</span>
        </div>
        <div
          id="game-status"
          class="game-status"
          role="status"
          aria-live="polite"
          hidden
        ></div>
        <p id="game-error" class="field-error"></p>

        <div id="memory-board" class="memory-board"></div>
      </section>

      <section class="leaderboard" aria-label="Ranking">
        <h3>Ranking</h3>
        <div class="leaderboard-table-wrap">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th scope="col">Pos</th>
                <th scope="col">Player</th>
                <th scope="col">Pokémon</th>
                <th scope="col">Time</th>
                <th scope="col">Cards</th>
              </tr>
            </thead>
            <tbody id="leaderboard-body"></tbody>
          </table>
        </div>
        <p id="leaderboard-omitted" class="leaderboard-omitted" hidden></p>
        <p id="leaderboard-empty" class="leaderboard-empty" hidden>
          No results yet.
        </p>
      </section>
    </div>
  `;

  const avatar = container.querySelector("#player-avatar");
  avatar.src = session.image;
  avatar.alt = session.name;
  container.querySelector("#player-username").textContent = session.username;
  container.querySelector("#player-favorite").textContent = session.name;

  container.querySelector("#logout").addEventListener("click", () => {
    stopTimer();
    clearFlipTimeout();
    clearSession();
    onLogout();
  });

  const setupView = container.querySelector("#setup-view");
  const playView = container.querySelector("#play-view");
  const boardEl = container.querySelector("#memory-board");
  const startBtn = container.querySelector("#start-game");
  const menuBtn = container.querySelector("#menu-btn");
  const nextLevelBtn = container.querySelector("#next-level");
  const resetBtn = container.querySelector("#reset-game");
  const cardCountInput = container.querySelector("#card-count");
  const roundEl = container.querySelector("#round");
  const timerEl = container.querySelector("#timer");
  const scoreEl = container.querySelector("#score");
  const statusEl = container.querySelector("#game-status");
  const errorEl = container.querySelector("#game-error");
  const setupErrorEl = container.querySelector("#setup-error");
  const leaderboardBody = container.querySelector("#leaderboard-body");
  const leaderboardEmpty = container.querySelector("#leaderboard-empty");
  const leaderboardOmitted = container.querySelector("#leaderboard-omitted");

  let allPokemon = [];
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let points = 0;
  let matched = 0;
  let totalPairs = 0;
  let timerId = null;
  let flipTimeoutId = null;
  let seconds = 0;
  let round = 1;
  let currentCards = 0;
  let startCards = 0;
  let latestResultId = null;
  let resultSavedForRound = false;

  function createLeaderboardRow(row, { showGapBefore = false } = {}) {
    const fragment = document.createDocumentFragment();

    if (showGapBefore) {
      const gap = document.createElement("tr");
      gap.className = "leaderboard-gap";
      gap.innerHTML = `<td colspan="5">… omitted results …</td>`;
      fragment.appendChild(gap);
    }

    const tr = document.createElement("tr");
    tr.className = "leaderboard-row";
    if (row.highlighted) {
      tr.classList.add("leaderboard-row-latest");
    }

    tr.innerHTML = `
      <td class="leaderboard-pos">${row.position}</td>
      <td class="leaderboard-player"></td>
      <td class="leaderboard-pokemon">
        <span class="leaderboard-pokemon-cell">
          <img class="leaderboard-avatar" alt="" />
          <span class="leaderboard-favorite"></span>
        </span>
      </td>
      <td class="leaderboard-time"></td>
      <td class="leaderboard-cards"></td>
    `;

    tr.querySelector(".leaderboard-player").textContent = row.entry.username;
    tr.querySelector(".leaderboard-favorite").textContent = row.entry.favorite;
    tr.querySelector(".leaderboard-time").textContent = formatRankTime(
      row.entry.time,
    );
    tr.querySelector(".leaderboard-cards").textContent = String(row.entry.cards);

    const img = tr.querySelector(".leaderboard-avatar");
    if (row.entry.favoriteImage) {
      img.src = row.entry.favoriteImage;
      img.alt = row.entry.favorite;
    } else {
      img.hidden = true;
    }

    fragment.appendChild(tr);
    return fragment;
  }

  function renderLeaderboard() {
    const entries = getLeaderboard();
    leaderboardBody.innerHTML = "";
    leaderboardOmitted.hidden = true;
    leaderboardOmitted.textContent = "";

    if (entries.length === 0) {
      leaderboardEmpty.hidden = false;
      return;
    }

    leaderboardEmpty.hidden = true;
    const view = getRankingView(entries, latestResultId, 5);

    view.rows.forEach((row, index) => {
      const showGapBefore =
        Boolean(view.gapBeforeHighlight) && index === view.rows.length - 1;
      leaderboardBody.appendChild(createLeaderboardRow(row, { showGapBefore }));
    });

    if (view.omittedCount > 0) {
      leaderboardOmitted.hidden = false;
      leaderboardOmitted.textContent = `${view.omittedCount} more result${
        view.omittedCount === 1 ? "" : "s"
      } omitted.`;
    }
  }

  function persistCompletedGame() {
    if (resultSavedForRound) return;

    const saved = saveResult({
      username: session.username,
      favorite: session.name,
      favoriteImage: session.image,
      time: seconds,
      cards: currentCards,
    });

    if (!saved) return;

    resultSavedForRound = true;
    latestResultId = saved.id;
    renderLeaderboard();
  }

  function clearStatus() {
    statusEl.hidden = true;
    statusEl.classList.remove("game-status-win", "game-status-final");
    statusEl.innerHTML = "";
  }

  function showVictoryStatus({ final = false, nextCards = null } = {}) {
    statusEl.hidden = false;
    statusEl.classList.add("game-status-win");
    statusEl.classList.toggle("game-status-final", final);

    const nextHint = final
      ? "No more levels — you finished the run."
      : `Ready for the next level (${nextCards} cards).`;

    statusEl.innerHTML = `
      <p class="game-status-title">${final ? "You win!" : "Level cleared!"}</p>
      <p class="game-status-detail">
        Time ${formatTime(seconds)} · ${points} points · Saved to ranking
      </p>
      <p class="game-status-hint">${nextHint}</p>
    `;
  }

  function showSetup() {
    stopTimer();
    clearFlipTimeout();
    boardEl.innerHTML = "";
    nextLevelBtn.hidden = true;
    clearStatus();
    errorEl.textContent = "";
    setupView.hidden = false;
    playView.hidden = true;
    renderLeaderboard();
  }

  function showPlay() {
    setupView.hidden = true;
    playView.hidden = false;
  }

  function setError(msg) {
    errorEl.textContent = msg || "";
  }

  function updateScore() {
    scoreEl.textContent = `Points: ${points}`;
  }

  function updateRound() {
    roundEl.textContent = `Round: ${round}`;
  }

  function formatTime(totalSeconds) {
    return formatRankTime(totalSeconds);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function clearFlipTimeout() {
    if (flipTimeoutId) {
      clearTimeout(flipTimeoutId);
      flipTimeoutId = null;
    }
  }

  function startTimer() {
    stopTimer();
    seconds = 0;
    timerEl.textContent = formatTime(seconds);
    timerId = setInterval(() => {
      seconds += 1;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function resetSelection() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
  }

  function shuffle(list) {
    return [...list].sort(() => Math.random() - 0.5);
  }

  function createCard(pokemon) {
    const box = document.createElement("div");
    box.className = "carta-box";
    box.dataset.id = String(pokemon.id);

    box.innerHTML = `
      <div class="carta">
        <div class="cara">
          <img src="${cardBackImg}" alt="card back" />
        </div>
        <div class="cara detras">
          <img src="${pokemon.image}" alt="${pokemon.name}" />
        </div>
      </div>
    `;

    box.addEventListener("click", () => onCardClick(box));
    return box;
  }

  function onCardClick(card) {
    if (lockBoard) return;
    if (card.classList.contains("girada")) return;
    if (card.classList.contains("adivinado")) return;

    card.classList.add("girada");

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    lockBoard = true;

    const id1 = firstCard.dataset.id;
    const id2 = secondCard.dataset.id;

    if (id1 === id2) {
      firstCard.classList.add("adivinado");
      secondCard.classList.add("adivinado");
      points += 2;
      matched += 1;
      updateScore();
      resetSelection();

      if (matched === totalPairs) {
        finishRound();
      }
    } else {
      const pendingFirst = firstCard;
      const pendingSecond = secondCard;
      clearFlipTimeout();
      flipTimeoutId = setTimeout(() => {
        pendingFirst.classList.remove("girada");
        pendingSecond.classList.remove("girada");
        flipTimeoutId = null;
        resetSelection();
      }, 800);
    }
  }

  function finishRound() {
    stopTimer();
    lockBoard = true;
    persistCompletedGame();

    const nextCards = currentCards * 2;
    if (nextCards > MAX_CARDS) {
      showVictoryStatus({ final: true });
      nextLevelBtn.hidden = true;
      return;
    }

    showVictoryStatus({ nextCards });
    nextLevelBtn.hidden = false;
  }

  function goNextLevel() {
    const nextCards = currentCards * 2;
    if (nextCards > MAX_CARDS) return;

    round += 1;
    currentCards = nextCards;
    nextLevelBtn.hidden = true;
    void playRound(currentCards);
  }

  async function playRound(cardCount) {
    setError("");
    clearStatus();
    nextLevelBtn.hidden = true;
    stopTimer();
    clearFlipTimeout();
    boardEl.innerHTML = "";
    matched = 0;
    totalPairs = cardCount / 2;
    resultSavedForRound = false;
    resetSelection();
    updateRound();
    updateScore();
    showPlay();

    try {
      if (allPokemon.length === 0) {
        allPokemon = await apiGetPokemonList();
      }

      const includeFavorite = Math.random() < 0.25;
      let pool = allPokemon;

      if (includeFavorite) {
        pool = allPokemon.filter((p) => p.name !== session.name);
      }

      const chosen = shuffle(pool).slice(
        0,
        includeFavorite ? totalPairs - 1 : totalPairs,
      );

      const withImages = await Promise.all(
        chosen.map(async (p) => {
          const data = await apiGetPokemon(p.name);
          return {
            id: data.id,
            name: data.name,
            image: data.sprites.front_default,
          };
        }),
      );

      if (includeFavorite) {
        withImages.push({
          id: session.id,
          name: session.name,
          image: session.image,
        });
      }

      const deck = shuffle([...withImages, ...withImages]);
      for (const pokemon of deck) {
        boardEl.appendChild(createCard(pokemon));
      }

      startTimer();
    } catch {
      setError("Could not load Pokémon. Try again.");
    }
  }

  function startGame() {
    setupErrorEl.textContent = "";
    round = 1;
    points = 0;
    startCards = Number(cardCountInput.value);
    currentCards = startCards;
    void playRound(currentCards);
  }

  function restartGame() {
    round = 1;
    points = 0;
    currentCards = startCards || Number(cardCountInput.value);
    void playRound(currentCards);
  }

  startBtn.addEventListener("click", () => {
    startGame();
  });

  menuBtn.addEventListener("click", () => {
    showSetup();
  });

  nextLevelBtn.addEventListener("click", () => {
    goNextLevel();
  });

  resetBtn.addEventListener("click", () => {
    restartGame();
  });

  renderLeaderboard();
}
