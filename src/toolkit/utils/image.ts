export async function loadImage(src: string): Promise<{
  data: Uint8Array;
  shape: [number, number, number];
}> {
  // load the image and decode it
  const img = new Image();
  img.src = src;
  await img.decode();

  // render the image to a canvas2d to get the data
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  // flip the image?
  // ctx.translate(0, img.height);
  // ctx.scale(1, -1);
  ctx.drawImage(img, 0, 0, img.width, img.height);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  return { data: new Uint8Array(imageData.data), shape: [img.width, img.height, 4] };
}
