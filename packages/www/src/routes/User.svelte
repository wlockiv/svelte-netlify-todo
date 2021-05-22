<script>
  import { Tile } from "carbon-components-svelte";
  import { user } from "../store";
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
