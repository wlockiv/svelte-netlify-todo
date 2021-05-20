<script>
  import { handleLogin, handleLogout } from "../services/identity";
  import { user } from "../store";
  import { link } from "svelte-routing";

  $: isLoggedIn = Boolean($user);
</script>

<nav>
  <!-- Right Nav -->
  <div class="nav-item">
    <a href="/" use:link>Home</a>
  </div>
  {#if isLoggedIn}
    <div class="nav-item">
      <a href="/tasks" use:link>Tasks</a>
    </div>
  {/if}
  <div class="flex-spacer" />
  <!-- Left Nav -->
  {#if isLoggedIn}
    <div class="nav-item" style="">
      <a href="/profile" use:link>{$user.name.split(" ")[0]}</a>
    </div>
    <div class="nav-item">
      <a href="/" on:click={handleLogout}>Logout</a>
    </div>
  {:else}
    <div class="nav-item">
      <div on:click={handleLogin}>Login</div>
    </div>
  {/if}
</nav>

<style>
  nav {
    margin-left: auto;
    list-style: none;
    display: flex;
    gap: 8px;
    padding: 0 8px;
  }

  .flex-spacer {
    flex-grow: 1;
  }

  .nav-item {
    margin: 0;
    border: solid 1px #ccc;
    border-radius: 4px;
    padding: 0.4em;
    background-color: transparent;
    color: #ccc;
  }

  .nav-item:hover {
    cursor: pointer;
    text-decoration: underline;
  }

  a {
    color: #ccc;
  }
</style>
