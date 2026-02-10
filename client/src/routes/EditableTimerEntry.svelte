<script lang="ts">
  import {
    type DateOrRange,
    Datepicker,
    Popover,
    Timepicker,
    Toggle,
  } from "flowbite-svelte";
  import Duration from "./Duration.svelte";
  import { formatDuration } from "./utils";
  import { format, parse, setHours, setMinutes } from "date-fns";
  import type { Snippet } from "svelte";
  import EditableDiv from "./EditableDiv.svelte";
  import ProjectSelect from "$lib/ProjectSelect.svelte";
  import { projectsStore } from "./projectsStore.svelte";

  interface Props {
    start: string;
    stop: string;
    onSubmit: (
      args: {
        name?: string;
        projectId?: string;
        start: string;
        stop: string;
      },
    ) => Promise<void> | void;
    id: string;
    children?: Snippet;
    showNameField?: boolean;
    showProjectField?: boolean;
  }
  let {
    id,
    start,
    stop,
    onSubmit,
    children,
    showNameField,
    showProjectField,
  }: Props = $props();
  let startD = $derived(new Date(start));
  let stopD = $derived(new Date(stop));
  let taskName = $derived("");
  let projectId = $derived("");
  let isOpen = $state(false);
  let endOnSameDay = $state(true);

  let selectedTimeRange = $derived({
    time: format(startD, "HH:mm"),
    endTime: format(stopD, "HH:mm"),
  });
  let isDirty = $state(false);

  function handleRangeChange(
    data: { time: string; endTime: string; [key: string]: string },
  ): void {
    if (data) {
      if (
        data.time !== selectedTimeRange.time ||
        data.endTime !== selectedTimeRange.endTime
      ) {
        isDirty = true;
        const start = data.time.split(":");
        const end = data.endTime.split(":");
        startD = setHours(startD, parseInt(start[0]));
        startD = setMinutes(startD, parseInt(start[1]));
        stopD = setHours(stopD, parseInt(end[0]));
        stopD = setMinutes(stopD, parseInt(end[1]));
      }
    }
  }

  function onClose(e: ToggleEvent) {
    e.stopImmediatePropagation();
    if (e.newState === "closed") {
      if (isDirty) {
        onSubmit(
          {
            name: taskName != "" ? taskName : undefined,
            projectId: projectId != "" ? projectId : undefined,
            start: startD.toISOString(),
            stop: stopD.toISOString(),
          },
        );
      }
    }
  }

  function handleDateSelect(detail: DateOrRange) {
    isDirty = true;
    if (endOnSameDay) stopD = detail as Date;
  }

  function handleTaskNameChange(newName: string) {
    isDirty = true;
    taskName = newName;
  }
</script>

<div class="">
  <div
    id={"t-" + id}
    onclick={() => {}}
    class="hover:bg-slate-200 hover:font-semibold px-2 rounded-md"
  >
    {#if children}
      {@render children()}
    {:else}
      <Duration
        duration={formatDuration(start, stop)}
        type="hourFractions"
        suffix="h"
      >
      </Duration>
    {/if}
  </div>
  {#key "t-" + id}
    <Popover
      class="text-sm font-light"
      title=""
      triggeredBy={`#t-${id}`}
      trigger="click"
      placement="bottom"
      ontoggle={onClose}
      bind:isOpen
    >
      <div class="flex flex-col gap-y-2">
        {#if showNameField === undefined || showNameField}
          <div class="font-bold">
            <EditableDiv
              text={taskName}
              onSubmit={handleTaskNameChange}
              showInputP
              withPencil={"static"}
            ></EditableDiv>
          </div>
        {/if}
        {#if showProjectField === undefined || showProjectField}
          <ProjectSelect
            selected={projectsStore.projectsByIds[projectId]
              ?.name || ""}
            onSelection={(newId) => projectId = newId}
          />
        {/if}
        <div class="flex align-middle space-x-2">
          <p class="">
            Start date
          </p>
          <Datepicker
            bind:value={startD}
            onselect={handleDateSelect}
            dateFormat={{ year: "numeric", month: "short", day: "2-digit" }}
          />
        </div>
        <Toggle
          checked={endOnSameDay}
          onclick={() => endOnSameDay = !endOnSameDay}
          size="small"
          class="min-w-32"
        >end on same day</Toggle>
        {#if !endOnSameDay}
          <div class="flex align-middle space-x-2">
            <p class="">
              Stop date
            </p>
            <Datepicker
              bind:value={stopD}
              onselect={handleDateSelect}
              dateFormat={{ year: "numeric", month: "short", day: "2-digit" }}
            />
          </div>
        {/if}
        <Timepicker
          type="range"
          onselect={handleRangeChange}
          value={selectedTimeRange.time}
          endValue={selectedTimeRange.endTime}
        />
        {#if isDirty}
          <Duration
            duration={formatDuration(
              startD.toISOString(),
              stopD.toISOString(),
            )}
          />
        {/if}
        <button
          onclick={() => {
            isDirty = false;
            isOpen = false;
          }}
          class="w-full hover:font-semibold hover:bg-slate-200 border border-slate-500 pt mt-2 rounded-md"
        >
          Cancel
        </button>
      </div>
    </Popover>
  {/key}
</div>
