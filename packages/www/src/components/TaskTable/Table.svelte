<script>
  import { SkeletonPlaceholder } from "carbon-components-svelte";
  import { flip } from "svelte/animate";
  import { quintOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import TaskRow from "./TaskRow.svelte";

  export let todos;
  export let heading;
  export let filter;

  $: filteredTodos =
    !$todos.loading && !$todos.error ? $todos.data.todos.filter(filter) : [];

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
{:else}
  <div>
    <div class="task-group">
      <div class="todo-header">
        <h3>{heading}</h3>
      </div>
      {#if filteredTodos.length}
        {#each filteredTodos as task (task.id)}
          <div
            in:receive|local={{ key: task.id }}
            out:send|local={{ key: task.id }}
            animate:flip={{ duration: 200 }}
          >
            <TaskRow {task} on:refetchtodos={todos.refetch} />
          </div>
        {/each}
      {:else}
        <div class="task-group">
          <p>Nothing to show here yet!</p>
        </div>
      {/if}
    </div>
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
