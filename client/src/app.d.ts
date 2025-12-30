// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
  var webui: {
    updateActiveTimer: (start: string, name: string) => Promise<void>;
    updateActiveTimerStart: (start: string) => Promise<void>;
    updateActiveTimerName: (name: string) => Promise<void>;
    startActiveTimer: (
      entryId: string,
      taskName: string,
      projectId?: string,
    ) => Promise<void>;
    setActiveTimerProject: (projectId: string) => Promise<void>;
    reStartTimer: (exisitingTaskId: string) => Promise<void>;
    getActiveTimer: () => Promise<string>;
    stopActiveTimer: () => Promise<void>;
    timers: () => Promise<string>;
    deleteTimer: (timerId: string) => Promise<string>;
    updateTimerName: (timerId: string, newName: string) => Promise<void>;
    setTimerRange: (
      timerId: string,
      start: string,
      stop: string,
    ) => Promise<void>;
    setProject: (timerId: string, projectId: string) => Promise<void>;
    projects: () => Promise<string>;
    createProject: (name: string) => Promise<void>;
    updateProjectName: (id: string, name: string) => Promise<void>;
    archiveProject: (id: string, forceState: boolean) => Promise<void>;
    getByWeeklyAndProjects: (startOfWeek: string) => Promise<string>;
    exportCSV: () => Promise<string>;
    appMeta: () => Promise<string>;
  };
}

export {};
