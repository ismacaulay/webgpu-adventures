<script>
  import Section from 'components/Section.svelte';
  import ExternalLink from 'components/ExternalLink.svelte';
  import pages from './pages';

  const title = 'learn opengl examples';
</script>

<Section {title} {pages}>
  <p>
    The following examples are from the <ExternalLink href="https://www.learnopengl.com">learnopengl.com</ExternalLink>
    tutorial series. They provided a good set of introductory behaviour that was required for the base
    engine that could then be used to build more complex examples.
  </p>
</Section>
