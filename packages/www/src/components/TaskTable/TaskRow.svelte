<script>
  import {
    Button,
    InlineLoading,
    OverflowMenu,
    OverflowMenuItem,
    Tile,
  } from "carbon-components-svelte";
  import { createEventDispatcher } from "svelte";
  import { mutation } from "svelte-apollo";
  import { DELETE_TODO, UPDATE_TODO } from "../../queries";

  export let task;
  export let light = false;
  $: ({ id, text, done } = task);

  let toggling;
  let deleting;

  const updateTodo = mutation(UPDATE_TODO);
  const deleteTodo = mutation(DELETE_TODO);

  const dispatch = createEventDispatcher();

  async function toggleDone() {
    try {
      await updateTodo({
        variables: { id, text, done: !done },
      });
      dispatch("refetchtodos");
    } catch (error) {
      console.log(error);
    }
  }

  async function deleteThis() {
    try {
      await deleteTodo({
        variables: { id },
      });
      dispatch("refetchtodos");
    } catch (error) {
      console.log(error);
    }
  }

  function handleToggle() {
    toggling = toggleDone();
  }

  function handleDelete() {
    deleting = deleteThis();
  }
</script>

<Tile {light}>
  <div class="task-row" class:done>
    <div class="task-name">
      {#await deleting}
        <InlineLoading description="Deleting..." />
      {:then value}
        {text}
      {/await}
    </div>
    {#await toggling}
      <Button size="small" skeleton={true} />
    {:then}
      <Button
        size="small"
        kind={done ? "tertiary" : "primary"}
        on:click={handleToggle}
      >
        {#if done}
          Done
        {:else}
          Not Done
        {/if}
      </Button>
    {:catch}
      <p>Error!</p>
    {/await}
    <OverflowMenu size="sm" flipped>
      <OverflowMenuItem text="Delete" on:click={handleDelete} />
    </OverflowMenu>
  </div>
</Tile>

<style>
  .task-row {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .task-row.done {
    color: #ccc7;
  }

  .task-name {
    text-align: left;
    flex-grow: 1;
  }
</style>
