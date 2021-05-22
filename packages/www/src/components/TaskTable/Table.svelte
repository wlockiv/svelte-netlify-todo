<script>
  import { query } from "svelte-apollo";
  import TaskRow from "./TaskRow.svelte";
  import { GET_TODOS } from "../../queries";
  import { crossfade } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { flip } from "svelte/animate";

  import { Toggle } from "carbon-components-svelte";

  let showDone = true;

  const [send, receive] = crossfade({
    duration: (d) => Math.sqrt(d * 200),

    fallback(node) {
      const style = getComputedStyle(node);
      const transform = style.transform == "none" ? "" : style.transform;

      return {
        duration: 600,
        easing: quintOut,
        css: (t) => `
          transform: ${transform} scale(${t});
          opacity: ${t};
        `,
      };
    },
  });

  const todos = query(GET_TODOS);
</script>

{#if $todos.loading}
  Loading...
{:else if $todos.error}
  Error
  {console.log($todos.error)}
{:else}
  <div class="task-tables">
    <div class="task-group">
      <div class="todo-header">
        <h3>Todo:</h3>
        <span>
          <Toggle bind:toggled={showDone} labelText="Show done" size="sm" />
        </span>
      </div>
      {#each $todos.data.todos.filter((t) => !t.done) as task (task.id)}
        <div
          in:receive|local={{ key: task.id }}
          out:send|local={{ key: task.id }}
          animate:flip={{ duration: 200 }}
        >
          <TaskRow {task} on:refetchtodos={todos.refetch} />
        </div>
      {/each}
    </div>
    {#if showDone}
      <div class="task-group">
        <h3>Done:</h3>
        {#each $todos.data.todos.filter((t) => t.done) as task (task.id)}
          <div
            in:receive|local={{ key: task.id }}
            out:send|local={{ key: task.id }}
            animate:flip={{ duration: 200 }}
          >
            <TaskRow {task} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .todo-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .task-group {
    display: flex;
    flex-direction: column;
    margin-top: 24px;
  }

  .task-group > div {
    margin-top: 8px;
  }

  .task-group > :first-child {
    margin-top: 0px;
  }

  h3 {
    text-align: left;
    margin: 0;
  }
</style>
