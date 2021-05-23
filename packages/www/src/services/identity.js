import GoTrue from "gotrue-js";
import { user } from "../store";

const auth = new GoTrue({
  APIUrl: "https://svelte-netlify-todo.netlify.app/.netlify/identity",
});

export async function login({ email, password }, cb) {
  try {
    const response = await auth.login(email, password, true);
    user.login(response);
    cb();
  } catch (error) {
    throw error;
  }
}

export async function logout(cb) {
  const _user = auth.currentUser();
  await _user.logout();
  cb();
  user.logout();
}

export async function signup(cb) {}
