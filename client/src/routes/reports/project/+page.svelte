<script lang="ts">
  import {
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import { onMount } from "svelte";
  import type { Timer, WeeklyByProjectReport } from "../../../types";
  import { projectsStore } from "../../projectsStore.svelte";

  import { formatDuration, getWeekKey, msToHours } from "../../utils";
  import {
    ArrowLeftOutline,
    ArrowRightOutline,
    ChevronDownOutline,
    ChevronUpOutline,
  } from "flowbite-svelte-icons";
  import { addDays } from "date-fns";
  import Duration from "../../Duration.svelte";
  import DropdownWithSearch from "$lib/DropdownWithSearch.svelte";
  import { Dropdown, DropdownItem } from "flowbite-svelte";

  const timers = $state<Timer[]>([]);

  const reload = async () => {
  };

  const onSelectProject = (pId: string) => {
    // load tasks for project
  };

  onMount(async () => {
    await reload();
    projectsStore.loadProjects();
  });
</script>

<Button>Select Project<ChevronDownOutline
    class="ms-2 h-6 w-6 text-white dark:text-white"
  /></Button>
<Dropdown simple>
  {#each projectsStore.projects.projects as project}
    <DropdownItem
      onclick={(e) => {
        onSelectProject(project.id);
      }}
    >{project.name}</DropdownItem>
  {/each}
</Dropdown>
<div>Tasks for project</div>
<div>
  {#each timers as t}
    <div>{t.name}</div>
  {/each}
</div>
