<script lang="ts">
  import { Button, Dropdown, DropdownGroup, Search } from "flowbite-svelte";
  import {
    DotsVerticalOutline,
    TrashBinOutline,
  } from "flowbite-svelte-icons";

  interface Props {
    onDeleteTimer: () => void;
  }
  const { onDeleteTimer }: Props = $props();

  let isOpen = $state(false);
</script>

<div
  class="flex items-center hover:border-1 rounded-md border-slate-300 dark:text-white ml-[2px] hover:ml-0"
>
  <DotsVerticalOutline />
</div>

<Dropdown simple bind:isOpen>
  <DropdownGroup class="">
    <li
      class="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center cursor-pointer"
      onclick={() => {
        isOpen = false;
        onDeleteTimer();
      }}
    >
      <TrashBinOutline size="sm" />
      Delete
    </li>
  </DropdownGroup>
</Dropdown>
