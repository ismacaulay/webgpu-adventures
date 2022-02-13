<script>
  import examples from './routes';
</script>

<style>
  h1 {
    font-size: 14pt;
    text-align: center;
    margin-bottom: 40px;
  }

  #nav {
    position: relative;
    left: 0px;
    flex: 1;
    max-width: 300px;
    min-width: 300px;
    height: 100vh;
    overflow: auto;
    background: #ebebeb;
  }

  .nav-link {
    display: block;
    padding: 0 10px;
  }

  a {
    text-decoration: none;
  }

  a:link,
  a:visited {
    color: #357785;
  }
  a:hover {
    text-decoration: underline;
  }
</style>

<div id="nav">
  <h1>
    <a href="/">WebGPU Adventures</a>
  </h1>
  {#each examples as example}
    <a class="nav-link" href="/{example.title}">{example.title}</a>
  {/each}
</div>
