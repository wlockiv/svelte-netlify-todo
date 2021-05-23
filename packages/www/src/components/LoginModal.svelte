<script>
  import { Modal, TextInput } from "carbon-components-svelte";
  import { navigate } from "svelte-routing";
  import { login } from "../services/identity";

  export let open = true;
  export let formMode = "login";
  let loading = false;
  let formInput = {
    name: "",
    email: "",
    password: "",
  };
  let submitError = "";

  function teardown() {
    open = false;
    loading = false;
    formInput = { name: "", email: "", password: "" };
  }

  async function handleLogin() {
    loading = true;
    submitError = "";
    try {
      await login(formInput, () => navigate("/tasks"));
      teardown();
    } catch (error) {
      if (error.message.includes("invalid_grant")) {
        submitError =
          "That username/password combination does not exist. Try again.";
      } else {
        console.log(error);
      }
      loading = false;
    }
  }

  function toggleFormMode() {
    if (formMode === "login") {
      formMode = "signup";
    } else {
      formMode = "login";
    }
    submitError = "";
  }
</script>

<Modal
  size="xs"
  bind:open
  modalHeading={formMode === "login" ? "Login" : "Sign up"}
  primaryButtonText="Login"
  primaryButtonDisabled={loading}
  secondaryButtonText={formMode === "login" ? "Sign up" : "Login"}
  hasForm={true}
  on:submit={handleLogin}
  on:click:button--secondary={toggleFormMode}
  on:open
  on:close
  on:submit
>
  {#if formMode === "signup"}
    <br />
    <TextInput
      labelText="Name"
      placeholder="Leroy Jenkins"
      type="text"
      bind:value={formInput.name}
    />
  {/if}
  <br />
  <TextInput
    labelText="Email address"
    placeholder="you@domain.com"
    type="email"
    bind:value={formInput.email}
  />
  <br />
  <TextInput
    labelText="Password"
    type="password"
    placeholder="much secure. very cyber. wow."
    bind:value={formInput.password}
  />
  <br />
  {#if submitError}
    <p style="color:#FF3E00">{submitError}</p>
  {/if}
</Modal>
