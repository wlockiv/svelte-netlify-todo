<script>
  import gql from "graphql-tag";
  import { mutation, query } from "svelte-apollo";
  import { text } from "svelte/internal";

  let createTodoInput;

  const GET_TODOS = gql`
    query Todos {
      todos {
        id
        text
        done
      }
    }
  `;

  const UPDATE_TODO = gql`
    mutation UpdateTodo($id: ID!, $text: String!, $done: Boolean!) {
      updateTodo(id: $id, text: $text, done: $done) {
        id
        text
        done
      }
    }
  `;

  const CREATE_TODO = gql`
    mutation CreateTodo($text: String!) {
      addTodo(text: $text) {
        id
        text
        done
      }
    }
  `;

  const todos = query(GET_TODOS);
  const updateTodo = mutation(UPDATE_TODO);
  const createTodo = mutation(CREATE_TODO);

  async function handleTaskUpdate(id, text, done) {
    try {
      await updateTodo({
        variables: { id, text, done },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function handleCreateTodo(text) {
    try {
      await createTodo({
        variables: { text: createTodoInput },
      });
      createTodoInput = null;
      todos.refetch();
    } catch (error) {
      console.log(error);
    }
  }
</script>

<h1>Tasks</h1>
{#if $todos.loading}
  Loading...
{:else if $todos.error}
  Error
  {console.log($todos.error)}
{:else}
  <section class="task-display">
    {#each $todos.data.todos as { done, text, id }}
      <div class="task-row" class:done>
        <div class="task-name">{text}</div>
        <div class="task-complete">
          <button on:click={() => handleTaskUpdate(id, text, !done)}>
            {#if done}
              Done
            {:else}
              Not Done
            {/if}
          </button>
        </div>
      </div>
    {/each}
    <hr />
    <div class="task-row">
      <form action="submit" on:submit|preventDefault={handleCreateTodo}>
        <input class="task-name" type="text" bind:value={createTodoInput} />
        <button type="submit">Add</button>
      </form>
    </div>
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

  .task-row form {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .task-row input {
    margin: 0;
    background-color: transparent;
    flex-grow: 1;
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

  hr {
    width: 99%;
    border: unset;
    border-top: solid 1px #aaa;
  }

  button {
    margin: 0;
  }

  button:hover {
    text-decoration: underline;
  }
</style>
