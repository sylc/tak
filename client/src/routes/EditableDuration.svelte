<script lang="ts">
  import {
    type DateOrRange,
    Datepicker,
    P,
    Popover,
    Timepicker,
  } from "flowbite-svelte";
  import Duration from "./Duration.svelte";
  import { formatDuration } from "./utils";
  import { format, parse } from "date-fns";

  interface Props {
    start: string;
    stop: string;
    onSubmit: (start: string, stop: string) => Promise<void>;
    id: string;
  }
  let { id, start, stop, onSubmit }: Props = $props();
  let startD = $derived(new Date(start));
  let stopD = $derived(new Date(stop));
  let isOpen = $state(false);

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
          selectedTimeRangeFullDate.time,
          selectedTimeRangeFullDate.endTime,
        );
      }
    }
  }

  function handleDateSelect(detail: DateOrRange) {
    isDirty = true;
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
    <Duration
      duration={formatDuration(start, stop)}
      type="hourFractions"
      suffix="h"
    >
    </Duration>
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
          class="w-full"
        >
          cancel
        </button>
      </div>
    </Popover>
  {/key}
</div>
