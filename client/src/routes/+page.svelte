<script lang="ts">
  import { Button, Input, Timepicker, Toggle } from "flowbite-svelte";
  import { PlayOutline, StopOutline } from "flowbite-svelte-icons";

  import { format, isThisWeek, isToday, parse } from "date-fns";
  import { ulid } from "@std/ulid";
  import TimerDisplay from "./TimerDisplay.svelte";
  import { onMount } from "svelte";
  import { formatDay } from "./utils";
  import Duration from "./Duration.svelte";
  import EditableDiv from "./EditableDiv.svelte";
  import type { Timer } from "../types";
  import { settings } from "./states.svelte";
  import EditableDuration from "./EditableDuration.svelte";
  import DropdownWithSearch from "$lib/DropdownWithSearch.svelte";
  import TimerDropdownMenuIcon from "$lib/TimerDropdownMenuIcon.svelte";
  import { projectsStore } from "./projectsStore.svelte";

  let status = $state<Omit<Timer, "id">>({
    name: "",
    start: "",
    stop: "",
  });
  let showInvert = $state(false);
  let onlyNoProject = $state(false);

  const onActiveTimerTimeChange = async (data?: { time: string }) => {
    if (data && status.start) {
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
    projectsStore.loadProjects();
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
    if (!status.start) {
      // start a new task
      const taskId = ulid();
      status.start = new Date().toISOString();

      await webui.startActiveTimer(taskId, status.name);
    } else {
      if (forceState === "start") return; // because forceState, not stopping
      await webui.stopActiveTimer();
      status = { start: "", name: "", stop: "" };
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

  const onActiveTimerProjectChange = async (
    projectId: string | "NO_PROJECT",
  ) => {
    status.projectId = projectId;
    if (status.start) {
      // if not timer has started, save to db.
      await webui.setActiveTimerProject(projectId);
    }
  };

  const onProjectChange = async (
    projectId: string | "NO_PROJECT",
    timerId: string,
  ) => {
    await webui.setProject(timerId, projectId);
    listOfTimers = JSON.parse(await webui.timers());
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

<div class="flex flex-col" style="max-height: calc(100vh - 40px)">
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
    <TimerDisplay start={status.start || ""} />
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

  <div class="flex px-2 pb-2 justify-between items-center">
    <div class="flex flex-col gap-1">
      <div>
        {#if status.start}
          <Timepicker
            value={format(new Date(status.start), "HH:mm")}
            onselect={onActiveTimerTimeChange}
            size="sm"
            divClass="scale-80 relative left-0 origin-top-left"
          />
        {:else}
          <Timepicker
            value={"-:-"}
            size="sm"
            divClass="scale-80 relative left-0 origin-top-left"
          />
        {/if}
      </div>
      <div>
        <DropdownWithSearch
          items={projectsStore.projects.projects.filter((p) => !p.archived)}
          selected={projectsStore.projectsByIds[status.projectId || ""]
            ?.name || ""}
          onSelection={(newId) => onActiveTimerProjectChange(newId)}
        />
      </div>
    </div>
    <div
      class="flex flex-col gap-x-2 text-slate-700"
    >
      <Toggle
        checked={showInvert}
        onclick={() => showInvert = !showInvert}
        size="small"
        class="min-w-32"
      >Remaining</Toggle>
      <div class="flex">
        Today:&nbsp;<Duration
          duration={todayTotal}
          type="hourFractions"
          base={showInvert ? settings.hoursPerDay : undefined}
        />h
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
  <div class="grow-1 overflow-auto">
    <hr />
    <div class="pt-2 px-2">
      <Toggle bind:checked={onlyNoProject} size="small"
      >Only tasks with No Project</Toggle>
    </div>
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
            {#if           (onlyNoProject && (!taskForDay.projectId ||
            taskForDay.projectId === "NO_PROJECT")) || !onlyNoProject}
              <div
                class="flex-col gap-x-2 justify-between border-t-1 border-slate-300 py-1"
              >
                <!-- Row 1 -->
                <div class="flex justify-between">
                  <div class="flex grow-1 justify-between">
                    <div class="min-w-4">
                      <EditableDiv
                        text={taskForDay.name}
                        onSubmit={(newValue) =>
                          updateTimerName(taskForDay.id, newValue)}
                        withPencil="hover"
                      />
                    </div>
                    {#key taskForDay.id}
                      <EditableDuration
                        id={taskForDay.id}
                        start={taskForDay.start}
                        stop={taskForDay.stop}
                        onSubmit={(start, stop) =>
                          onEditTimeRange(taskForDay.id, start, stop)}
                      />
                    {/key}
                  </div>
                  <div class="flex gap-1 align-baseline">
                    <Button
                      onclick={() => onRestart(taskForDay.id)}
                      class="hover:bg-green-700 p-1 rounded-md border border-gray-500 bg-gray-400"
                      pill={true}
                      size="sm"
                    >
                      <PlayOutline size="sm" />
                    </Button>
                    <TimerDropdownMenuIcon
                      onDeleteTimer={() => onDeleteTimer(taskForDay.id)}
                    >
                    </TimerDropdownMenuIcon>
                  </div>
                </div>
                <!-- Row 2 -->
                <div class="flex justify-between align-middle items-baseline">
                  <div class="min-w-46 flex">
                    <!-- <FolderOutline /> -->
                    <div class="my-auto">
                      <DropdownWithSearch
                        items={projectsStore.projects.projects.filter((
                          p,
                        ) => !p.archived)}
                        selected={projectsStore
                          .projectsByIds[
                            taskForDay.projectId || ""
                          ]
                          ?.name || ""}
                        onSelection={(newId) =>
                          onProjectChange(newId, taskForDay.id)}
                      />
                    </div>
                  </div>
                  <div>
                    <div class="text-xs">
                      {formatDay(taskForDay.start)}
                      - {formatDay(taskForDay.stop)}
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
