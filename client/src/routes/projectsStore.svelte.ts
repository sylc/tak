import type { Project } from "../types.ts";
import { keyBy } from "../lib/utils.ts";

class ProjectsStore {
  constructor() {
    this.loadProjects();
  }

  projects = $state<{ projects: Project[] }>({ projects: [] });

  projectsByIds = $derived(keyBy<Project>(this.projects.projects, "id"));

  recentsIds = $state<string[]>([]);

  recentsProjects = $derived(
    this.recentsIds.map((id) => this.projectsByIds[id]),
  );

  async loadProjects() {
    const res = await globalThis.webui.call("projects");
    console.log(res);
    this.projects.projects = JSON.parse(res);
  }

  async createProject(name: string) {
    await globalThis.webui.call("createProject", name);
    await this.loadProjects();
  }

  async updateProjectName(id: string, name: string) {
    await globalThis.webui.call("updateProjectName", id, name);
    await this.loadProjects();
  }

  async archiveProject(id: string, forceState: boolean) {
    await globalThis.webui.call("archiveProject", id, forceState);
    await this.loadProjects();
  }

  addToRecents(id: string) {
    // filter duplicate
    this.recentsIds = this.recentsIds.filter((i) => i !== id);
    this.recentsIds.push(id);
    if (this.recentsIds.length > 2) {
      this.recentsIds.shift();
    }
  }
}

export const projectsStore = new ProjectsStore();
