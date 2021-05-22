<script>
  import TaskTable from "../components/TaskTable";
  import TaskCreationForm from "../components/TaskCreationForm.svelte";
</script>

<h1>Tasks</h1>
<hr />
<TaskCreationForm />
<TaskTable />

<style>
  h1 {
    text-align: left;
    /* margin-bottom: 24px; */
  }
</style>
