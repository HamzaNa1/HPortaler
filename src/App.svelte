<script lang="ts">
  import Main from "./Main.svelte";
  import { ChangePassword } from "./scripts/passwordManager";

  let show = false;

  const passwordCheck = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("whatisthis")) {
      alert(await ChangePassword(urlParams.get("whatisthis")));
    } else {
      show = true;
    }
  };

  passwordCheck();
</script>

{#if show}
  <Main />
{/if}
