<script>
  import "carbon-components-svelte/css/g90";
  import { setClient } from "svelte-apollo";
  import { navigate, Route, Router } from "svelte-routing";
  import Header from "./components/Header.svelte";
  import Home from "./routes/Home.svelte";
  import ProtectedRoute from "./routes/ProtectedRoute.svelte";
  import Tasks from "./routes/Tasks.svelte";
  import User from "./routes/User.svelte";
  import { client } from "./services/api";
  import { user } from "./store";
  import {
    Grid,
    Row,
    Column,
    Link,
  } from "carbon-components-svelte";
  import Heart from "carbon-icons-svelte/lib/FavoriteFilled16";
  import { confirmEmail } from "./services/identity";

  setClient(client);

  if (window.location.hash.includes("confirmation_token")) {
    const token = window.location.hash.slice(20);
    confirmEmail(token, () => navigate("/tasks"));
  }

  $: $user,
    (client.headers = {
      Authorization: $user ? `Bearer ${$user.accessToken}` : "",
    });
</script>

<svelte:head>
  <title>Netlify/Svelte Todo App</title>
</svelte:head>

<Router>
  <Header />
  <main id="app-main">
    <div style="height:80px" />
    <Route path="/"><Home /></Route>
    <ProtectedRoute path="/profile"><User /></ProtectedRoute>
    <ProtectedRoute path="/tasks"><Tasks /></ProtectedRoute>
  </main>
  <footer class="bx--content" style="margin-top:0;">
    <Grid>
      <Row>
        <Column>
          Made with <Heart style="height:1em;" /> by
          <Link href="https://github.com/wlockiv" target="_blank">Walker</Link>.
        </Column>
      </Row>
    </Grid>
  </footer>
</Router>

