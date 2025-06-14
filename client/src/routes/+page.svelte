<script lang="ts">
  import { Button, Input, Select, Timepicker } from "flowbite-svelte";
  import {
    FolderOutline,
    PlayOutline,
    StopOutline,
    TrashBinOutline,
  } from "flowbite-svelte-icons";

  import { format, isThisWeek, isToday, parse, startOfDay } from "date-fns";
  import { ulid } from "@std/ulid";
  import TimerDisplay from "./TimerDisplay.svelte";
  import { onMount } from "svelte";
  import { formatDay } from "./utils";
  import Duration from "./Duration.svelte";
  import EditableDiv from "./EditableDiv.svelte";
  import type { Timer } from "../types";
  import { projects, settings } from "./states.svelte";
  import EditableDuration from "./EditableDuration.svelte";

  let status = $state<Timer>({ id: "", name: "", start: "", stop: "" });
  let showInvert = $state(false);

  let formatted = $derived(
    format(new Date(status.start), "dd/MM"),
  );

  const onActiveTimerTimeChange = async (data?: { time: string }) => {
    console.log(data);
    if (data) {
      const start = (parse(data.time, "HH:mm", new Date(status.start)))
        .toISOString();
      status.start = start;
      await webui.updateActiveTimerStart(start);
    }
  };

  let listOfTimers: Timer[] = $state([]);

  onMount(async () => {
    const activeTask = JSON.parse(await webui.getActiveTimer());
    if (activeTask) {
      status = activeTask;
    }
    listOfTimers = JSON.parse(await webui.timers());
    projects.projects = JSON.parse(await webui.projects());
  });

  let tasksByDay = $derived.by(() => {
    const res: Record<string, Timer[]> = {};
    for (const task of listOfTimers) {
      // get day
      const day = format(new Date(task.start), "yyyy/MM/dd");
      if (!res[day]) res[day] = [];
      res[day].push(task);
    }
    return Object.entries(res)
      .sort((a, b) => b[0].localeCompare(a[0]))
      // sort task in each days
      .map((dt) => {
        return {
          day: dt[0],
          tasks: (dt[1] as Timer[]).sort((a, b) =>
            b.start.localeCompare(a.start)
          ),
        };
      });
  });

  const todayTotal = $derived.by(() => {
    if (tasksByDay.length > 0 && isToday(new Date(tasksByDay[0].day))) {
      return tasksByDay[0].tasks.reduce(
        (acc, cur) =>
          acc +
          (new Date(cur.stop).valueOf() - new Date(cur.start).valueOf()),
        0,
      );
    }
    return 0;
  });
  const thisWeekTotal = $derived.by(() => {
    const res: { total: number; byDay: Record<string, number> } = {
      total: 0,
      byDay: {},
    };
    for (const tDay of tasksByDay) {
      const dayTotal = tDay.tasks.reduce(
        (acc, cur) =>
          acc +
          (new Date(cur.stop).valueOf() - new Date(cur.start).valueOf()),
        0,
      );
      if (isThisWeek(new Date(tDay.day), { weekStartsOn: 1 })) {
        res.total += dayTotal;
      }
      res.byDay[tDay.day] = dayTotal;
    }
    return res;
  });

  const onToggleStart = async (forceState?: "start" | "stop") => {
    if (status.start === "") {
      // start a new task
      const taskId = ulid();
      status.start = new Date().toISOString();
      status.id = taskId;

      await webui.startActiveTimer(taskId, status.name);
    } else {
      if (forceState === "start") return; // because forceState, not stopping
      await webui.stopActiveTimer();
      status = { start: "", id: "", name: "", stop: "" };
      listOfTimers = JSON.parse(await webui.timers());
    }
  };

  const onDeleteTimer = async (taskId: string) => {
    await webui.deleteTimer(taskId);
    listOfTimers = JSON.parse(await webui.timers());
  };

  const updateTimerName = async (taskId: string, newValue: string) => {
    await webui.updateTimerName(taskId, newValue);
    listOfTimers = JSON.parse(await webui.timers());
  };

  const onProjectChange = async (e: Event, timerId: string) => {
    const value = (e.target as HTMLSelectElement).value;
    console.log(value);
    if (typeof value !== "string") return;
    await webui.setProject(timerId, value);
  };

  const onEditTimeRange = async (
    timerId: string,
    start: string,
    stop: string,
  ) => {
    await webui.setTimerRange(timerId, start, stop);
    listOfTimers = JSON.parse(await webui.timers());
  };

  const onRestart = async (timerId: string) => {
    await webui.reStartTimer(timerId);
    listOfTimers = JSON.parse(await webui.timers());
    const activeTask = JSON.parse(await webui.getActiveTimer());
    status = activeTask;
  };

  const onTimerNameUpdate = async () => {
    await webui.updateActiveTimerName(status.name);
  };
</script>

<div class="">
  <div class="p-2 flex space-x-2">
    <Input
      size="sm"
      bind:value={status.name}
      onKeydown={(e) => {
        if (e.key === "Enter") {
          if (status.start === "") {
            onToggleStart("start");
          } else {
            onTimerNameUpdate();
          }
        }
      }}
      onblur={(_e) => {
        onTimerNameUpdate();
      }}
      placeholder="What are you working on?"
    />
    <TimerDisplay start={status.start} />
    <Button
      onclick={() => onToggleStart()}
      color={status.start === "" ? "green" : "red"}
    >
      {#if status.start === ""}
        <PlayOutline />
      {:else}
        <StopOutline />
      {/if}
    </Button>
  </div>

  <div class="flex p-2 justify-between items-center">
    <div class="bg-yellow-100 flex gap-2">
      {#if status.start !== ""}
        <div>
          {format(new Date(status.start), "dd/MM")}
        </div>
        <Timepicker
          value={format(new Date(status.start), "HH:mm")}
          onselect={onActiveTimerTimeChange}
          size="sm"
        />
      {/if}
    </div>
    <div
      class="flex gap-x-2 text-slate-700"
      onclick={() => showInvert = !showInvert}
    >
      <span class="text-xs text-slate-500">{
        showInvert ? "Remaining" : ""
      }</span>
      <div class="flex">
        Today:&nbsp;<Duration
          duration={todayTotal}
          type="hourFractions"
          base={showInvert ? settings.hoursPerDay : undefined}
        />h
      </div>
      <div class="text-xs" style="line-height: 2; color: gray">
        &#x1f534;&#xfe0e;
      </div>
      <div class="flex">
        This Week:&nbsp;<Duration
          duration={thisWeekTotal.total}
          type="hourFractions"
          base={showInvert ? settings.hoursPerWeek : undefined}
        />h
      </div>
    </div>
  </div>
  <div>
    <div></div>
    <hr />
    {#each tasksByDay as tDay}
      <div class="bg-white my-2 px-2">
        <div class="flex font-semibold text-slate-700 text-lg">
          {format(new Date(tDay.day), "EEE dd-MMM")} -&nbsp;<Duration
            duration={thisWeekTotal.byDay[tDay.day]}
            type="hourFractions"
          />h
        </div>
        <div class="flex flex-col gap-y-1">
          {#each tDay.tasks as taskForDay}
            <div class="flex-col gap-x-2 justify-between border-t-1 border-slate-300 py-1">
              <!-- Row 1 -->
              <div class="flex justify-between">
                <div class="flex grow-1">
                  <div class="grow-1">
                    <EditableDiv
                      text={taskForDay.name}
                      onSubmit={(newValue) =>
                      updateTimerName(taskForDay.id, newValue)}
                      withPencil="hover"
                    />
                  </div>
                  <EditableDuration
                    id={taskForDay.id}
                    start={taskForDay.start}
                    stop={taskForDay.stop}
                    onSubmit={(start, stop) =>
                    onEditTimeRange(taskForDay.id, start, stop)}
                  />
                </div>
                <div>
                  <Button
                    onclick={() => onDeleteTimer(taskForDay.id)}
                    size="xs"
                    class="flex-end"
                  >
                    <TrashBinOutline size="xs" />
                  </Button>
                </div>
              </div>
              <!-- Row 2 -->
              <div class="flex justify-between">
                <div class="min-w-46 flex align-middle items-baseline">
                  <!-- <FolderOutline /> -->
                  <Select
                    size="sm"
                    class="grow-1"
                    items={projects.projects.map((p) => ({
                      value: p.id,
                      name: p.name,
                    }))}
                    value={taskForDay.projectId || ""}
                    onchange={(e) => onProjectChange(e, taskForDay.id)}
                    underline
                    placeholder="Project"
                  />
                </div>
                <div>
                  <div>
                    {formatDay(taskForDay.start)}
                    - {formatDay(taskForDay.stop)}
                  </div>
                  <button
                    onclick={() => onRestart(taskForDay.id)}
                    class="hover:bg-green-300 px-2 rounded-md border border-gray-500"
                  >
                    re-start
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
