// /*
//  * Source: https://github.com/austinEng/webgpu-samples/blob/master/src/helpers.ts
//  */
// export async function createTextureFromImage(
//   device: GPUDevice,
//   src: string,
//   usage: GPUTextureUsageFlags,
// ) {
//   // load the image and decode it
//   const img = new Image();
//   img.src = src;
//   await img.decode();

//   // render the image to a canvas2d to get the data
//   const canvas = document.createElement('canvas');
//   canvas.width = img.width;
//   canvas.height = img.height;

//   const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
//   ctx.translate(0, img.height);
//   ctx.scale(1, -1);
//   ctx.drawImage(img, 0, 0, img.width, img.height);
//   const imageData = ctx.getImageData(0, 0, img.width, img.height);

//   // put the image data into a byte array
//   let data = null;
//   const bytesPerRow = Math.ceil((img.width * 4) / 256) * 256;
//   if (bytesPerRow == img.width * 4) {
//     data = imageData.data;
//   } else {
//     data = new Uint8Array(bytesPerRow * img.height);
//     let imagePixelIndex = 0;
//     for (let y = 0; y < img.height; ++y) {
//       for (let x = 0; x < img.width; ++x) {
//         let i = x * 4 + y * bytesPerRow;
//         data[i] = imageData.data[imagePixelIndex];
//         data[i + 1] = imageData.data[imagePixelIndex + 1];
//         data[i + 2] = imageData.data[imagePixelIndex + 2];
//         data[i + 3] = imageData.data[imagePixelIndex + 3];
//         imagePixelIndex += 4;
//       }
//     }
//   }

//   // write the data array to a buffer
//   const [buffer, mapping] = device.createBufferMapped({
//     size: data.byteLength,
//     usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
//   });
//   new Uint8Array(mapping).set(data);
//   buffer.unmap();

//   // create a texture and copy the buffer to the texture
//   const texture = device.createTexture({
//     size: {
//       width: img.width,
//       height: img.height,
//       depth: 1,
//     },
//     format: 'rgba8unorm',
//     usage: GPUTextureUsage.COPY_DST | usage,
//   });

//   const commandEncoder = device.createCommandEncoder({});
//   commandEncoder.copyBufferToTexture(
//     {
//       buffer: buffer,
//       bytesPerRow,
//     },
//     {
//       texture: texture,
//     },
//     {
//       width: img.width,
//       height: img.height,
//       depth: 1,
//     },
//   );

//   device.defaultQueue.submit([commandEncoder.finish()]);
//   buffer.destroy();

//   return texture;
// }
