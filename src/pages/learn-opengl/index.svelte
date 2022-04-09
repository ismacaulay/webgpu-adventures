<script>
  import PageList from 'components/PageList.svelte';
  import pages from './pages';
</script>

<style>
</style>

<h1>learn opengl examples</h1>

<p>
  The following examples are from the <a href="https://www.learnopengl.com">learnopengl.com</a>
  tutorial series. They provided a good set of introductory behaviour that was required for the base
  engine that could then be used to build more complex examples.
</p>

<PageList {pages} />
