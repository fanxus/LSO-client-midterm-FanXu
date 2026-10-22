import { apiGetPokemonList, apiGetPokemon } from "../services/api.js";

export async function renderProfile(container) {
  container.innerHTML = `
<div class="profile-page">
  <h1>Profile</h1>
  <label> Username: <input type="text" id="username" placeholder="Username"></label>
  <label> Search Pokemon: <input type="search" id="search" placeholder="Search Pokemon"></label>
  <ul id="pokemon-list"></ul>
  <p id="profile-error"></p>
  <button type="button" id="create-profile" disabled>Create Profile</button>
</div>
`;

  let allPokemon = [];
  allPokemon = await apiGetPokemonList();
  let selected = null;

  const searchInput = container.querySelector("#search");
  const listEl = container.querySelector("#pokemon-list");

  searchInput.addEventListener("input", () => {
    const val = searchInput.value.trim(" ").toLowerCase().replace(/ /g, "-");
    listEl.innerHTML = "";
    if (!val) return;
    const matches = allPokemon
      .filter((p) => p.name.startsWith(val))
      .slice(0, 8);
    for (const p of matches) {
      const li = document.createElement("li");
      li.textContent = p.name;
      listEl.appendChild(li);
    }
  });
}
