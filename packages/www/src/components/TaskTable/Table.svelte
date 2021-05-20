<script>
  import { query } from "svelte-apollo";
  import TaskCreationForm from "./TaskCreationForm.svelte";
  import TaskRow from "./TaskRow.svelte";
  import { GET_TODOS } from "./queries";

  const todos = query(GET_TODOS);
</script>

{#if $todos.loading}
  Loading...
{:else if $todos.error}
  Error
  {console.log($todos.error)}
{:else}
  <section class="task-display">
    <TaskCreationForm on:refetchtodos={todos.refetch} />
    <hr />
    {#each $todos.data.todos as task}
      <TaskRow {...task} />
    {/each}
  </section>
{/if}

<style>
  .task-display {
    /* border: solid 1px magenta; */
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-radius: 4px;
    width: 100%;
    max-width: 720px;
  }

  hr {
    width: 99%;
    border: unset;
    border-top: solid 1px #aaa;
  }
</style>
