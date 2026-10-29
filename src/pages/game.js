import { clearSession } from "../services/session.js";

/**
 * Stub de la pantalla de juego: muestra sesión y permite cerrarla.
 * La lógica del Memory se añadirá después.
 */
export function renderGame(container, session, { onLogout }) {
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
      <p class="game-placeholder">Game board coming soon…</p>
    </div>
  `;

  const avatar = container.querySelector("#player-avatar");
  avatar.src = session.image;
  avatar.alt = session.name;
  container.querySelector("#player-username").textContent = session.username;
  container.querySelector("#player-favorite").textContent = session.name;

  container.querySelector("#logout").addEventListener("click", () => {
    clearSession();
    onLogout();
  });
}
