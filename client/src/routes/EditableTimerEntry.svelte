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
  import {
    format,
    getDate,
    getMonth,
    getYear,
    setDate,
    setHours,
    setMinutes,
    setMonth,
    setYear,
  } from "date-fns";
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

  function onTogglePopover(e: ToggleEvent) {
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
        isDirty = false;
      }
    } else {
      // @ts-expect-error
      if (e.trigger.id === "t-new-entry") {
        startD = new Date();
        stopD = new Date();
      }
    }
  }

  function handleDateSelect(detail: DateOrRange, type: "start" | "stop") {
    isDirty = true;
    let detailCopy = detail as Date;
    if (type === "start") {
      startD = setYear(startD, getYear(detailCopy));
      startD = setMonth(startD, getMonth(detailCopy));
      startD = setDate(startD, getDate(detailCopy));
    }
    if (endOnSameDay || type === "stop") {
      stopD = setYear(stopD, getYear(detailCopy));
      stopD = setMonth(stopD, getMonth(detailCopy));
      stopD = setDate(stopD, getDate(detailCopy));
    }
  }

  function handleTaskNameChange(newName: string) {
    isDirty = true;
    taskName = newName;
  }

  function toggleEndOnSameDay() {
    endOnSameDay = !endOnSameDay;
    if (endOnSameDay) {
      stopD = setYear(stopD, getYear(startD));
      stopD = setMonth(stopD, getMonth(startD));
      stopD = setDate(stopD, getDate(startD));
    }
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
      class="text-sm min-w-96"
      title={undefined}
      triggeredBy={`#t-${id}`}
      trigger="click"
      placement="bottom"
      ontoggle={onTogglePopover}
      bind:isOpen
    >
      <div class="flex flex-col gap-y-2 max-w-80">
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
            value={startD}
            onselect={(newDate) => handleDateSelect(newDate, "start")}
            dateFormat={{ year: "numeric", month: "short", day: "2-digit" }}
          />
        </div>
        <div>
          <Toggle
            checked={endOnSameDay}
            onclick={toggleEndOnSameDay}
            size="small"
            class="max-w-42"
          >end on same day</Toggle>
        </div>
        {#if !endOnSameDay}
          <div class="flex align-middle space-x-2">
            <p class="">
              Stop date
            </p>
            <Datepicker
              value={stopD}
              onselect={(newDate) => handleDateSelect(newDate, "stop")}
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
        <div class="flex gap-2">
          <div>
            Duration:
          </div>
          <Duration
            duration={formatDuration(
              startD.toISOString(),
              stopD.toISOString(),
            )}
          />
          <div class="flex">
            (
            <Duration
              duration={formatDuration(
                startD.toISOString(),
                stopD.toISOString(),
              )}
              type="hourFractions"
            />
            h)
          </div>
        </div>
        <div class="flex gap-2">
          <button
            onclick={() => {
              isDirty = false;
              isOpen = false;
            }}
            class="w-full hover:font-semibold hover:bg-slate-200 border border-slate-500 pt mt-2 rounded-md"
          >
            Cancel
          </button>
          <button
            disabled={!isDirty}
            onclick={() => {
              isOpen = false;
            }}
            class="bg-green-800 text-white w-full hover:font-semibold hover:bg-green-900 border border-slate-500 pt mt-2 rounded-md font-semibold disabled:bg-slate-600 disabled:txt-slate-500"
          >
            Save
          </button>
        </div>
      </div>
    </Popover>
  {/key}
</div>
