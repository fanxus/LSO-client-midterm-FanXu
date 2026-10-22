const BASE_URL = "https://pokeapi.co/api/v2/pokemon";

export async function apiGetPokemon(pokemonName) {
  const response = await fetch(
    `${BASE_URL}/${encodeURIComponent(pokemonName)}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch pokemon");
  }
  return await response.json();
}

export async function apiGetPokemonList() {
  const first = await fetch(`${BASE_URL}?limit=1`);
  const meta = await first.json();
  const total = meta.count;

  const response = await fetch(`${BASE_URL}?limit=${total}`);
  if (!response.ok) throw new Error("Failed to fetch list");
  const data = await response.json();
  return data.results;
}
