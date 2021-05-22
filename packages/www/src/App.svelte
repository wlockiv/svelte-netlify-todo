<script>
  import "carbon-components-svelte/css/g90";
  import { setClient } from "svelte-apollo";
  import { Route, Router } from "svelte-routing";
  import Header from "./components/Header.svelte";
  import Home from "./routes/Home.svelte";
  import ProtectedRoute from "./routes/ProtectedRoute.svelte";
  import Tasks from "./routes/Tasks.svelte";
  import User from "./routes/User.svelte";
  import { client } from "./services/api";
  import { initializeIdentity } from "./services/identity";
  import { user } from "./store";
  import { Grid, Row, Column, Icon, Link } from "carbon-components-svelte";
  import Heart from "carbon-icons-svelte/lib/FavoriteFilled16";

  setClient(client);
  initializeIdentity(() => {
    client.clearStore();
  });

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
  <main>
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
    <!--  -->
  </footer>
</Router>

<style lang="scss" global>
  html,
  body {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
    margin: 0;
  }

  header {
    flex: 0 1 47px;
  }

  main {
    flex: 1 1 auto;
    display: flex !important;
    flex-direction: column;
    width: 90%;
    // align-items: center;
    // margin: 0 auto;
  }

  hr {
    width: 100%;
  }

  footer {
    flex: 0 1 auto;
    width: 100%;
  }

  :global(h1) {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  footer {
    margin-top: 20px !important;
    background-color: #161616 !important;
  }

  @media (min-width: 640px) {
    main {
      max-width: 720px;
    }
  }
</style>
