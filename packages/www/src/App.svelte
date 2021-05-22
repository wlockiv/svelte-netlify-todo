<script>
  import "carbon-components-svelte/css/g90";
  import { setClient } from "svelte-apollo";
  import { Route, Router } from "svelte-routing";
  import Header from "./components/Header.svelte";
  import Home from "./routes/Home.svelte";
  import Tasks from "./routes/Tasks.svelte";
  import User from "./routes/User.svelte";
  import { client } from "./services/api";
  import { initializeIdentity } from "./services/identity";
  import { user } from "./store";

  setClient(client);

  $: $user,
    (client.headers = {
      Authorization: $user ? `Bearer ${$user.accessToken}` : "",
    });

  initializeIdentity();
</script>

<svelte:head>
  <title>Netlify/Svelte Todo App</title>
</svelte:head>

<Router>
  <Header />
  <main>
    <Route path="/"><Home /></Route>
    <Route path="/profile"><User /></Route>
    <Route path="/tasks"><Tasks /></Route>
  </main>
</Router>

<style lang="scss" global>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1em;
    margin: 64px auto 0 auto;
  }

  :global(h1) {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: 720px;
    }
  }
</style>
