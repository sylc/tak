<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  onMount(() => {
    goto("/reports/weekly", { replaceState: true });
  });
</script>

<p>...</p>
