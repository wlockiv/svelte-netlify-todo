<script>
  import {
    Header,
    HeaderUtilities,
    HeaderGlobalAction,
  } from "carbon-components-svelte";
  import UserAvatar20 from "carbon-icons-svelte/lib/UserAvatar20";
  import ListChecked20 from "carbon-icons-svelte/lib/ListChecked20";
  import { navigate } from "svelte-routing";
</script>

<Header
  company="Sveltify"
  platformName="Todo App"
  style="cursor:pointer;"
  on:click={() => navigate("/")}
>
  <HeaderUtilities>
    <HeaderGlobalAction
      aria-label="User Avatar"
      icon={ListChecked20}
      on:click={() => navigate("/tasks")}
    />
    <HeaderGlobalAction
      aria-label="User Avatar"
      icon={UserAvatar20}
      on:click={() => navigate("/profile")}
    />
  </HeaderUtilities>
</Header>
