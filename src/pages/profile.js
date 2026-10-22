import { apiGetPokemonList, apiGetPokemon } from "../services/api.js";

export async function renderProfile(container) {
  container.innerHTML = `
<div class="profile-page">
  <h1>Profile</h1>
  <label> Username: <input type="text" id="username" placeholder="Username"></label>
  <label> Search Pokemon: <input type="search" id="search" placeholder="Search Pokemon"></label>
  <ul id="pokemon-list"></ul>
  <div id="favorite-preview" hidden>
  <img id="favorite-img" alt="" />
  <p id="favorite-name"></p>
</div>
  <p id="profile-error"></p>
  <button type="button" id="create-profile" disabled>Create Profile</button>
</div>
`;

  let allPokemon = [];
  allPokemon = await apiGetPokemonList();
  let selected = null;

  const searchInput = container.querySelector("#search");
  const listEl = container.querySelector("#pokemon-list");
  const preview = container.querySelector("#favorite-preview");
  const favoriteImg = container.querySelector("#favorite-img");
  const favoriteName = container.querySelector("#favorite-name");
  const createBtn = container.querySelector("#create-profile");
  const usernameInput = container.querySelector("#username");
  const errorEl = container.querySelector("#profile-error");
  searchInput.addEventListener("input", () => {
    const val = searchInput.value
      .trim()
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/\./g, "-");
    listEl.innerHTML = "";
    if (!val) return;
    const matches = allPokemon
      .filter((p) => p.name.startsWith(val))
      .slice(0, 8);
    for (const p of matches) {
      const li = document.createElement("li");
      li.textContent = p.name;
      li.addEventListener("click", async () => {
        const pokemon = await apiGetPokemon(p.name);
        selected = {
          name: p.name,
          image: pokemon.sprites.front_default,
        };
        favoriteImg.src = selected.image;
        favoriteImg.alt = selected.name;
        favoriteName.textContent = selected.name;
        preview.hidden = false;
        createBtn.disabled = usernameInput.value.trim().length < 3;
      });
      listEl.appendChild(li);
    }
  });
}
