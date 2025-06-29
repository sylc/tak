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
  import { projectsByKey } from "../states.svelte";
  import { formatDuration, getWeekKey, msToHours } from "../utils";
  import {
    ArrowLeftOutline,
    ArrowRightOutline,
    ChevronDownOutline,
    ChevronUpOutline,
  } from "flowbite-svelte-icons";
  import { addDays } from "date-fns";
  import Duration from "../Duration.svelte";

  let weeklyReport: Record<string, WeeklyByProjectReport[]> = $state({});
  let days = $state({
    ...getWeekKey({ format: "EEE dd/MM" }),
  });
  let openRow: string | undefined | null = $state();

  let weeklyTotal = $derived.by(() => {
    const dataFortheWeek = weeklyReport[days.weekKey as string] || [];
    return dataFortheWeek.reduce((acc, curr) => acc += curr.msTotal, 0);
  });

  let selectedProjectData = $derived.by(() => {
    return (weeklyReport[days.weekKey as string] || []);
  });

  const getProjectName = (projectKey: string) => {
    return projectsByKey()[projectKey]?.name || "No Project";
  };

  onMount(async () => {
    weeklyReport = JSON.parse(
      await webui.getByWeeklyAndProjects(days.day1d.toISOString()),
    );
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
      <TableHeadCell>{days.day1}</TableHeadCell>
      <TableHeadCell>{days.day2}</TableHeadCell>
      <TableHeadCell>{days.day3}</TableHeadCell>
      <TableHeadCell>{days.day4}</TableHeadCell>
      <TableHeadCell>{days.day5}</TableHeadCell>
      <TableHeadCell>{days.day6}</TableHeadCell>
      <TableHeadCell>{days.day7}</TableHeadCell>
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
              <TableBodyCell class="text-right">{timer.name}</TableBodyCell>

              {@render row1(timer.start, timer.stop, "text-amber-700 border-r-1")}
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
  >{msToHours(ms)}h</TableBodyCell>
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
