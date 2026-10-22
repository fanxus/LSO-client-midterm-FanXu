import { apiGetPokemonList, apiGetPokemon } from "../services/api.js";

export async function renderGame(container) {
  container.innerHTML = `
    <div class="game-page">
  
      <div class="game-controls">
        <label>
          Cards (even number)
          <input type="number" id="card-count" min="4" step="2" value="8" />
        </label>
        <button type="button" id="start-game" class="btn">Start</button>
        <button type="button" id="reset-game" class="btn btn-secondary">Reset</button>
      </div>
      <div class="game-stats">
        <span id="timer">0m 0s</span>
        <span id="game-status"></span>
      </div>
      <div id="memory-board" class="memory-board"></div>

    </div>
  `;

  const boardEl = container.querySelector("#memory-board");
  const startBtn = container.querySelector("#start-game");
  const cardCountInput = container.querySelector("#card-count");
  let allPokemon = [];
  allPokemon = await apiGetPokemonList();

  const setBoard = (pairsNumber) => {
    return [...allPokemon]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairsNumber);
  }; //→ [squirtle, pikachu, mew, bulbasaur]

  startBtn.addEventListener("click", async () => {
    const chosenCards = setBoard(cardCountInput.value);
    const withImages = await Promise.all(
      chosenCards.map(async (p) => {
        const data = await apiGetPokemon(p.name);
        return {
          name: data.name,
          image: data.sprites.front_default,
        };
      }),
    );
    const deck = [...withImages, ...withImages].sort(() => Math.random() - 0.5);
    boardEl.innerHTML = "";
    for (const pokemon of deck) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-card";
      btn.dataset.name = pokemon.name;
      btn.innerHTML = `
        <div class="memory-card-inner">
     
      
            <img src="${pokemon.image}" alt="${pokemon.name}" />
          
        </div>
      `;
      boardEl.appendChild(btn);
    }
  });
}
