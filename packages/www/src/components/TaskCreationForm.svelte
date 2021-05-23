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

  let formState = {
    input: "",
  };

  // "dormant" or "active"
  let buttonState = "dormant";

  const dispatch = createEventDispatcher();
  const createTodo = mutation(CREATE_TODO);

  async function handleCreateTodo(event) {
    event.preventDefault();
    const _input = formState.input;
    formState = {
      input: "",
    };

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
    type: "submit",
    icon: AddIcon,
    hasIconOnly: true,
    iconDescription: "Add Todo",
    size: "small",
    disabled: !formState.input ? true : false,
  };
</script>

<FluidForm style="display:flex;" on:submit={handleCreateTodo}>
  <TextInput
    labelText="New task"
    size="sm"
    placeholder="What needs doing?"
    bind:value={formState.input}
  />
  <ButtonSet>
    {#if buttonState !== "dormant"}
      <InlineLoading style="padding:0 8px;" />
    {:else}
      <Button {...buttonProps} />
    {/if}
  </ButtonSet>
</FluidForm>

<style>
</style>
