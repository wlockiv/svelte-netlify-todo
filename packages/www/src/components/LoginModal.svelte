<script>
  import { Modal, TextInput } from "carbon-components-svelte";
  import { navigate } from "svelte-routing";
  import { login, signup } from "../services/identity";

  export let open = true;
  export let formMode = "login";
  let signupSuccess;

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
    signupSuccess = false;
  }

  function reset() {
    loading = false;
  }

  function parseError({ message }) {
    if (message.includes("invalid_grant")) {
      return "That username/password combination doesn't exist. Try again.";
    } else if (message.includes("A user with this email")) {
      return "A user with this email address has already been registerd.";
    } else {
      console.log(message);
      return "An unknown error occurred. Check your internet connection and try again.";
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    loading = true;
    submitError = "";
    try {
      await login(formInput, () => navigate("/tasks"));
      teardown();
    } catch (error) {
      submitError = parseError(error);
      reset();
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    loading = true;
    submitError = "";
    try {
      await signup(formInput);
      signupSuccess = true;
      setTimeout(() => {
        teardown();
      }, 3000);
    } catch (error) {
      submitError = parseError(error);
      reset();
    }
  }

  function toggleFormMode() {
    if (formMode === "login") {
      formMode = "signup";
    } else {
      formMode = "login";
    }
    submitError = "";
    reset();
  }
</script>

<Modal
  size="xs"
  bind:open
  modalHeading={formMode === "login" ? "Login" : "Sign up"}
  primaryButtonText={formMode === "login" ? "Login" : "Sign up"}
  primaryButtonDisabled={loading}
  secondaryButtonText={formMode === "login" ? "Sign up" : "Login"}
  hasForm={true}
  on:submit={formMode === "login" ? handleLogin : handleSignup}
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
  {#if signupSuccess}
    <p>Confirmation sent! Check your email inbox for a verification link.</p>
  {/if}
</Modal>
