<script lang="ts">
  import { Button, ButtonGroup, Input } from "flowbite-svelte";
  import EditableDiv from "../EditableDiv.svelte";
  import { onMount } from "svelte";
  import { projects } from "../states.svelte";

  let newProject = $state<string>("");

  onMount(async () => {
    projects.projects = JSON.parse(await webui.projects());
  });

  const onCreateProject = async () => {
    await webui.createProject(newProject);
    newProject = "";
    projects.projects = JSON.parse(await webui.projects());
  };

  const onEditProjectName = async (id: string, newValue: string) => {
    await webui.updateProjectName(id, newValue);
    projects.projects = JSON.parse(await webui.projects());
  };

  const onArchive = async (id: string, newState: boolean) => {
    await webui.archiveProject(id, newState);
    projects.projects = JSON.parse(await webui.projects());
  };
</script>

<div class="p-2">
  <ButtonGroup class="w-full">
    <Input
      size="md"
      bind:value={newProject}
      onKeydown={(e) => {
        if (e.key === "Enter" && newProject !== "") {
          onCreateProject();
        }
      }}
      placeholder="Project name"
    />
    <Button
      color="primary"
      disabled={newProject === ""}
      onclick={onCreateProject}
    >Create</Button>
  </ButtonGroup>
  <ul class="mt-2">
    {#each projects.projects as proj}
      <li
        class={`p-2 border-b-1 border-slate-200 flex justify-between
          ${proj.archived ? "opacity-50" : ""}`}
      >
        <EditableDiv
          text={proj.name}
          onSubmit={async (newValue) => {
            proj.name = newValue;
            await onEditProjectName(proj.id, newValue);
          }}
          withPencil="hover"
        />
        <Button
          color="gray"
          outline
          onclick={() => onArchive(proj.id, !proj.archived)}
          size="xs"
        >
          {#if proj.archived}
            Unarchive
          {:else}
            Archive
          {/if}
        </Button>
      </li>
    {/each}
  </ul>
</div>
