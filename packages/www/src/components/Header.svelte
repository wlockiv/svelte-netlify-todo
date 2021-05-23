<script>
  import {
    Button,
    Header,
    HeaderAction,
    HeaderGlobalAction,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderUtilities,
  } from "carbon-components-svelte";
  import ListChecked16 from "carbon-icons-svelte/lib/ListChecked20";
  import UserAvatar16 from "carbon-icons-svelte/lib/UserAvatar20";
  import { navigate } from "svelte-routing";
  import { user } from "../store";
  import LoginModal from "./LoginModal.svelte";

  let loginOpen = false;
  let isOpen = false;
</script>

<Header
  company="Sveltify"
  platformName="Todo App"
  style="cursor:pointer;"
  on:click={() => navigate("/")}
>
  <HeaderUtilities>
    {#if !!$user}
      <!-- <HeaderAction bind:isOpen>
        <HeaderPanelLinks>
          <HeaderPanelLink on:click={() => navigate("/tasks")}>
            Your Todo List
          </HeaderPanelLink>
          <HeaderPanelLink on:click={() => navigate("/profile")}>
            User Profile
          </HeaderPanelLink>
        </HeaderPanelLinks>
      </HeaderAction> -->

      <HeaderGlobalAction
        aria-label="User Avatar"
        icon={ListChecked16}
        on:click={() => navigate("/tasks")}
      />
      <HeaderGlobalAction
        aria-label="Todo List"
        icon={UserAvatar16}
        on:click={() => navigate("/profile")}
      />
    {:else}
      <Button on:click={() => (loginOpen = true)}>Login</Button>
    {/if}
  </HeaderUtilities>
</Header>
<LoginModal bind:open={loginOpen} />
