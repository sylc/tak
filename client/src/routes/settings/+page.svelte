<script lang="ts">
  import { settings } from "../states.svelte";
  import { onMount } from "svelte";

  let appMeta = $state<{ version: string }>({ version: "" });

  onMount(async () => {
    appMeta = JSON.parse(await webui.appMeta());
  });
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
  <div class="font-semibold pt-4">About</div>
  <div class="pt-2">
    Version: {appMeta.version}
  </div>
</div>
