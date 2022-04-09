<script>
  export let pages;
</script>

<style>
  .nav-link {
    display: block;
    padding: 0 10px;
  }

  a {
    text-decoration: none;
  }

  a:link,
  a:visited {
    color: #118ab2;
  }
  a:hover {
    text-decoration: underline;
  }
</style>

{#each pages as page}
  <a class="nav-link" href="/{page.title}">{page.title}</a>
{/each}
