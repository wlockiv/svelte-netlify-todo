<script>
  import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";
  import { setContext as apolloSetContext } from "@apollo/client/link/context";
  import { setClient } from "svelte-apollo";
  import { Route, Router } from "svelte-routing";
  import Navbar from "./components/Navbar.svelte";
  import Home from "./routes/Home.svelte";
  import Tasks from "./routes/Tasks.svelte";
  import User from "./routes/User.svelte";
  import { initializeIdentity } from "./services/identity";
  import { user } from "./store";
  import { client } from "./services/api";

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
  <header>
    <Navbar />
  </header>
  <main>
    <Route path="/"><Home /></Route>
    <Route path="/profile"><User /></Route>
    <Route path="/tasks"><Tasks /></Route>
  </main>
</Router>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  :global(h1) {
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
