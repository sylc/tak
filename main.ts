// deno-lint-ignore-file no-inner-declarations

import { WebUI } from "webui";
import { ulid } from "ulid";
import * as media_types from "media-types";
import { extname } from "extname";
import { stringify } from "stringify";
import { formatDate, getDay, getWeek, getYear } from "date-fns";
import type {
  Project,
  Timer,
  WeeklyByProjectReport,
} from "./client/src/types.ts";

import { getPort } from "./lib/utils.ts";
import { log } from "./lib/log.ts";
import { resolve } from "resolve";
import {
  appxRealExportsFolderPath,
  dbPath,
  exportsFolderPath,
  isDev,
  logsFolderPath,
  rootStoragefolder,
  version,
} from "./lib/config.ts";
import { TimersAdaptor } from "./lib/TimersAdaptor.ts";

try {
  const webui = new WebUI();

  Deno.mkdirSync(rootStoragefolder, { recursive: true });
  Deno.mkdirSync(logsFolderPath, { recursive: true });
  Deno.mkdirSync(exportsFolderPath, { recursive: true });
  const kv = await Deno.openKv(dbPath);

  const timersX = new TimersAdaptor(kv);

  // Active timer
  webui.bind("startActiveTimer", async (e: WebUI.Event) => {
    console.log(e.arg.string(0), e.arg.string(1));
    await startActiveTimer(e.arg.string(0), e.arg.string(1).trim());
  });

  webui.bind("stopActiveTimer", async () => {
    return JSON.stringify(await stopActive());
  });

  webui.bind("updateActiveTimerStart", async (e: WebUI.Event) => {
    const start = e.arg.string(0);
    console.log("update active timer start", start);

    const timer = (await kv.get<Timer>(["activeTimer"])).value!;
    await kv.set(["activeTimer"], { ...timer, start });
  });

  webui.bind("updateActiveTimerName", async (e: WebUI.Event) => {
    const newName = e.arg.string(0);
    console.log("update active timer name:", newName);

    const timer = (await kv.get<Timer>(["activeTimer"])).value;
    await kv.set(["activeTimer"], { ...timer, name: newName.trim() });
  });

  webui.bind("getActiveTimer", async (_e: WebUI.Event) => {
    const activeTask = (await kv.get<string>(["activeTimer"])).value;
    return JSON.stringify(activeTask);
  });

  async function startActiveTimer(
    entryId: string,
    taskName: string,
    projectId?: string,
  ) {
    const newTimer: Timer = {
      id: entryId,
      start: (new Date()).toISOString(),
      name: taskName,
      stop: "",
      projectId,
    };
    await kv.atomic()
      .set(["activeTimer"], newTimer)
      .commit();
  }

  webui.bind("reStartTimer", async (e: WebUI.Event) => {
    const exisitingTaskId = e.arg.string(0);
    const timer = (await kv.get<Timer>(["timers", exisitingTaskId])).value;
    if (!timer) {
      console.error("timer do not exist!!", timer);
      return;
    }
    // stop any task if there is any active.
    await stopActive();
    await startActiveTimer(ulid(), timer.name, timer.projectId);
  });

  webui.bind("setActiveTimerProject", async (e: WebUI.Event) => {
    const projectId = e.arg.string(0);
    console.log("Active timer Assign project", projectId);

    const activeTimer = (await kv.get<Timer>(["activeTimer"])).value;
    await kv.atomic()
      .set(["activeTimer"], { ...activeTimer, projectId })
      .commit();
  });

  // when the active timer is stopped, it is copied over to
  // the timers index
  async function stopActive() {
    const activeTimer = (await kv.get<Timer>(["activeTimer"])).value;
    if (!activeTimer || !activeTimer.start) return;
    await timersX.createNewTimer(
      {
        ...activeTimer,
        stop: (new Date()).toISOString(),
      },
      true,
    );
  }

  ////////////////////////////////////////////////////
  // Generic timers
  webui.bind("timers", async (_e: WebUI.Event) => {
    return JSON.stringify(await timersX.timers());
  });

  webui.bind("deleteTimer", async (e: WebUI.Event) => {
    const timerId = e.arg.string(0);
    console.log("deleting", timerId);

    await timersX.delete(timerId);
    return JSON.stringify(await timersX.timers());
  });

  webui.bind("updateTimerName", async (e: WebUI.Event) => {
    const timerId = e.arg.string(0);
    const newName = e.arg.string(1);
    console.log("update timer Name", timerId, newName);

    await timersX.updateTimerName(timerId, newName);
  });

  webui.bind("setTimerRange", async (e: WebUI.Event) => {
    const timerId = e.arg.string(0);
    const start = e.arg.string(1);
    const stop = e.arg.string(2);
    console.log("set timer range", timerId, start, stop);

    await timersX.setTimerRange(timerId, start, stop);
  });

  webui.bind("setProject", async (e: WebUI.Event) => {
    const timerId = e.arg.string(0);
    const projectId = e.arg.string(1);
    console.log("Assign project", timerId, projectId);

    await timersX.setProject(timerId, projectId);
  });

  webui.bind("postNewTimer", async (e: WebUI.Event) => {
    const timerName = e.arg.string(0);
    const projectId = e.arg.string(1);
    const start = e.arg.string(2);
    const stop = e.arg.string(3);
    console.log("new Timer", timerName, projectId, start, stop);

    await timersX.createNewTimer({
      id: ulid(),
      name: timerName,
      projectId,
      start,
      stop,
    });
  });

  /////////////////// Projects
  // save project
  webui.bind("createProject", async (e: WebUI.Event) => {
    const name = e.arg.string(0);
    const id = ulid();
    await kv.set(["projects", id], { id, name });
  });

  webui.bind("updateProjectName", async (e: WebUI.Event) => {
    const id = e.arg.string(0);
    const name = e.arg.string(1);
    console.log("project newName", id, name);
    const project = (await kv.get<Project>(["projects", id])).value!;
    await kv.set(["projects", id], { ...project, name });
  });

  webui.bind("archiveProject", async (e: WebUI.Event) => {
    const id = e.arg.string(0);
    const forceState = e.arg.boolean(1);
    console.log("archiving project", `"${id}"`, forceState);
    const project = (await kv.get<Project>(["projects", id])).value!;
    await kv.set(["projects", id], {
      ...project,
      archived: forceState ? new Date().toISOString() : undefined,
    });
  });

  // getProjects
  webui.bind("projects", async (_e: WebUI.Event) => {
    const entries = await Array.fromAsync(
      kv.list<Project>({ prefix: ["projects"] }),
    );
    const projects: Project[] = [];
    for (const entry of entries) {
      if (entry.key.length > 2) continue; // keys like [projects, "abc", timers, true] will be skipped.
      projects.push(entry.value!);
    }
    return JSON.stringify(
      projects.sort((a, b) => a.name.localeCompare(b.name)),
    );
  });

  //// TBD reports
  webui.bind("getByWeeklyAndProjects", async (e: WebUI.Event) => {
    const startOfWeek = e.arg.string(0);
    return JSON.stringify(await getByWeeklyAndProjects(startOfWeek));
  });

  async function getByWeeklyAndProjects(startOfWeek: string) {
    // found timers for last week. then separate by projects then accumulate by day
    const timersList = await timersX.timers({ startOfWeekDay: startOfWeek });
    const accumulated: Record<
      string,
      Record<
        string,
        WeeklyByProjectReport
      >
    > = {}; // shape is { weekKey: { projectKey : { projectKey, durationTotal, tasks: [], durationDays: [ day1, day2, day2, day4, day5, day5, day7 ] } } }
    for (const timer of timersList) {
      const startDate = new Date(timer.start);
      const stopDate = new Date(timer.stop);
      //calculate duration
      const duration = stopDate.valueOf() - startDate.valueOf();
      const week = getWeek(startDate, { weekStartsOn: 1 });
      const year = getYear(startDate);
      const weekKey = `${year}_${week}`;
      if (!accumulated[weekKey]) accumulated[weekKey] = {};
      const projectKey = timer.projectId || "NO_PROJECT";
      if (!accumulated[weekKey][projectKey]) {
        accumulated[weekKey][projectKey] = {
          projectKey,
          msTotal: 0,
          timers: [],
          byDays: [0, 0, 0, 0, 0, 0, 0],
        };
      }
      accumulated[weekKey][projectKey].msTotal += duration;
      accumulated[weekKey][projectKey].timers.push(timer);
      // get the Day of the week
      const dayOfWeek = getDay(startDate) || 7; // sunday is zero, so becomes 7
      accumulated[weekKey][projectKey].byDays[dayOfWeek - 1] += duration;
    }

    const res: Record<
      string,
      WeeklyByProjectReport[]
    > = {};
    for (const weekKey in accumulated) {
      res[weekKey] = Object.values(accumulated[weekKey]);
    }
    return res;
  }

  webui.bind("getTasksByProject", async (e: WebUI.Event) => {
    const projectId = e.arg.string(0);
    const entries = await Array.fromAsync(
      kv.list<string>({ prefix: ["projects", projectId, "timers"] }),
    );

    const timerIds: string[] = [];

    for (const entry of entries) {
      timerIds.push(entry.key[3] as string);
    }
    const timersList: Timer[] = await timersX.getTimersValuesInBatches(
      timerIds,
    );

    timersList.sort((a, b) => b.start.localeCompare(a.start));
    return JSON.stringify({ project: { id: projectId }, timers: timersList });
  });

  webui.bind("exportCSV", async () => {
    const filename = `export_${
      formatDate(new Date(), "yyyy-MM-dd_HH-mm-ss")
    }.csv`;

    // constructData
    const timers = await Array.fromAsync(
      kv.list<Timer>({ prefix: ["timers"] }),
    );

    // Populate Projects.

    const entries = await Array.fromAsync(
      kv.list<Project>({ prefix: ["projects"] }),
    );
    const projects: Project[] = [];
    for (const entry of entries) {
      if (entry.key.length > 2) continue; // keys like [projects, "abc", timers, "abe"] will be skipped.
      projects.push(entry.value!);
    }

    // key project byId
    const projectById: Record<string, Project> = {};
    for (const project of projects) {
      projectById[project.id] = project;
    }

    // set project in timers and format to csv
    const csvData = stringify(
      timers.map((timer) => {
        timer.value;
        return {
          ...timer.value,
          project: timer.value.projectId
            ? projectById[timer.value.projectId]?.name
            : "",
        };
      }),
      {
        columns: ["id", "name", "start", "stop", "project"],
      },
    );

    const exportFilePath = resolve(
      exportsFolderPath,
      filename,
    );

    await Deno.writeTextFile(exportFilePath, csvData);

    return JSON.stringify({
      exportFilePath: resolve(appxRealExportsFolderPath, filename),
    });
  });

  //////
  webui.bind("appMeta", () => {
    return JSON.stringify({ version });
  });

  const port = await getPort();
  webui.setPort(port);

  if (isDev) {
    //
    // Show a new window and point to our custom web server
    // Assuming the custom web server is running on port
    // 5173...
    await webui.showBrowser("http://localhost:5173/", WebUI.Browser.AnyBrowser);
  } else {
    // Once compiled, the webUi webserver do not have access
    // to the static files embeded in the
    // binary, we need a special handler for this.
    const getEmbeddedFile = async (
      contentType: string,
      filename: string,
    ): Promise<Uint8Array> => {
      const path = Deno.build.standalone
        ? import.meta.dirname + "/client/build" + filename
        : "./client/build" + filename;
      let contentStr = await Deno.readTextFile(path);
      if (filename === "/index.html") {
        contentStr = contentStr.replace(
          "http://localhost:8082/",
          `http://localhost:${port}/`,
        );
      }
      const content = new TextEncoder().encode(contentStr);
      const header = [
        "HTTP/1.1 200 OK",
        `Content-Type: ${contentType}`,
        "Cache-Control: no-cache, no-store",
        "",
        "",
      ].join("\r\n");
      const headerBytes = new TextEncoder().encode(header);
      const response = new Uint8Array(headerBytes.length + content.length);
      response.set(headerBytes, 0);
      response.set(content, headerBytes.length);
      return response;
    };

    // Custom file handler
    async function myFileHandler(myUrl: URL) {
      let filePath = myUrl.pathname;
      if (filePath === "/") {
        filePath = "/index.html";
      }
      const contentTypeValue = media_types.contentType(extname(filePath));
      return (await getEmbeddedFile(contentTypeValue || "text/html", filePath));
    }
    webui.setFileHandler(myFileHandler);

    const index = await Deno.readTextFile(
      import.meta.dirname + "/client/build/index.html",
    );
    await webui.show(
      index.replaceAll("http://localhost:8082/", `http://localhost:${port}/`),
    );
  }
  await WebUI.wait();
} catch (err) {
  if (isDev) throw err;
  else {
    log(err);
  }
}
