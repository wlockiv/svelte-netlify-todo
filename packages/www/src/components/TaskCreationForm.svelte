<script>
  import {
    Button,
    ButtonSet,
    FluidForm,
    InlineLoading,
    TextInput,
  } from "carbon-components-svelte";
  import AddIcon from "carbon-icons-svelte/lib/Add16";
  import { createEventDispatcher } from "svelte";
  import { mutation } from "svelte-apollo";
  import { CREATE_TODO } from "../queries";

  let inputValue = "";

  // "dormant" or "active"
  let buttonState = "dormant";

  const dispatch = createEventDispatcher();
  const createTodo = mutation(CREATE_TODO);

  async function handleCreateTodo(event) {
    event.preventDefault();
    const _input = inputValue;
    inputValue = "";

    try {
      buttonState = "active";
      await createTodo({
        variables: { text: _input },
      });
      dispatch("refetchtodos");
      buttonState = "dormant";
    } catch (error) {
      console.log(error);
    }
  }

  $: buttonProps = {
    disabled: !inputValue ? true : false,
    icon: AddIcon,
    iconDescription: "Add task",
    size: "small",
    style: "max-width:unset",
    type: "submit",
  };
</script>

<FluidForm on:submit={handleCreateTodo}>
  <TextInput
    labelText="New task"
    size="sm"
    placeholder="What needs doing?"
    bind:value={inputValue}
  />
  <ButtonSet>
    {#if buttonState !== "dormant"}
      <InlineLoading style="padding:0 8px;" description="Adding..." />
    {:else}
      <Button {...buttonProps}>Add task</Button>
    {/if}
  </ButtonSet>
</FluidForm>

<style>
</style>
