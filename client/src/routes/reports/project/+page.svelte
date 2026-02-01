<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { onMount } from "svelte";
  import type { Timer } from "../../../types";
  import { projectsStore } from "../../projectsStore.svelte";

  import { formatDay, formatDuration } from "../../utils";
  import { ChevronDownOutline } from "flowbite-svelte-icons";
  import Duration from "../../Duration.svelte";
  import { Dropdown, DropdownItem } from "flowbite-svelte";

  let timers = $state<Timer[]>([]);
  let selectedProject = $state({ id: "", name: "" });
  let isOpen = $state(false);

  const onSelectProject = async (pId: string, name: string) => {
    // load tasks for project
    selectedProject = { id: pId, name: name };
    const res = JSON.parse(await webui.getTasksByProject(pId));
    timers = res.timers;
  };

  onMount(async () => {
    projectsStore.loadProjects();
  });
</script>

<div class="px-2">
  <Button>{
      selectedProject.name === ""
        ? "Select Project"
        : selectedProject.name
    }<ChevronDownOutline
      class="ms-2 h-6 w-6 text-white dark:text-white"
    /></Button>
  <Dropdown bind:isOpen simple>
    {#each projectsStore.projects.projects as project}
      <DropdownItem
        onclick={(e) => {
          onSelectProject(project.id, project.name);
          isOpen = false;
        }}
      >{project.name}</DropdownItem>
    {/each}
  </Dropdown>
  {#if timers.length}
    <div class="pt-2 font-semibold">Tasks</div>
  {/if}
  <ul>
    {#each timers as t}
      <li
        class="border rounded-md p-2 my-2 flex flex-row justify-between w-full"
      >
        <div>
          {t.name}
        </div>
        <div class="flex flex-row">
          <div class="pr-3">
            {formatDay(t.start, "dd/MM/yyyy hh:mm aa")} - {
              formatDay(t.stop, "dd/MM/yyyy hh:mm aa")
            }
          </div>
          <Duration
            duration={formatDuration(t.start, t.stop)}
            type="hourFractions"
            suffix="h"
          >
          </Duration>
        </div>
      </li>
    {/each}
  </ul>
</div>
