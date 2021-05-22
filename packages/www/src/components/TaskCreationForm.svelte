<script>
  import { mutation } from "svelte-apollo";
  import { createEventDispatcher } from "svelte";
  import { CREATE_TODO } from "../queries";
  import {
    Button,
    ButtonSet,
    FluidForm,
    InlineLoading,
    TextInput,
  } from "carbon-components-svelte";
  import AddIcon from "carbon-icons-svelte/lib/Add16";

  const formState = {
    initial: true,
    input: "",
  };

  const dispatch = createEventDispatcher();
  const createTodo = mutation(CREATE_TODO);

  async function handleCreateTodo(event) {
    event.preventDefault(0);
    formState.initial = false;

    if (!formState.input) {
      emptyError = true;
      return;
    }

    try {
      buttonState = "active";
      await createTodo({
        variables: { text: formState.input },
      });
      formState.input = null;
      buttonState = "dormant";
      dispatch("refetchtodos");
    } catch (error) {
      console.log(error);
    }
  }

  const buttonProps = {
    type: "submit",
    icon: AddIcon,
    hasIconOnly: true,
    iconDescription: "Add Todo",
    size: "small",
  };

  const buttonStateMap = {
    active: "finished",
    inactive: "dormant",
    finished: "dormant",
  };

  let buttonState = "dormant";
</script>

<FluidForm style="display:flex;" on:submit={handleCreateTodo}>
  <TextInput
    labelText="New task"
    size="sm"
    placeholder="What needs doing?"
    disabled={buttonState == "active" ? true : false}
    bind:value={formState.input}
  />
  <ButtonSet>
    {#if buttonState !== "dormant"}
      <InlineLoading style="padding:0 8px;" />
    {:else}
      <Button {...buttonProps} />
    {/if}
  </ButtonSet>
  <!-- {#await submitPromise}
    <Button {...buttonProps} disabled={true} />
  {:then}
  {/await} -->
</FluidForm>

<style>
</style>
