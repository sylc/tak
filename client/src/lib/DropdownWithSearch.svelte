<script lang="ts">
  import { Button, Dropdown, DropdownGroup, Search } from "flowbite-svelte";
  import { ChevronDownOutline, FolderOutline } from "flowbite-svelte-icons";
  import { projectsStore } from "../routes/projectsStore.svelte";

  interface Props {
    selected: string;
    items: { id: string; name: string }[];
    onSelection: (newId: string | "NO_PROJECT") => void;
    dense?: boolean;
  }
  const { items, selected, onSelection, dense }: Props = $props();

  let searchTerm = $state("");
  let isOpen = $state(false);

  let filteredItems = $derived(
    items.filter((item) =>
      item.name.toLowerCase().indexOf(searchTerm?.toLowerCase()) !== -1
    ),
  );
</script>

<Button
  size="xs"
  outline={!dense}
  color="light"
  class={`py-0.15 w-full ${dense ? "border-0" : ""}`}
>
  {#if dense}
    <FolderOutline class="h-6 w-6 dark:text-white text-slate-500" />
  {:else}
    {selected || "Project"}
    <ChevronDownOutline class="ms-2 h-6 w-6 dark:text-white" />
  {/if}
</Button>
<Dropdown bind:isOpen>
  <div class="p-3">
    <Search
      size="md"
      bind:value={searchTerm}
      autofocus
      placeholder="Search projects"
      onkeydown={(e) => {
        if (
          e.code === "Enter" && searchTerm?.length > 1 &&
          filteredItems.length === 1
        ) {
          isOpen = false;
          onSelection(filteredItems[0].id);
          projectsStore.addToRecents(filteredItems[0].id);
        }
      }}
    />
  </div>
  <DropdownGroup class="h-64 overflow-y-auto text-left">
    {#if projectsStore.recentsProjects.length && !searchTerm}
      <div class="divider">
        Recents
      </div>
      {#each projectsStore.recentsProjects as proj}
        <li
          class="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-600"
          onclick={() => {
            isOpen = false;
            onSelection(proj.id);
            projectsStore.addToRecents(proj.id);
          }}
        >
          {proj.name}
        </li>
      {/each}
      <div class="divider">
        All
      </div>
    {/if}
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
          projectsStore.addToRecents(item.id);
        }}
      >
        {item.name}
      </li>
    {/each}
  </DropdownGroup>
</Dropdown>

<style>
  .divider {
    display: flex; /* Aligns items (text and pseudo-elements) in a row */
    align-items: center; /* Vertically centers the text within the line space */
    text-align: center;
    margin: 2px 0; /* Adds some vertical spacing around the divider */
    color: #9e9d9d;
  }

  .divider::before,
  .divider::after {
    content: ""; /* Required for pseudo-elements to render */
    flex: 1; /* Allows the lines to grow and fill available space */
    border-top: 1px solid #ccc; /* Creates the horizontal line */
    margin: 0 8px; /* Adds a small gap between the text and the line */
  }
</style>
