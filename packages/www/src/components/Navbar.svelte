<script>
  import { handleLogin, handleLogout } from "../identity";
  import { user } from "../store";
  import { Link, link } from "svelte-routing";

  $: isLoggedIn = !$user;
</script>

<nav>
  <ul>
    <li class="nav-item">
      <a class="nav-link" href="/" use:link>Home</a>
    </li>
    {#if isLoggedIn}
      <li class="nav-item" style="margin-left: auto;">
        <button on:click={handleLogin}>Login</button>
      </li>
    {:else}
      <li class="nav-item" style="margin-left: auto;">
        <a class="nav-link" href="/user" use:link>{$user.name}</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="/">Logout</a>
      </li>
    {/if}
  </ul>
</nav>

<style>
  .nav-item {
    margin-left: 4px;
  }

  .nav-item > button {
    margin: 0;
    background-color: transparent;
    color: #ccc;
  }

  .nav-item .nav-link {
    margin: 0;
    border: solid 1px #ccc;
    border-radius: 4px;
    padding: 0.4em;
    background-color: transparent;
    color: #ccc;
  }

  ul {
    margin-left: auto;
    list-style: none;
    display: flex;
    padding: 0 8px;
  }
</style>
