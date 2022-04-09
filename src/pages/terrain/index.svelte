<script>
  import Section from 'components/Section.svelte';
  import ExternalLink from 'components/ExternalLink.svelte';
  import pages from './pages';

  const title = 'terrain generation';
</script>

<Section {title} {pages}>
  <p>
    A basic terrain generator that uses simplex noise to build a height map. Inspired by Sebastian
    Lague's <ExternalLink
      href="https://www.youtube.com/playlist?list=PLFt_AvWsXl0eBW2EiBtl_sxmDtSgZBxB3"
      >Procedural Terrain Generation</ExternalLink
    > series.
  </p>
</Section>
