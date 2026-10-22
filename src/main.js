import "./style.css";
import { renderProfile } from "./pages/profile.js";
import { renderGame } from "./pages/game.js";

const app = document.querySelector("#app");
renderGame(app);
// renderProfile(app);
