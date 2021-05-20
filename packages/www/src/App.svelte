<script>
  import { initializeIdentity, handleLogin, handleLogout } from "./identity";
  import Navbar from "./components/Navbar.svelte";
  import { Router, Route } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import User from "./routes/User.svelte";

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
    <Route path="/user"><User /></Route>
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
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
