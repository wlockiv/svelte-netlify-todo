<script>
  import gql from "graphql-tag";
  import { mutation } from "svelte-apollo";
  import { UPDATE_TODO } from "./queries";

  export let id, text, done;

  let promise;

  const updateTodo = mutation(UPDATE_TODO);

  async function toggleDone() {
    try {
      await updateTodo({
        variables: { id, text, done: !done },
      });
    } catch (error) {
      console.log(error);
    }
  }

  function handleClick() {
    promise = toggleDone();
  }
</script>

<div class="task-row" class:done>
  <div class="task-name">{text}</div>
  <div class="task-complete">
    {#await promise}
      Loading...
    {:then value}
      <button on:click={handleClick}>
        {#if done}
          Done
        {:else}
          Not Done
        {/if}
      </button>
    {:catch error}
      <p>Error!</p>
    {/await}
  </div>
</div>

<style>
  .task-row {
    display: flex;
    gap: 12px;
    padding: 8px;
    border: solid 1px #ccc;
    border-radius: 4px;
  }

  .task-row.done {
    border: solid 1px #ccc7;
    color: #ccc7;
  }

  .task-row.done button {
    color: #ccc7;
  }

  .task-name {
    text-align: left;
    flex-grow: 1;
  }

  .task-complete button {
    margin: 0;
    padding: 0;
    border: unset;
  }

  button {
    margin: 0;
  }
</style>
