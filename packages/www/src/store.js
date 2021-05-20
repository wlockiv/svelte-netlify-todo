import { writable } from "svelte/store";

function _makeUser(netlifyUser) {
  const { user_metadata, email, token } = netlifyUser;

  return {
    name: user_metadata.full_name,
    email,
    accessToken: token.access_token,
    expiresAt: token.expires_at,
    refreshToken: token.refresh_token,
    tokeType: token.tokenType,
  };
}

function createUser() {
  const localUser = JSON.parse(localStorage.getItem("gotrue.user"));

  const { subscribe, set } = writable(localUser ? _makeUser(localUser) : null);

  return {
    subscribe,
    login(user) {
      set(_makeUser(user));
    },
    logout() {
      set(null);
    },
  };
}

export const user = createUser();
