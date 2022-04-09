<script>
  import Section from 'components/Section.svelte';
  import ExternalLink from 'components/ExternalLink.svelte';
  import pages from './pages';

  const title = 'marching cubes';
</script>

<Section {title} {pages}>
  <p>
    Implementation of the marching cubes algorithm. Inspired by Sebastian Lague's video <ExternalLink
      href="https://www.youtube.com/watch?v=M3iI2l0ltbE"
      >Coding Adventure: Marching Cubes</ExternalLink
    >
    video and Paul Bourke's technical document
    <ExternalLink href="http://paulbourke.net/geometry/polygonise/">Polygonising a scalar field</ExternalLink>
  </p>
</Section>
