<script>
  import TaskTable from "../components/TaskTable";
  import TaskCreationForm from "../components/TaskCreationForm.svelte";
  import { query } from "svelte-apollo";
  import { GET_TODOS } from "../queries";

  const todos = query(GET_TODOS);
</script>

<h1>Tasks</h1>
<hr />
<TaskCreationForm on:refetchtodos={todos.refetch} />
<TaskTable />

<style>
  h1 {
    text-align: left;
  }
</style>
