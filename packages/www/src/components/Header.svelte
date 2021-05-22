<script>
  import {
    Header,
    HeaderUtilities,
    HeaderGlobalAction,
    Button,
  } from "carbon-components-svelte";
  import UserAvatar20 from "carbon-icons-svelte/lib/UserAvatar20";
  import ListChecked20 from "carbon-icons-svelte/lib/ListChecked20";
  import { navigate } from "svelte-routing";
  import { user } from "../store";
  // import { handleLogin } from "../services/identity";
  import netlifyIdentity from "netlify-identity-widget";

  function handleLogin() {
    netlifyIdentity.open("login");
  }
</script>

<Header
  company="Sveltify"
  platformName="Todo App"
  style="cursor:pointer;"
  on:click={() => navigate("/")}
>
  <HeaderUtilities>
    {#if !!$user}
      <HeaderGlobalAction
        aria-label="User Avatar"
        icon={ListChecked20}
        on:click={() => navigate("/tasks")}
      />
      <HeaderGlobalAction
        aria-label="Todo List"
        icon={UserAvatar20}
        on:click={() => navigate("/profile")}
      />
    {:else}
      <Button on:click={handleLogin}>Login</Button>
    {/if}
  </HeaderUtilities>
</Header>
<div style="height:64px" />
