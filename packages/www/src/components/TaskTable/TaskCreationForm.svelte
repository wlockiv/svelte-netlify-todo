<script>
  import gql from "graphql-tag";
  import { mutation } from "svelte-apollo";
  import { createEventDispatcher } from "svelte";
  import { CREATE_TODO } from "./queries";

  let createTodoInput;

  const dispatch = createEventDispatcher();

  const createTodo = mutation(CREATE_TODO);

  async function handleCreateTodo() {
    try {
      await createTodo({
        variables: { text: createTodoInput },
      });
      createTodoInput = null;
      dispatch("refetchtodos");
    } catch (error) {
      console.log(error);
    }
  }
</script>

<form action="submit" on:submit|preventDefault={handleCreateTodo}>
  <input
    type="text"
    bind:value={createTodoInput}
    placeholder="Type a task then click 'Add'."
  />
  <button type="submit">Add</button>
</form>

<style>
  form {
    border-radius: 4px;
    border: solid 1px #ccc;
    display: flex;
    gap: 12px;
    padding: 8px;
  }

  input {
    margin: 0;
    background-color: transparent;
    flex-grow: 1;
  }

  button {
    margin: 0;
  }
</style>
