<script>
  import {
    Button,
    Header,
    HeaderGlobalAction,
    HeaderUtilities,
  } from "carbon-components-svelte";
  import ListChecked20 from "carbon-icons-svelte/lib/ListChecked20";
  import UserAvatar20 from "carbon-icons-svelte/lib/UserAvatar20";
  import { navigate } from "svelte-routing";
  import { user } from "../store";
  import LoginModal from "./LoginModal.svelte";

  let loginOpen = false;
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
      <Button on:click={() => (loginOpen = true)}>Login</Button>
    {/if}
  </HeaderUtilities>
</Header>
<LoginModal bind:open={loginOpen} />
