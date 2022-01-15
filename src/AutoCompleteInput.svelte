<script lang="ts">
  import ZoneGenerator from "../static/zones";

  export let value: string = "";

  let currentChoice = 0;
  let items: string[] = [];

  let shown = false;

  const handleInput = (e: any) => {
    currentChoice = 0;
    items = ZoneGenerator.FindZone(e.target.value);
    show();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    let prevent = false;

    if (e.key == "Enter") {
      if (items.length > 0) {
        value = items[currentChoice];
        hide();

        prevent = true;
      }
    } else if (e.key == "Escape") {
      hide();
      prevent = true;
    } else if (e.key == "ArrowDown") {
      ChangeCurrentChoice(1);
      prevent = true;
    } else if (e.key == "ArrowUp") {
      ChangeCurrentChoice(-1);
      prevent = true;
    }

    if (prevent) {
      e.preventDefault();
    }
  };

  const handleBlur = (_e: any) => {
    hide();
  };

  function show() {
    shown = true;
  }

  function hide() {
    shown = false;
  }

  function ChangeCurrentChoice(offset: number) {
    let choice = currentChoice + offset;
    if (choice < 0) {
      choice = items.length - 1;
    } else if (choice >= items.length) {
      choice = 0;
    }

    currentChoice = choice;
  }
</script>

<div class="Outer">
  <input
    class="Inner Text"
    spellcheck="false"
    on:input={handleInput}
    on:keydown={handleKeyDown}
    on:blur={handleBlur}
    bind:value
  />
  <div class="Holder">
    {#if shown}
      <div class="Space" />
      {#if items.length > 0}
        {#each items as item, idx}
          {#if idx === currentChoice}
            <button
              class="Inner Item Button"
              on:mousedown={(_e) => (value = item)}
              style="background-color: #007ffd">{item}</button
            >
          {:else}
            <button
              class="Inner Item Button"
              on:mousedown={(_e) => (value = item)}>{item}</button
            >
          {/if}
        {/each}
      {:else}
        <textarea class="Inner Item" style="resize: none; overflow-x: hidden;"
          >No Items Available.</textarea
        >
      {/if}
    {/if}
  </div>
</div>

<style>
  .Outer {
    position: relative;
    height: 40px;
  }

  .Inner {
    position: relative;
    width: 100%;
    height: 40px;
    float: left;
  }

  .Space {
    margin-bottom: 40px;
  }

  .Text {
    border-radius: 5px;
    resize: none;
    white-space: nowrap;
    overflow-x: hidden;
  }

  .Holder {
    position: absolute;
    width: 100%;
    z-index: 99 !important;
  }

  .Item {
    display: block;
    border-radius: 0;
    margin: 0;
    border: none;
    align-content: center;
  }

  .Button:hover {
    filter: brightness(80%);
  }
</style>
