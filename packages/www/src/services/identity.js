import netlifyIdentity from "netlify-identity-widget";
import { navigate } from "svelte-routing";
import { user } from "../store";

export function initializeIdentity(logoutCleanupCb) {
  netlifyIdentity.init();

  // Netlify identity event hooks
  netlifyIdentity.on("login", (_user) => {
    user.login(_user);
    netlifyIdentity.close();
    navigate("/tasks");
  });

  netlifyIdentity.on("logout", () => {
    navigate("/");
    user.logout();
    logoutCleanupCb();
  });
}

export function handleLogin() {
  netlifyIdentity.open("login");
}

export function handleLogout() {
  netlifyIdentity.logout();
}
