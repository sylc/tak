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
  import type { WeeklyByProjectReport } from "../../types";
  import { projectsStore } from "../projectsStore.svelte";

  import { formatDuration, getWeekKey, msToHours } from "../utils";
  import {
    ArrowLeftOutline,
    ArrowRightOutline,
    ChevronDownOutline,
    ChevronUpOutline,
  } from "flowbite-svelte-icons";
  import { addDays } from "date-fns";
  import Duration from "../Duration.svelte";
  import DropdownWithSearch from "$lib/DropdownWithSearch.svelte";

  let weeklyReport: Record<string, WeeklyByProjectReport[]> = $state({});
  let days = $state({
    ...getWeekKey({ format: "EEE dd/MM" }),
  });
  let openRow: string | undefined | null = $state();

  let weeklyTotal = $derived.by(() => {
    const dataFortheWeek = weeklyReport[days.weekKey as string] || [];
    return dataFortheWeek.reduce((acc, curr) => acc += curr.msTotal, 0);
  });

  let dailyTotals = $derived.by(() => {
    const dataForWeek = weeklyReport[days.weekKey as string] || [];

    const dailyTotal = {
      day1: 0,
      day2: 0,
      day3: 0,
      day4: 0,
      day5: 0,
      day6: 0,
      day7: 0,
    };

    return dataForWeek.reduce((acc, curr) => {
      acc.day1 += curr.byDays[0];
      acc.day2 += curr.byDays[1];
      acc.day3 += curr.byDays[2];
      acc.day4 += curr.byDays[3];
      acc.day5 += curr.byDays[4];
      acc.day6 += curr.byDays[5];
      acc.day7 += curr.byDays[6];
      return acc;
    }, dailyTotal);
  });

  let selectedProjectData = $derived.by(() => {
    return (weeklyReport[days.weekKey as string] || []);
  });

  const getProjectName = (projectKey: string) => {
    return projectsStore.projectsByIds[projectKey]?.name || "No Project";
  };

  const onProjectChange = async (
    projectId: string | "NO_PROJECT",
    timerId: string,
  ) => {
    await webui.setProject(timerId, projectId);
    await reload();
  };

  const reload = async () => {
    weeklyReport = JSON.parse(
      await webui.getByWeeklyAndProjects(days.day1d.toISOString()),
    );
  };

  onMount(async () => {
    await reload();
    projectsStore.loadProjects();
  });

  const onPreviousWeek = async () => {
    days = {
      ...getWeekKey({
        overrideDate: addDays(days.day1d, -7).toISOString(),
        format: "EEE dd/MM",
      }),
    };
    weeklyReport = JSON.parse(
      await webui.getByWeeklyAndProjects(days.day1d.toISOString()),
    );
  };

  const onNextWeek = async () => {
    days = {
      ...getWeekKey({
        overrideDate: addDays(days.day1d, 7).toISOString(),
        format: "EEE dd/MM",
      }),
    };
    weeklyReport = JSON.parse(
      await webui.getByWeeklyAndProjects(days.day1d.toISOString()),
    );
  };

  const onNameClick = (pKey: string) => {
    openRow = openRow === pKey ? null : pKey;
  };
</script>

<div class="flex p-2 align-middle items-center">
  <Button class="p-2" onclick={onPreviousWeek}><ArrowLeftOutline
      class="h-6 w-6"
    /></Button>
  <div class="px-2">
    Week {days.weekKey.split("_")[1]}: {days.day1} - {days.day7}
  </div>
  <Button class="p-2" onclick={onNextWeek}><ArrowRightOutline
      class="h-6 w-6"
    /></Button>
</div>
<div>
  <div class="flex px-2 pb-2">
    Week Total:&nbsp;<Duration
      duration={weeklyTotal}
      type="hourFractions"
    />h
  </div>
  <Table>
    <TableHead>
      <TableHeadCell>Project</TableHeadCell>
      <TableHeadCell class="text-amber-700 border-r-1">total</TableHeadCell>
      <TableHeadCell>
        {days.day1} <br>
        {@render dailyHours(dailyTotals.day1)}
      </TableHeadCell>
      <TableHeadCell>{days.day2} <br>
        {@render dailyHours(dailyTotals.day2)}
      </TableHeadCell>
      <TableHeadCell>{days.day3} <br>
        {@render dailyHours(dailyTotals.day3)}</TableHeadCell>
      <TableHeadCell>{days.day4} <br>
        {@render dailyHours(dailyTotals.day4)}</TableHeadCell>
      <TableHeadCell>{days.day5} <br>
        {@render dailyHours(dailyTotals.day5)}</TableHeadCell>
      <TableHeadCell>{days.day6} <br>
        {@render dailyHours(dailyTotals.day6)}</TableHeadCell>
      <TableHeadCell>{days.day7} <br>
        {@render dailyHours(dailyTotals.day7)}</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each selectedProjectData as proj}
        <TableBodyRow>
          <TableBodyCell
            onclick={() => onNameClick(proj.projectKey)}
            class="my-auto"
          >
            <div class="inline-block align-middle border-1 rounded-md">
              {#if openRow === proj.projectKey}
                <ChevronUpOutline />
              {:else}
                <ChevronDownOutline />
              {/if}
            </div>
            {getProjectName(proj.projectKey)}</TableBodyCell>

          {@render row(proj.msTotal, "text-amber-700 border-r-1")}
          {@render row(proj.byDays[0])}
          {@render row(proj.byDays[1])}
          {@render row(proj.byDays[2])}
          {@render row(proj.byDays[3])}
          {@render row(proj.byDays[4])}
          {@render row(proj.byDays[5])}
          {@render row(proj.byDays[6])}
        </TableBodyRow>
        {#if openRow === proj.projectKey}
          {#each proj.timers as timer}
            <TableBodyRow>
              <TableBodyCell class="text-right pl-6 pr-2">
                <div class="flex justify-between items-center w-full">
                  <div class="">
                    {timer.name}
                  </div>
                  <div class="">
                    <DropdownWithSearch
                      items={projectsStore.projects.projects.filter((p) =>
                        !p.archived
                      )}
                      selected={projectsStore
                        .projectsByIds[proj.projectKey || ""]
                        ?.name || ""}
                      onSelection={(newProjectId) =>
                        onProjectChange(newProjectId, timer.id)}
                      dense
                    />
                  </div>
                </div>
                <!-- </div> -->
              </TableBodyCell>
              {@render           row1(timer.start, timer.stop, "text-amber-700 border-r-1")}
            </TableBodyRow>
          {/each}
        {/if}
      {/each}
    </TableBody>
  </Table>
</div>

{#snippet row(ms: number, classes?: string)}
  <TableBodyCell
    class={`${
      ms > 0 ? "font-bond text-black" : "font-light text-slate-400"
    } ${classes}`}
  >{msToHours(ms)}h
  </TableBodyCell>
{/snippet}

{#snippet row1(start: string, stop: string, classes?: string)}
  <TableBodyCell class="text-right">
    <Duration
      duration={formatDuration(start, stop)}
      type="hourFractions"
      suffix="h"
    ></Duration>
  </TableBodyCell>
{/snippet}

{#snippet dailyHours(ms: number, classes?: string)}
  <span
    class={`lowercase ${
      ms > 0 ? "font-bond text-black" : "font-light text-slate-400"
    } ${classes}`}
  >{msToHours(ms)}h
  </span>
{/snippet}
