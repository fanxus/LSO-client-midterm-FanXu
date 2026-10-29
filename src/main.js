import "./style.css";
import { getSession } from "./services/session.js";
import { renderProfile } from "./pages/profile.js";
import { renderGame } from "./pages/game.js";

const app = document.querySelector("#app");

function showGame(session) {
  renderGame(app, {
    session,
    onLogout: showProfile,
  });
}

function showProfile() {
  renderProfile(app, {
    onProfileCreated: showGame,
  });
}

function startApp() {
  const session = getSession();
  if (session) {
    showGame(session);
  } else {
    showProfile();
  }
}

startApp();
