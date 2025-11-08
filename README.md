# GLSL WebGL Micro-Framework

This document provides an explanation of the `GLSL` TypeScript class, a micro-framework designed to simplify WebGL2 programming with a declarative, shader-centric API.

## Overview

The `GLSL` class abstracts away the boilerplate code required for setting up a WebGL2 environment. It allows you to execute custom GLSL vertex and fragment shaders to render geometry to the screen or to a framebuffer.

The core idea is to describe a complete draw call in a single configuration object. The framework handles program caching, attribute and uniform binding, and the final draw command, letting you focus on your shader logic and data.

## Class Structure

### `constructor(canvas: HTMLCanvasElement)`

The constructor initializes the WebGL2 rendering context on a given `<canvas>` element.

### Public Methods

#### `createBuffer(data: number[] | Float32Array): WebGLBuffer`

Creates a WebGL buffer and initializes it with the provided data. This is used to supply vertex data for your attributes.

#### `createTexture(width: number, height: number, data: Float32Array | Uint8Array | null = null): WebGLTexture`

This method creates a texture that can be used as an input for your shaders. It can create both standard 8-bit textures and 32-bit floating-point textures.

-   `width`, `height`: Dimensions of the texture.
-   `data`: Optional data to initialize the texture with.

#### `draw(config: GraphicsProgramConfig): void`

This is the primary method for executing a WebGL draw call. It takes a single configuration object that describes everything needed for the render pass.

#### `display(texture: WebGLTexture): void`

A convenience method to easily render a texture to the canvas. Useful for visualizing the contents of a framebuffer.

#### `readData(texture: WebGLTexture, width: number, height: number): Float32Array`

Reads the pixel data from a texture back to the CPU into a `Float32Array`.

**Warning:** This is a very slow operation as it stalls the GPU pipeline. Use it sparingly.

### Common Uniforms

The framework automatically provides the following uniforms to your shaders. You can override them by providing a uniform with the same name in the `uniforms` object.

-   `uniform float u_time;`: The elapsed time in seconds since the `GLSL` instance was created.
-   `uniform vec2 u_resolution;`: The width and height of the canvas in pixels.

## How to Use

The core of the framework is the `draw()` method and its configuration object.

### The `GraphicsProgramConfig` Object

This object describes a single draw call.

-   `vertexShader: string`: The GLSL code for the vertex shader.
-   `fragmentShader: string`: The GLSL code for the fragment shader.
-   `attributes: { [name: string]: AttributeInfo }`: A dictionary mapping attribute names in the vertex shader to their buffer info.
    -   `AttributeInfo`: An object with `{ buffer: WebGLBuffer, size: number }`.
-   `uniforms: { [name: string]: UniformValue }`: A dictionary for your uniforms (matrices, vectors, floats, etc.).
-   `textures: { [name: string]: WebGLTexture }`: A dictionary mapping texture uniform names to `WebGLTexture` objects.
-   `count: number`: The number of vertices to draw.
-   `primitive?: 'TRIANGLES' | 'LINES' | ...`: The drawing primitive to use. Defaults to `'TRIANGLES'`.
-   `output?: WebGLFramebuffer | null`: The output framebuffer. If `null` or `undefined`, it renders to the canvas.

### Example Workflow

Here is a basic workflow for drawing a full-screen quad with a procedural texture.

#### 1. Setup

```typescript
// Get the canvas and create a GLSL instance
const canvas = document.getElementById('gl-canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const glsl = new GLSL(canvas);
```

#### 2. Define Shaders

Define your vertex and fragment shaders as GLSL strings.

```typescript
const vertexShader = `#version 300 es
  in vec2 a_position; // The attribute for our quad's vertices
  out vec2 v_texCoord;
  void main() {
      // Pass the texCoord to the fragment shader
      v_texCoord = a_position * 0.5 + 0.5;
      // Output the vertex position
      gl_Position = vec4(a_position, 0.0, 1.0);
  }`;

const fragmentShader = `#version 300 es
  precision highp float;
  in vec2 v_texCoord;
  out vec4 fragColor;
  uniform float u_time; // The framework provides this

  void main() {
      float r = 0.5 + 0.5 * cos(u_time + v_texCoord.x * 5.0);
      float g = 0.5 + 0.5 * sin(u_time + v_texCoord.y * 5.0);
      float b = 0.5 + 0.5 * cos(u_time);
      fragColor = vec4(r, g, b, 1.0);
  }
`;
```

#### 3. Create Buffers

Create buffers for your vertex attributes.

```typescript
// A simple quad covering the screen
const quadVertices = [-1, -1, 1, -1, -1, 1, 1, 1];
const quadBuffer = glsl.createBuffer(quadVertices);
```

#### 4. Draw in a Loop

In your animation loop, call the `draw()` method with the configuration object.

```typescript
function animate() {
  glsl.draw({
    vertexShader,
    fragmentShader,
    attributes: {
      // Map the 'a_position' attribute to our buffer
      a_position: { buffer: quadBuffer, size: 2 }
    },
    textures: {},
    uniforms: {},
    count: 4,
    primitive: 'TRIANGLE_STRIP',
    output: null // Render to the canvas
  });

  requestAnimationFrame(animate);
}

animate();
```
This declarative approach hides the complex WebGL state machine behind a simple, reusable configuration object, making it easy to manage different rendering passes.
