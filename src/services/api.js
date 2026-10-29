const BASE_URL = "https://pokeapi.co/api/v2/pokemon";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export async function apiGetPokemon(pokemonName) {
  return fetchJson(`${BASE_URL}/${encodeURIComponent(pokemonName)}`);
}

export async function apiGetPokemonList() {
  const meta = await fetchJson(`${BASE_URL}?limit=1`);
  const data = await fetchJson(`${BASE_URL}?limit=${meta.count}`);
  return data.results;
}
