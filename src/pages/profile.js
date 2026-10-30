import { apiGetPokemonList, apiGetPokemon } from "../services/api.js";
import { saveSession } from "../services/session.js";

const USERNAME_MIN = 3;
const USERNAME_MAX = 15;
const MAX_SUGGESTIONS = 8;

function normalizeSearch(value) {
  return value.trim().toLowerCase().replace(/ /g, "-").replace(/\./g, "-");
}

function validateUsername(username) {
  if (!username) {
    return "Username is required.";
  }
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters.`;
  }
  return null;
}

function validateFavorite(selected) {
  if (!selected) {
    return "Select a favorite Pokémon.";
  }
  if (!selected.image) {
    return "That Pokémon has no image. Pick another one.";
  }
  return null;
}

export async function renderProfile(container, { onProfileCreated }) {
  container.innerHTML = `
    <div class="profile-page">
      <h1>PokeMemory</h1>
      <p class="profile-subtitle">Create your player profile</p>

      <div class="profile-field">
        <label for="username">Username</label>
        <input
          type="text"
          id="username"
          placeholder="3–15 characters"
          maxlength="${USERNAME_MAX}"
          autocomplete="username"
        />
        <p id="username-error" class="field-error" role="alert"></p>
      </div>

      <div class="profile-field">
        <label for="search">Search Pokémon</label>
        <input
          type="search"
          id="search"
          placeholder="Type a name…"
          autocomplete="off"
        />
        <p id="pokemon-error" class="field-error" role="alert"></p>
      </div>

      <ul id="pokemon-list" class="pokemon-list"></ul>

      <div id="favorite-preview" class="favorite-preview" hidden>
        <img id="favorite-img" alt="" />
        <p id="favorite-name"></p>
        <button
          type="button"
          class="icon-btn"
          id="clear-favorite"
          aria-label="Remove favorite Pokémon"
          title="Remove"
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
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>

      <button type="button" class="btn" id="create-profile">
        Create Profile
      </button>
    </div>
  `;

  const usernameInput = container.querySelector("#username");
  const usernameErrorEl = container.querySelector("#username-error");
  const searchInput = container.querySelector("#search");
  const pokemonErrorEl = container.querySelector("#pokemon-error");
  const listEl = container.querySelector("#pokemon-list");
  const preview = container.querySelector("#favorite-preview");
  const favoriteImg = container.querySelector("#favorite-img");
  const favoriteName = container.querySelector("#favorite-name");
  const clearFavoriteBtn = container.querySelector("#clear-favorite");
  const createBtn = container.querySelector("#create-profile");

  let allPokemon = [];
  let selected = null;

  function setUsernameError(message) {
    usernameErrorEl.textContent = message ?? "";
  }

  function setPokemonError(message) {
    pokemonErrorEl.textContent = message ?? "";
  }

  function clearErrors() {
    setUsernameError("");
    setPokemonError("");
  }

  function selectFavorite(pokemon) {
    selected = {
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.sprites.front_default ?? "",
    };
    favoriteImg.src = selected.image;
    favoriteImg.alt = selected.name;
    favoriteName.textContent = selected.name;
    preview.hidden = false;
    listEl.innerHTML = "";
    searchInput.value = selected.name;
    setPokemonError("");
  }

  function clearFavorite() {
    selected = null;
    favoriteImg.src = "";
    favoriteImg.alt = "";
    favoriteName.textContent = "";
    preview.hidden = true;
    searchInput.value = "";
    listEl.innerHTML = "";
    setPokemonError("");
    searchInput.focus();
  }

  function renderSuggestions(query) {
    listEl.innerHTML = "";
    if (!query) return;

    const matches = allPokemon
      .filter((pokemon) => pokemon.name.startsWith(query))
      .slice(0, MAX_SUGGESTIONS);

    for (const match of matches) {
      const li = document.createElement("li");
      li.textContent = match.name;
      li.tabIndex = 0;
      li.addEventListener("click", () => {
        void choosePokemon(match.name);
      });
      listEl.appendChild(li);
    }
  }

  async function choosePokemon(name) {
    try {
      setPokemonError("");
      const pokemon = await apiGetPokemon(name);
      selectFavorite(pokemon);
    } catch {
      setPokemonError("Could not load that Pokémon. Try another one.");
    }
  }

  try {
    allPokemon = await apiGetPokemonList();
  } catch {
    setPokemonError(
      "Could not load Pokémon list. Check your connection and reload.",
    );
    searchInput.disabled = true;
    createBtn.disabled = true;
    return;
  }

  usernameInput.addEventListener("input", () => {
    setUsernameError("");
  });

  searchInput.addEventListener("input", () => {
    setPokemonError("");
    renderSuggestions(normalizeSearch(searchInput.value));
  });

  clearFavoriteBtn.addEventListener("click", () => {
    clearFavorite();
  });

  createBtn.addEventListener("click", () => {
    clearErrors();

    const username = usernameInput.value.trim();
    const usernameError = validateUsername(username);
    if (usernameError) {
      setUsernameError(usernameError);
      return;
    }

    const favoriteError = validateFavorite(selected);
    if (favoriteError) {
      setPokemonError(favoriteError);
      return;
    }

    saveSession({
      username,
      id: selected.id,
      name: selected.name,
      image: selected.image,
    });
    onProfileCreated(getCreatedSession(username, selected));
  });
}

function getCreatedSession(username, selected) {
  return {
    username,
    id: selected.id,
    name: selected.name,
    image: selected.image,
  };
}
