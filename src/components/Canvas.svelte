<script>
  import { isWebGPUSupported } from 'toolkit/webgpu/utils';
  let element;

  export function getElement() {
    return element;
  }
</script>

<style>
  .canvas-container {
    width: 100%;
    height: 100%;
  }

  canvas {
    width: 100%;
    height: 100%;
  }

  #not-supported {
    padding: 10px;
    margin: 0;
  }
</style>

<div class="canvas-container">
  {#if !isWebGPUSupported()}
    <p id="not-supported">WebGPU not supported in this browser yet!</p>
  {:else}
    <canvas bind:this={element} width="800" height="600" />
  {/if}
</div>
