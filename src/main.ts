import App from "./App.svelte";
import ZoneGenerator from "../static/zones";

ZoneGenerator.SetupZones();

const app = new App({
  target: document.body,
});

export default app;
