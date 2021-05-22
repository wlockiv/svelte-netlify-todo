<script>
  import { Route } from "svelte-routing";
  import { user } from "../store";
  import AccessDenied from "./AccessDenied.svelte";

  export let path;
  export let component = null;
</script>

{#if !!$user}
  <Route {path} {component}>
    <slot />
  </Route>
{:else}
  <Route {path}>
    <AccessDenied />
  </Route>
{/if}
