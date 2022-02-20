<script lang="ts">
  import Canvas from "./components/Canvas.svelte";
  import MainLoop from "./scripts/loop";
  import Sidebar from "./components/Sidebar.svelte";
  import { isLoggedIn } from "./scripts/stores";

  let canvas: Canvas;
  let sidebar: Sidebar;
  let loop: MainLoop;

  isLoggedIn.subscribe((value) => {
    if (value) {
      loop = new MainLoop(canvas, sidebar);
    }
  });
</script>

<Sidebar slot="sidebar" bind:this={sidebar} />
<Canvas slot="canvas" bind:this={canvas} />
