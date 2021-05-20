import netlifyIdentity from "netlify-identity-widget";
import { user } from "./store";

export function initializeIdentity() {
  netlifyIdentity.init();

  // Netlify identity event hooks
  netlifyIdentity.on("login", (_user) => {
    user.login(_user);
    netlifyIdentity.close();
  });

  netlifyIdentity.on("logout", () => {
    user.logout();
  });
}

export function handleLogin() {
  netlifyIdentity.open("login");
}

export function handleLogout() {
  netlifyIdentity.logout();
}
