<script lang="ts">
  import { page } from "$app/state";

  let { children } = $props();

  const isActive = (path: string) => {
    if (page.url.pathname === path) return true;
    return false;
  };
</script>

<div>
  <ul class="flex gap-x-2 px-2 py-1">
    <li
      class={`pl-2 pr-3 rounded-md ${
        isActive("/reports/weekly")
          ? "underline text-black font-semibold"
          : ""
      }`}
    >
      <a href="/reports/weekly">Weekly</a>
    </li>
    <li
      class={`px-3 rounded-md ${
        isActive("/reports/project")
          ? "underline text-black font-semibold"
          : ""
      }`}
    >
      <a href="/reports/project">Project</a>
    </li>
  </ul>
  {@render children()}
</div>
