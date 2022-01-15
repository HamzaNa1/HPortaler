<script lang="ts">
  import { isLoaded } from "../static/stores";
  import { fly } from "svelte/transition";

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  let worldLoaded = false;

  export function getContainer(): HTMLDivElement {
    return container;
  }

  export function getCanvas(): HTMLCanvasElement {
    return canvas;
  }

  isLoaded.subscribe((value) => {
    worldLoaded = value;
  });
</script>

<main>
  <div class="container" bind:this={container}>
    <canvas bind:this={canvas} />
    <div class="loading">
      {#if !worldLoaded}
        <img
          out:fly={{
            y: -200,
            duration: 1000,
          }}
          alt=""
          src="/pfc.png"
          style="display: block; margin-left: auto; margin-right: auto;"
          width="128px"
          height="128px"
        />
      {/if}
      
      {#if !worldLoaded}
        <span class="loadingText">Loading...</span>
      {/if}
    </div>
  </div>
</main>

<style>
  main {
    margin-left: 220px;
    padding: 0 0;
  }

  .container {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: black;
    top: 0;
    left: 220px;
  }

  .loading {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    line-height: 300px;
    text-align: center;
    font-size: xx-large;
  }

  .loadingText {
    display: inline-block;
    vertical-align: middle;
    line-height: normal;
  }
</style>
