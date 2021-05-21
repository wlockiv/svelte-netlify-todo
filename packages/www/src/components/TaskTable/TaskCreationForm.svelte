<script>
  import { mutation } from "svelte-apollo";
  import { createEventDispatcher } from "svelte";
  import { CREATE_TODO } from "./queries";

  const formState = {
    initial: true,
    input: "",
  };

  let submitPromise;

  const dispatch = createEventDispatcher();
  const createTodo = mutation(CREATE_TODO);

  async function handleCreateTodo() {
    formState.initial = false;

    if (!formState.input) {
      emptyError = true;
      return;
    }

    try {
      await createTodo({
        variables: { text: formState.input },
      });
      formState.input = null;
      dispatch("refetchtodos");
    } catch (error) {
      console.log(error);
    }
  }

  function handleSubmit() {
    submitPromise = handleCreateTodo();
  }
</script>

<div class="form-container">
  <form action="submit" on:submit|preventDefault={handleSubmit}>
    <input
      type="text"
      bind:value={formState.input}
      placeholder="Type a task then click 'Add'."
    />
    {#await submitPromise}
      <button type="submit" disabled="true">...</button>
    {:then}
      <button type="submit">Add</button>
    {:catch error}
      <button type="submit">Add</button>
    {/await}
  </form>
  {#if !formState.input && !formState.initial}
    <sub style="margin-top: 0">Add text before submitting</sub>
  {/if}
</div>

<style>
  .form-container {
    border-radius: 4px;
    border: solid 1px #ccc;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
  }

  form {
    display: flex;
    gap: 8px;
  }

  sub {
    padding-left: 4px;
    color: #cccccc80;
    border-left: solid 1px #cccccc80;
    text-align: left;
    margin: 0;
  }

  input {
    margin: 0;
    background-color: transparent;
    min-width: unset;
    flex-grow: 1;
    flex-shrink: 1;
  }

  button {
    margin: 0;
  }
</style>
