<script lang="ts">
  import { settings } from "../states.svelte";
</script>
<div class="p-2">
  <div class="font-semibold">Settings</div>
  <div class="pt-4">
    <div>
      Hours per week: {settings.hoursPerWeek}hrs
    </div>
    <div>
      Hours per day: {settings.hoursPerDay}hrs
    </div>
  </div>
</div>
