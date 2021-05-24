<script>
  import { SkeletonPlaceholder, Toggle } from "carbon-components-svelte";
  import { query } from "svelte-apollo";
  import { flip } from "svelte/animate";
  import { quintOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import { GET_TODOS } from "../../queries";
  import TaskRow from "./TaskRow.svelte";

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
  <div class="task-group">
    <div class="todo-header">
      <SkeletonPlaceholder style="height:3em;" />
      <span>
        <SkeletonPlaceholder style="height:48px;" />
      </span>
    </div>
    <SkeletonPlaceholder style="width:100%;height:64px;margin-top:8px;" />
    <SkeletonPlaceholder style="width:100%;height:64px;margin-top:8px;" />
    <SkeletonPlaceholder style="width:100%;height:64px;margin-top:8px;" />
  </div>
{:else if $todos.error}
  Error
  {console.log($todos.error)}
{:else if $todos.data.todos.length}
  <div>
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
            <TaskRow {task} on:refetchtodos={todos.refetch} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <div class="task-group">
    <p>You don't have any todos yet!</p>
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
