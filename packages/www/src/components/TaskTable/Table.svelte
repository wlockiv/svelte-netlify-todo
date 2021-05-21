<script>
  import { query } from "svelte-apollo";
  import TaskCreationForm from "./TaskCreationForm.svelte";
  import TaskRow from "./TaskRow.svelte";
  import { GET_TODOS } from "./queries";
  import { crossfade } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { flip } from "svelte/animate";

  let showDone = true;

  const [send, receive] = crossfade({
    duration: (d) => Math.sqrt(d * 200),

    fallback(node, params) {
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
  <section class="task-display">
    <TaskCreationForm on:refetchtodos={todos.refetch} />
    <hr />
    <div class="task-group">
      <div class="todo-header">
        <h3>Todo:</h3>
        <label for="show-content">
          Show Done
          <input
            name="show-content"
            type="checkbox"
            style="margin: 0"
            bind:checked={showDone}
          />
        </label>
      </div>
      {#each $todos.data.todos.filter((t) => !t.done) as task (task.id)}
        <div
          in:receive|local={{ key: task.id }}
          out:send|local={{ key: task.id }}
          animate:flip={{ duration: 200 }}
        >
          <TaskRow {task} />
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
  </section>
{/if}

<style>
  .task-display {
    display: flex;
    flex-direction: column;
    gap: 24px;
    border-radius: 4px;
    width: 100%;
    max-width: 720px;
  }

  .todo-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .task-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  hr {
    width: 99%;
    border: unset;
    border-top: solid 1px #aaa;
  }

  h3 {
    text-align: left;
    margin: 0;
  }
</style>
