<script>
  import PageList from 'components/PageList.svelte';

  export let title;
  export let pages;
</script>

<style>
  .container {
    margin-bottom: 20px;
  }

  h2 {
    font-weight: 300;
    margin: 0 0 0.5em 0;
    /* color: #6c757d; */
  }

</style>

<div class="container">
  <h2>{title}</h2>

  <slot />

  <PageList {pages} />
</div>
