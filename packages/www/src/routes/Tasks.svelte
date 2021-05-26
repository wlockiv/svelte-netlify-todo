<script>
  import TaskTable from "../components/TaskTable";
  import TaskCreationForm from "../components/TaskCreationForm.svelte";
  import { query } from "svelte-apollo";
  import { GET_TODOS } from "../queries";

  const todos = query(GET_TODOS);

  const todoTables = [
    {
      heading: "Todo:",
      filter: (task) => !task.done,
    },
    {
      heading: "Done:",
      filter: (task) => task.done,
    },
  ];
</script>

<h1>Tasks</h1>
<hr />

<TaskCreationForm on:refetchtodos={todos.refetch} />

{#each todoTables as tt}
  <TaskTable {todos} {...tt} />
{/each}

<style>
  h1 {
    text-align: left;
  }
</style>
