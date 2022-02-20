import {
  BufferType,
  UniformBuffer,
  UniformBufferDescriptor,
  UniformDictionary,
  UniformLocationDictionary,
  UniformType,
  UniformValue,
} from 'toolkit/types/webgpu/buffers';
import { createBuffer } from '../utils';

function getSizeForUniformType(type: UniformType) {
  switch (type) {
    case UniformType.Bool:
    case UniformType.Scalar:
      return 1;
    case UniformType.Vec2:
      return 2;
    case UniformType.Vec3:
      return 3;
    case UniformType.Vec4:
      return 4;
    case UniformType.Mat2:
    case UniformType.Mat2x3:
    case UniformType.Mat2x4:
      return 8;
    case UniformType.Mat3x2:
    case UniformType.Mat3:
    case UniformType.Mat3x4:
      return 12;
    case UniformType.Mat4x2:
    case UniformType.Mat4x3:
    case UniformType.Mat4:
      return 16;
    default:
      throw new Error(`Unknown uniform type: ${type}`);
  }
}

function locationForValue(value: UniformType, offset: number) {
  switch (value) {
    case UniformType.Bool:
    case UniformType.Scalar:
    case UniformType.Vec2:
    case UniformType.Vec3:
    case UniformType.Vec4:
      return offset;
    case UniformType.Mat2:
      return { offset, c: 2, r: 2 };
    case UniformType.Mat2x3:
      return { offset, c: 2, r: 3 };
    case UniformType.Mat2x4:
      return { offset, c: 2, r: 4 };
    case UniformType.Mat3x2:
      return { offset, c: 3, r: 2 };
    case UniformType.Mat3:
      return { offset, c: 3, r: 3 };
    case UniformType.Mat3x4:
      return { offset, c: 3, r: 4 };
    case UniformType.Mat4x2:
      return { offset, c: 4, r: 2 };
    case UniformType.Mat4x3:
      return { offset, c: 4, r: 3 };
    case UniformType.Mat4:
      return { offset, c: 4, r: 4 };
    default:
      throw new Error(`Unknown matrix type: ${value}`);
  }
}

function convertValueToBuffer(value: ArrayLike<number>, c: number, r: number) {
  const buffer = new Float32Array(c * 4);
  for (let i = 0; i < c; ++i) {
    for (let j = 0; j < r; j++) {
      buffer[4 * i + j] = value[r * i + j];
    }
  }
  return buffer;
}

function computeTwoBytePadding(offset: number) {
  if (offset % 2 !== 0) {
    return 1;
  }
  return 0;
}
function computeFourBytePadding(offset: number) {
  if (offset % 4 !== 0) {
    return 4 - (offset % 4);
  }
  return 0;
}

export function processUniforms(uniforms: UniformBufferDescriptor) {
  let offset = 0;
  const locations: UniformLocationDictionary = {};

  function processUniformsRecursive(uniforms: UniformBufferDescriptor, keyBase = '') {
    const entries = Object.entries(uniforms);

    for (let i = 0; i < entries.length; ++i) {
      const [key, value] = entries[i];

      let locationKey = key;
      if (keyBase) {
        locationKey = `${keyBase}.${key}`;
      }

      if (Array.isArray(value)) {
        const [descriptor, length] = value;
        if (typeof descriptor === 'object') {
          locations[locationKey] = true;
          for (let j = 0; j < length; ++j) {
            offset += computeFourBytePadding(offset);

            const arrLocationKey = `${locationKey}[${j}]`;
            locations[arrLocationKey] = true;
            processUniformsRecursive(descriptor, arrLocationKey);

            offset += computeFourBytePadding(offset);
          }
        } else {
          offset += computeFourBytePadding(offset);
          locations[locationKey] = true;

          for (let j = 0; j < length; ++j) {
            locations[`${locationKey}[${j}]`] = locationForValue(descriptor, offset);
            offset += getSizeForUniformType(descriptor);
            offset += computeFourBytePadding(offset);
          }
        }
      } else if (typeof value === 'object') {
        offset += computeFourBytePadding(offset);

        locations[locationKey] = true;
        processUniformsRecursive(value, locationKey);

        offset += computeFourBytePadding(offset);
      } else {
        if (value === UniformType.Scalar || value === UniformType.Bool) {
          // no padding
        } else if (value === UniformType.Vec2) {
          offset += computeTwoBytePadding(offset);
        } else if (value === UniformType.Vec3 || value === UniformType.Vec4) {
          offset += computeFourBytePadding(offset);
        } else {
          // padding for matrix types
          offset += computeFourBytePadding(offset);
        }

        locations[locationKey] = locationForValue(value, offset);
        offset += getSizeForUniformType(value);
      }
    }
  }

  processUniformsRecursive(uniforms);
  return { buffer: new Float32Array(offset), locations };
}

export function createUniformBuffer(
  device: GPUDevice,
  descriptor: UniformBufferDescriptor,
  values?: UniformDictionary,
): UniformBuffer {
  const { buffer, locations } = processUniforms(descriptor);

  let needsUpdate = false;
  function updateUniform(name: string, value: UniformValue) {
    const location = locations[name];
    if (location === undefined) {
      throw new Error(`Unknown uniform: ${name}`);
    }

    if (typeof location === 'boolean') {
      if (Array.isArray(value)) {
        value.forEach((v: UniformValue, idx: number) => {
          updateUniform(`${name}[${idx}]`, v);
        });
      } else {
        Object.entries(value).forEach(([k, v]) => {
          updateUniform(`${name}.${k}`, v);
        });
      }

      return;
    } else if (typeof location === 'object') {
      const { offset, c, r } = location;
      buffer.set(convertValueToBuffer(value as ArrayLike<number>, c, r), offset);
    } else {
      if (typeof value === 'number') {
        buffer.set([value], location);
      } else if (Array.isArray(value) || value instanceof Float32Array) {
        buffer.set(value as ArrayLike<number>, location);
      } else if (typeof value === 'boolean') {
        buffer.set([+value], location);
      }
    }

    needsUpdate = true;
  }

  function updateUniforms(uniforms: UniformDictionary) {
    Object.entries(uniforms).forEach(([key, value]) => updateUniform(key, value));
  }

  if (values) {
    updateUniforms(values);
    needsUpdate = false;
  }

  const gpuBuffer = createBuffer(device, buffer, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

  return {
    type: BufferType.Uniform,
    buffer: gpuBuffer,
    data: buffer,

    get needsUpdate() {
      return needsUpdate;
    },
    set needsUpdate(value: boolean) {
      needsUpdate = value;
    },

    hasUniform(name: string): boolean {
      return name in locations;
    },
    updateUniform,
    updateUniforms,

    destroy() {
      gpuBuffer.destroy();
    },
  };
}
