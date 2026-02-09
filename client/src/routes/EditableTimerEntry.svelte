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
  import { format, parse } from "date-fns";
  import type { Snippet } from "svelte";
  import EditableDiv from "./EditableDiv.svelte";
  import DropdownWithSearch from "$lib/DropdownWithSearch.svelte";
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

  let selectedTimeRange = $state({
    // svelte-ignore state_referenced_locally
    time: format(startD, "HH:mm"),
    // svelte-ignore state_referenced_locally
    endTime: format(stopD, "HH:mm"),
  });
  let isDirty = $state(false);

  let selectedTimeRangeFullDate = $derived.by(() => {
    return {
      time: parse(selectedTimeRange.time, "HH:mm", new Date(startD))
        .toISOString(),
      endTime: parse(selectedTimeRange.endTime, "HH:mm", new Date(stopD))
        .toISOString(),
    };
  });

  function handleRangeChange(
    data: { time: string; endTime: string; [key: string]: string },
  ): void {
    if (data) {
      if (
        data.time !== selectedTimeRange.time ||
        data.endTime !== selectedTimeRange.endTime
      ) {
        isDirty = true;
        selectedTimeRange = {
          time: data.time,
          endTime: data.endTime,
        };
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
            start: selectedTimeRangeFullDate.time,
            stop: selectedTimeRangeFullDate.endTime,
          },
        );
      }
      // resetState
      startD = new Date(start);
      stopD = new Date(stop);
      selectedTimeRange = {
        time: format(startD, "HH:mm"),
        endTime: format(stopD, "HH:mm"),
      };
      taskName = "";
      endOnSameDay = true;
      isDirty = false;
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

  let showInput = $state(false);
</script>

<div class="">
  <div
    id={"t-" + id}
    onclick={() => {
      showInput = true;
    }}
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
          <DropdownWithSearch
            items={projectsStore.projects.projects.filter((p) => !p.archived)}
            selected={projectsStore.projectsByIds[""]
              ?.name || ""}
            onSelection={(newId) => ""}
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
              selectedTimeRangeFullDate.time,
              selectedTimeRangeFullDate.endTime,
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
