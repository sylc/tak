<script lang="ts">
  interface Props {
    duration: {
      hours: number;
      minutes: number;
      seconds: number;
    } | number;

    type?: "hourFractions";
    suffix?: string;
    withLeadingSign?: boolean;

    // allow to calculate the remaining
    base?: number | undefined;
  }
  const { duration, type, base, suffix, withLeadingSign }: Props = $props();

  const durationUnified = $derived.by(() => {
    if (typeof duration !== "number") {
      return {
        ...duration,
        hourFractions: (duration.hours + duration.minutes / 60)
          .toFixed(2),
      };
    }
    const absDuration = Math.abs(duration);
    const seconds = Math.floor((absDuration / 1000) % 60);
    const minutes = Math.floor((absDuration / (1000 * 60)) % 60);
    const hours = Math.floor(absDuration / (1000 * 60 * 60));
    let hourFractions = absDuration / (1000 * 60 * 60);
    if (base && type !== "hourFractions") {
      throw Error("Not Implemented");
    }
    if (base && type === "hourFractions") {
      hourFractions = base - hourFractions;
    }
    return {
      hours,
      minutes,
      seconds,
      hourFractions: hourFractions.toFixed(2),
      sign: duration >= 0 ? "+" : "-",
    };
  });
</script>

<div>
  {#if type === "hourFractions"}
    {withLeadingSign ? durationUnified.sign : ""}{
      durationUnified.hourFractions
    }{suffix}
  {:else}
    {withLeadingSign ? durationUnified.sign : ""}{
      durationUnified.hours.toFixed().padStart(2, "0")
    }:{durationUnified.minutes.toFixed().padStart(2, "0")}:{
      durationUnified.seconds.toFixed().padStart(2, "0")
    }
  {/if}
</div>
