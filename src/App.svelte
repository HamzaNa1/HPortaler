<script lang="ts">
  import Main from "./Main.svelte"
  import {SetPassword} from "../static/database"

  const urlParams = new URLSearchParams(window.location.search);
  if(urlParams.has("whatisthis")){
    SetPassword(urlParams.get("whatisthis"));
  }
</script>

<Main />
