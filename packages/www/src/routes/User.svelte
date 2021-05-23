<script>
  import { ClickableTile, Tile } from "carbon-components-svelte";
  import { getClient } from "svelte-apollo";
  import { navigate } from "svelte-routing";
  import { logout } from "../services/identity";
  import { user } from "../store";

  const client = getClient();

  function handleLogout() {
    logout(() => {
      client.clearStore();
      navigate("/");
    });
  }
</script>

<h1>User Profile</h1>
<hr />
<h2>Details</h2>
<Tile style="margin-top:8px">
  <h3>Name</h3>
  <p>{$user.name}</p>
</Tile>
<Tile style="margin-top:8px">
  <h3>Email</h3>
  <p>{$user.email}</p>
</Tile>
<hr />
<h2>Settings</h2>
<ClickableTile style="margin-top:8px" on:click={handleLogout}>
  <h3>Ready to go?</h3>
  <p>Logout</p>
</ClickableTile>

<style>
  h1 {
    text-align: left;
  }

  h3 {
    text-align: left;
    font-size: 1em;
    margin-bottom: 4px;
  }
</style>
