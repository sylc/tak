<script lang="ts">
  import { Button, Dropdown, DropdownGroup, Search } from "flowbite-svelte";
  import { ChevronDownOutline } from "flowbite-svelte-icons";

  interface Props {
    selected: string;
    items: { id: string; name: string }[];
    onSelection: (newId: string | "NO_PROJECT") => void;
  }
  const { items, selected, onSelection }: Props = $props();

  let searchTerm = $state("");
  let isOpen = $state(false);

  let filteredItems = $derived(
    items.filter((item) =>
      item.name.toLowerCase().indexOf(searchTerm?.toLowerCase()) !== -1
    ),
  );
</script>

<Button size="xs" outline color="light">{
    selected || "Project"
  }<ChevronDownOutline class="ms-2 h-6 w-6 dark:text-white" /></Button>
<Dropdown bind:isOpen>
  <div class="p-3">
    <Search size="md" bind:value={searchTerm} autofocus />
  </div>
  <DropdownGroup class="h-64 overflow-y-auto">
    <li
      class="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-600"
      onclick={() => {
        isOpen = false;
        onSelection("NO_PROJECT");
      }}
    >
      No project
    </li>
    {#each filteredItems as item}
      <li
        class="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-600"
        onclick={() => {
          isOpen = false;
          onSelection(item.id);
        }}
      >
        {item.name}
      </li>
    {/each}
  </DropdownGroup>
</Dropdown>
