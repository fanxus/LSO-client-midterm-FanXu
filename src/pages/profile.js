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
      </div>

      <ul id="pokemon-list" class="pokemon-list"></ul>

      <div id="favorite-preview" class="favorite-preview" hidden>
        <img id="favorite-img" alt="" />
        <p id="favorite-name"></p>
      </div>

      <p id="profile-error" class="profile-error" role="alert"></p>

      <button type="button" class="btn" id="create-profile">
        Create Profile
      </button>
    </div>
  `;

  const searchInput = container.querySelector("#search");
  const listEl = container.querySelector("#pokemon-list");
  const preview = container.querySelector("#favorite-preview");
  const favoriteImg = container.querySelector("#favorite-img");
  const favoriteName = container.querySelector("#favorite-name");
  const createBtn = container.querySelector("#create-profile");
  const usernameInput = container.querySelector("#username");
  const usernameErrorEl = container.querySelector("#username-error");
  const errorEl = container.querySelector("#profile-error");

  let allPokemon = [];
  let selected = null;

  function setUsernameError(message) {
    usernameErrorEl.textContent = message ?? "";
  }

  function setError(message) {
    errorEl.textContent = message ?? "";
  }

  function clearErrors() {
    setUsernameError("");
    setError("");
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
    setError("");
  }

  try {
    allPokemon = await apiGetPokemonList();
  } catch {
    setError("Could not load Pokémon list. Check your connection and reload.");
    searchInput.disabled = true;
    return;
  }

  usernameInput.addEventListener("input", () => {
    setUsernameError("");
  });

  searchInput.addEventListener("input", () => {
    const val = normalizeSearch(searchInput.value);
    listEl.innerHTML = "";
    if (!val) return;

    const matches = allPokemon
      .filter((p) => p.name.startsWith(val))
      .slice(0, MAX_SUGGESTIONS);

    for (const p of matches) {
      const li = document.createElement("li");
      li.textContent = p.name;
      li.tabIndex = 0;
      li.addEventListener("click", async () => {
        try {
          setError("");
          const pokemon = await apiGetPokemon(p.name);
          selectFavorite(pokemon);
        } catch {
          setError("Could not load that Pokémon. Try another one.");
        }
      });
      listEl.appendChild(li);
    }
  });

  createBtn.addEventListener("click", () => {
    clearErrors();
    const username = usernameInput.value.trim();
    const usernameError = validateUsername(username);
    if (usernameError) {
      setUsernameError(usernameError);
      return;
    }
    if (!selected) {
      setError("Select a favorite Pokémon.");
      return;
    }
    if (!selected.image) {
      setError("That Pokémon has no image. Pick another one.");
      return;
    }

    saveSession({
      username,
      id: selected.id,
      name: selected.name,
      image: selected.image,
    });
    onProfileCreated();
  });
}
