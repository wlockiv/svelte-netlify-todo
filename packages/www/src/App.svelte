<script>
  export let name;

  let user = null;

  let loginInput = {};

  import netlifyIdentity from "netlify-identity-widget";

  netlifyIdentity.init();

  $: isLoggedIn = !!user;
  $: username = user !== null ? $user.name : " there!";

  const handleUserAction = (action) => {
    if (action === "login" || action === "signup") {
      netlifyIdentity.open(action);
      netlifyIdentity.open("login", (u) => {
        user = u;
        netlifyIdentity.close();
      });
    } else if (action === "logout") {
      user = null;
      netlifyIdentity.logout();
    }
  };
</script>

<main>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn
    how to build Svelte apps.
  </p>
  <p>{user}</p>

  <button on:click={() => handleUserAction("login")}>Login</button>
  <button on:click={() => handleUserAction("logout")}>Logout</button>

  <!-- <form action="submit">
    <div class="input-group">
      <label for="email" />
      <input type="email" bind:value={loginInput.email} />
    </div>
	<div class="input-group">
		<label for="password" />
		<input type="email" bind:value={loginInput.email} />
	  </div>
  </form> -->
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
