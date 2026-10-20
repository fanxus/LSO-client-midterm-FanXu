const baseUrl = "https://pokeapi.co/api/v2/pokemon/";

export async function apiGetPokemon(url, pokemonName) {
  const response = await fetch(`${url}${pokemonName}`);
  const data = await response.json();
  return data;
}

const data = await apiGetPokemon(baseUrl, "charizard");
console.log(data);
