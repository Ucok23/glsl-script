# The `GLSL` Class

The `GLSL` class is a micro-framework designed to simplify WebGL2 programming. It abstracts away much of the repetitive boilerplate code involved in setting up shaders, buffers, and rendering, allowing you to focus more on writing the GLSL shader code itself.

---

## `constructor(canvas: HTMLCanvasElement)`

-   **Purpose:** Initializes the WebGL2 context on a given canvas element.
-   **Input:**
    -   `canvas` (`HTMLCanvasElement`): This is the HTML canvas element where all the graphics will be rendered.
-   **Why it's needed:** The constructor needs a canvas to obtain the `WebGL2RenderingContext` (`gl`). This context is the core of the WebGL API and provides all the methods for drawing graphics on the GPU. The class stores this context internally for all subsequent operations.

---

## `createBuffer(data: number[] | Float32Array): WebGLBuffer`

-   **Purpose:** Creates a memory buffer on the GPU and loads it with your data.
-   **Input:**
    -   `data` (`number[] | Float32Array`): An array of numbers that represents vertex data, such as positions (`x, y, z`), colors (`r, g, b`), or texture coordinates (`u, v`).
-   **Output:**
    -   `WebGLBuffer`: A handle or reference to the buffer that now exists on the GPU. You don't interact with the data directly anymore; you use this handle.
-   **Why it's needed:** The GPU has its own dedicated high-speed memory. To draw anything, you must first transfer your vertex data from JavaScript (CPU memory) to the GPU. This function handles that process. The returned `WebGLBuffer` is then used to link this data to a shader attribute in the `draw` call.

---

## `createTexture(width: number, height: number, data?: Float32Array | Uint8Array | null): WebGLTexture`

-   **Purpose:** Creates a 2D texture on the GPU.
-   **Input:**
    -   `width` (`number`): The width of the texture in pixels.
    -   `height` (`number`): The height of the texture in pixels.
    -   `data` (optional): Initial pixel data for the texture. If you provide a `Float32Array`, it creates a high-precision floating-point texture, useful for storing non-color data (like positions or velocities for GPGPU tasks). If you provide `null`, it creates an empty texture, which is often used as a render target.
-   **Output:**
    -   `WebGLTexture`: A handle to the texture object on the GPU.
-   **Why it's needed:** Textures are most commonly used to apply images to surfaces, but they are also a general-purpose way to provide large amounts of data to shaders. This function allocates memory on the GPU for a 2D grid of data (a texture) that can be "sampled" (read from) in your shaders.

---

## `draw(config: GraphicsProgramConfig): void`

This is the central method of the class. It executes a complete rendering command, known as a "draw call."

-   **Purpose:** To render geometry to the current target (either the canvas or a framebuffer).
-   **Input:**
    -   `config` (`GraphicsProgramConfig`): A configuration object that defines everything needed for this specific draw call. Let's break down its properties:

| Property         | Type                               | Why it's needed                                                                                                                                                                                                                                                        |
| :--------------- | :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vertexShader`   | `string`                           | This is the GLSL code that runs for every single vertex you want to draw. Its primary job is to calculate the final clip-space position (`gl_Position`) of the vertex, which determines where it appears on the screen.                                                      |
| `fragmentShader` | `string`                           | This is the GLSL code that runs for every pixel that is part of the shape you're drawing (e.g., a triangle). Its job is to calculate the final color (`fragColor`) of that pixel.                                                                                             |
| `attributes`     | `{ [name: string]: AttributeInfo }`  | This is the critical link between your GPU buffers (created with `createBuffer`) and your vertex shader. It's a dictionary that maps the name of an `in` variable in your vertex shader (e.g., `in vec2 a_position;`) to the `WebGLBuffer` containing the corresponding data. It tells the GPU how to pull data from the buffer for each vertex. |
| `uniforms`       | `{ [name: string]: UniformValue }`   | Uniforms are global variables for your shaders. Their value is the same for all vertices and fragments in a single draw call. This is how you pass in data that doesn't change per-vertex, like the current time (`u_time`), mouse position, or a transformation matrix. |
| `textures`       | `{ [name: string]: WebGLTexture }`   | This maps a `sampler2D` uniform in your shader to a `WebGLTexture` you created. It allows your fragment shader to look up color values from the texture.                                                                                                                   |
| `count`          | `number`                           | This tells the GPU how many vertices it needs to process for this draw call. For example, to draw two triangles forming a square, you would provide 6 vertices, so `count` would be 6.                                                                                      |
| `primitive`      | `'TRIANGLES'`, `'LINES'`, etc.       | This tells the GPU how to interpret the vertices. Should it connect every 3 vertices to form triangles? Or every 2 to form lines? The default is `'TRIANGLES'`, which is the most common for rendering solid surfaces.                                                        |
| `output`         | `WebGLFramebuffer \| null`           | By default (`null`), WebGL renders directly to the canvas. If you provide a `WebGLFramebuffer`, it will render the scene to an off-screen texture instead. This is essential for advanced multi-pass effects like post-processing (e.g., applying a blur effect to a rendered scene). |

---

## `display(texture: WebGLTexture): void`

-   **Purpose:** A convenience method to easily draw a texture to fill the entire canvas.
-   **Input:**
    -   `texture` (`WebGLTexture`): The texture you want to display.
-   **Why it's needed:** This is a helper for debugging. It's very common, especially in post-processing, to render something to a texture and want to see the result. This method abstracts away the process of setting up a simple vertex/fragment shader pair and drawing a full-screen quad just to view a texture's contents.

---

## `readData(texture: WebGLTexture, width: number, height: number): Float32Array`

-   **Purpose:** To read the raw pixel data from a GPU texture back into JavaScript (CPU memory).
-   **Input:**
    -   `texture` (`WebGLTexture`): The texture to read from.
    -   `width`, `height` (`number`): The dimensions of the texture.
-   **Output:**
    -   `Float32Array`: An array containing the pixel data of the texture, with 4 values (R, G, B, A) for each pixel.
-   **Why it's needed:** This is primarily a debugging tool. It allows you to inspect the results of a GPU computation on the CPU. **Warning:** This is a very slow operation because it forces the CPU to wait for the GPU to finish all its work, stalling the entire graphics pipeline. It should not be used in a real-time animation loop.
