<script lang="ts">
  import { Button, ButtonGroup, Input, Toggle } from "flowbite-svelte";
  import EditableDiv from "../EditableDiv.svelte";
  import { onMount } from "svelte";
  import { projectsStore } from "../projectsStore.svelte";

  let newProject = $state<string>("");
  let showArchived = $state(false);

  let filteredProjects = $derived.by(() => {
    return projectsStore.projects.projects.filter((proj) => {
      if (newProject == "") return true;
      if (proj.name.includes(newProject)) {
        return true;
      }
    });
  });

  onMount(async () => {
    projectsStore.loadProjects();
  });

  const onEditProjectName = async (id: string, newValue: string) => {
    await projectsStore.updateProjectName(id, newValue);
  };

  const onArchive = async (id: string, newState: boolean) => {
    await projectsStore.archiveProject(id, newState);
  };
</script>

<div class="p-2">
  <ButtonGroup class="w-full">
    <Input
      size="md"
      bind:value={newProject}
      onKeydown={(e) => {
        if (e.key === "Enter" && newProject !== "") {
          projectsStore.createProject(newProject);
          newProject = "";
        }
      }}
      placeholder="Project name"
    />
    <Button
      color="primary"
      disabled={newProject === ""}
      onclick={() => projectsStore.createProject(newProject)}
    >Create</Button>
  </ButtonGroup>
  <div class="mt-2">
    <Toggle
      checked={showArchived}
      onclick={() => showArchived = !showArchived}
      size="small"
      class="min-w-32"
    >Include Archived Projects</Toggle>
  </div>
  <ul class="mt-2">
    {#each filteredProjects as proj}
      {#if !proj.archived || showArchived}
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
      {/if}
    {/each}
  </ul>
</div>
