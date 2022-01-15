<script lang="ts">
  import AutoCompleteInput from "./AutoCompleteInput.svelte";
  import type SidebarInfo from "../static/sidebar";
  import type MainLoop from "../static/loop";

  import { fly } from "svelte/transition";
  import { isLoaded } from "../static/stores";

  let from: string = "";
  let to: string = "";

  let type: string = "green";

  let h: number = 0;
  let m: number = 0;

  let mainLoop: MainLoop;

  let loaded = false;
  isLoaded.subscribe((value) => {
    loaded = value;
  });

  export function SetMainLoop(loop: MainLoop) {
    mainLoop = loop;
  }

  export function SetFrom(value: string) {
    from = value;
  }

  function GetSidebarInfo(): SidebarInfo {
    let info: SidebarInfo = {
      from: from,
      to: to,
      type: type,
      h: h,
      m: m,
    };

    return info;
  }

  function Reset() {
    to = "";
    h = 0;
    m = 0;
  }
</script>

<main>
  <div class="imageHolder">
    {#if loaded}
      <img
        in:fly={Math.random() >= 0.66
          ? {
              x: -1000,
              duration: 1000,
            }
          : Math.random() >= 0.5
          ? {
              x: 1000,
              duration: 1000,
            }
          : {
              y: -1000,
              duration: 1000,
            }}
        alt=""
        src="/pfc.png"
        style="display: block; margin-left: auto; margin-right: auto; width: 50%;"
      />
    {/if}
  </div>

  <div style="height: 90px" />
  <div class="obj">
    <span class="text">From</span>
    <AutoCompleteInput bind:value={from} />
  </div>

  <div class="obj">
    <span class="text">To</span>
    <AutoCompleteInput bind:value={to} />
  </div>

  <br />

  <div class="obj">
    <span class="text">h</span>
    <input
      type="number"
      min="0"
      max="23"
      bind:value={h}
      step="1"
      style="width: 50px; margin-right: 30px"
    />
    <span class="text">m</span>
    <input
      type="number"
      min="0"
      max="59"
      bind:value={m}
      step="1"
      style="width: 50px"
    />
  </div>

  <div class="obj buttonsHolder">
    <button
      class="clearButton"
      style="background-color: #39842A"
      on:click={(_e) => (type = "green")}>2</button
    >
    <button
      class="clearButton"
      style="background-color: #404584"
      on:click={(_e) => (type = "blue")}>7</button
    >
    <button
      class="clearButton"
      style="background-color: #D69D00"
      on:click={(_e) => (type = "gold")}>20</button
    >
  </div>

  <br />

  <div class="obj">
    <button
      class="button"
      on:click={(_e) => {
        if (mainLoop != null) {
          mainLoop.world.SortAll();
          mainLoop.addConnection(GetSidebarInfo());
          Reset();
        }
      }}>Add</button
    >
  </div>

  <div class="obj">
    <button
      class="button"
      on:click={(_e) => {
        if (mainLoop != null) {
          mainLoop.deleteSelected();
        }
      }}>Delete</button
    >
  </div>

  <div class="obj">
    <button
      class="button"
      on:click={(_e) => {
        if (mainLoop != null) {
          mainLoop.randomizePositions();
        }
      }}>Randomize</button
    >
  </div>

  <div class="footer">
    <p class="footerText">
      Made by SyB0m (Best albion online player (and it's sybom not smbom))
    </p>
  </div>
</main>

<style>
  main {
    height: 100%;
    width: 220px;
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    background-color: #3c2b3d;
    overflow-x: hidden;
    font-size: 14px;
    padding-top: 15px;
  }

  .imageHolder {
    background-image: linear-gradient(#f8d24d, #3c2b3d);
    position: absolute;
    width: 100%;
    height: 110px;
    top: 0;
  }

  .text {
    color: white;
  }

  .obj {
    margin: 10px;
  }

  .buttonsHolder {
    overflow: hidden;
    white-space: nowrap;
  }

  .clearButton {
    width: 64px;
    color: white;
    border-color: black;
    font-weight: bold;
  }

  .clearButton:active {
    filter: brightness(80%);
  }

  .button {
    width: 100%;
    border-radius: 10px;
    color: white;
    background-color: #20a186;
    border-color: #1a836c;
    font-weight: bold;
  }

  .button:hover {
    background-color: #25bd9c;
  }

  .button:active {
    background-color: #1a836c;
  }

  .footer {
    position: absolute;
    left: 0;
    bottom: 15px;
    width: 100%;
    background-color: #3c2b3d;
    text-align: center;
  }

  .footerText {
    font-size: x-small;
    color: #3c2b3d;
  }
</style>
