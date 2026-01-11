import type { Project } from "../types.ts";
import { keyBy } from "../lib/utils.ts";

const MAX_RECENT_PROJECTS_LENGTH = 2;

class ProjectsStore {
  constructor() {
    this.loadProjects();
  }

  projects = $state<{ projects: Project[] }>({ projects: [] });

  projectsByIds = $derived(keyBy<Project>(this.projects.projects, "id"));

  // the first one is the most recent one.
  recentsIds = $state<string[]>([]);

  recentsProjects = $derived(
    this.recentsIds.map((id) => this.projectsByIds[id]),
  );

  async loadProjects() {
    const res = await globalThis.webui.projects();
    this.projects.projects = JSON.parse(res);
  }

  async createProject(name: string) {
    await globalThis.webui.createProject(name);
    await this.loadProjects();
  }

  async updateProjectName(id: string, name: string) {
    await globalThis.webui.updateProjectName(id, name);
    await this.loadProjects();
  }

  async archiveProject(id: string, forceState: boolean) {
    await globalThis.webui.archiveProject(id, forceState);
    await this.loadProjects();
  }

  addToRecents(id: string) {
    const recentIds = [id];
    for (const recentId of this.recentsIds) {
      if (recentId != id && recentIds.length < MAX_RECENT_PROJECTS_LENGTH) {
        recentIds.push(recentId);
      }
    }
    this.recentsIds = recentIds;
  }
}

export const projectsStore = new ProjectsStore();
