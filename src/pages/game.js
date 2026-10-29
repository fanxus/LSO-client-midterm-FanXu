import cardBackImg from "../assets/cartapokemon.png";
import { clearSession } from "../services/session.js";
import { apiGetPokemonList, apiGetPokemon } from "../services/api.js";

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

      <div class="game-controls">
        <label>
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
        <span id="timer">0m 0s</span>
        <span id="score">Points: 0</span>
        <span id="game-status"></span>
      </div>
      <p id="game-error" class="field-error"></p>

      <div id="memory-board" class="memory-board"></div>
    </div>
  `;

  const avatar = container.querySelector("#player-avatar");
  avatar.src = session.image;
  avatar.alt = session.name;
  container.querySelector("#player-username").textContent = session.username;
  container.querySelector("#player-favorite").textContent = session.name;

  container.querySelector("#logout").addEventListener("click", () => {
    stopTimer();
    clearSession();
    onLogout();
  });

  const boardEl = container.querySelector("#memory-board");
  const startBtn = container.querySelector("#start-game");
  const resetBtn = container.querySelector("#reset-game");
  const cardCountInput = container.querySelector("#card-count");
  const timerEl = container.querySelector("#timer");
  const scoreEl = container.querySelector("#score");
  const statusEl = container.querySelector("#game-status");
  const errorEl = container.querySelector("#game-error");

  let allPokemon = [];
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let points = 0;
  let matched = 0;
  let totalPairs = 0;
  let timerId = null;
  let seconds = 0;

  function setError(msg) {
    errorEl.textContent = msg || "";
  }

  function updateScore() {
    scoreEl.textContent = `Points: ${points}`;
  }

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
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

  function clearBoard() {
    stopTimer();
    boardEl.innerHTML = "";
    points = 0;
    matched = 0;
    totalPairs = 0;
    seconds = 0;
    timerEl.textContent = "0m 0s";
    statusEl.textContent = "";
    updateScore();
    resetSelection();
    setError("");
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
        stopTimer();
        statusEl.textContent = "You win!";
      }
    } else {
      setTimeout(() => {
        firstCard.classList.remove("girada");
        secondCard.classList.remove("girada");
        resetSelection();
      }, 800);
    }
  }

  async function startGame() {
    setError("");
    statusEl.textContent = "";

    const cardCount = Number(cardCountInput.value);

    clearBoard();
    totalPairs = cardCount / 2;

    try {
      if (allPokemon.length === 0) {
        allPokemon = await apiGetPokemonList();
      }

      const chosen = shuffle(allPokemon).slice(0, totalPairs);
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

      const deck = shuffle([...withImages, ...withImages]);
      for (const pokemon of deck) {
        boardEl.appendChild(createCard(pokemon));
      }

      startTimer();
      updateScore();
    } catch {
      setError("Could not load Pokémon. Try again.");
    }
  }

  startBtn.addEventListener("click", () => {
    void startGame();
  });

  resetBtn.addEventListener("click", () => {
    void startGame();
  });
}
