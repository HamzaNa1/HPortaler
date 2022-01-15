<script lang="ts">
  import { onMount } from "svelte";

  import Canvas from "./Canvas.svelte";
  import MainLoop from "../static/loop";
  import Sidebar from "./Sidebar.svelte";

  let canvas: Canvas;
  let sidebar: Sidebar;
  let loop: MainLoop;

  onMount(() => {
    loop = new MainLoop(canvas, sidebar);
  });
</script>

<Sidebar slot="sidebar" bind:this={sidebar} />
<Canvas slot="canvas" bind:this={canvas} />
