<script lang="ts">
  import { Button } from "flowbite-svelte";
  import { settings } from "../states.svelte";
  import { onMount } from "svelte";
  import { DownloadOutline } from "flowbite-svelte-icons";

  let appMeta = $state<{ version: string }>({ version: "" });
  let exportFilePath = $state("");

  onMount(async () => {
    appMeta = JSON.parse(await webui.appMeta());
  });

  const exportcsv = async () => {
    const res = JSON.parse(await webui.exportCSV());
    exportFilePath = res.exportFilePath;
  };
</script>

<div class="p-2">
  <div class="font-semibold">Settings</div>
  <div class="pt-2">
    <div>
      Hours per week: {settings.hoursPerWeek}hrs
    </div>
    <div>
      Hours per day: {settings.hoursPerDay}hrs
    </div>
  </div>

  <div class="font-semibold pt-4">Data</div>
  <div>
    <Button onclick={exportcsv}>
      <DownloadOutline class="w-4 h-4 mr-2" />
      Export As CSV
    </Button>
    {#if exportFilePath}
      <div class="pt-2 italic">Data exported at: {exportFilePath}</div>
    {/if}
  </div>

  <div class="font-semibold pt-4">About</div>
  <div class="pt-2">
    Version: {appMeta.version}
  </div>
</div>
