# Workflow Guide: Thinking with the GLSL Micro-Framework

This guide outlines a suggested thought process for creating WebGL effects with this micro-framework. The key is to first think about what you want to achieve visually, and then work backward to determine the necessary data and shader logic.

---

## Step 1: The Concept - What Do You Want to Create?

Before writing any code, start with a clear goal.

-   **Are you drawing a static 2D shape?** (e.g., a triangle, a square, a circle)
-   **Are you drawing a 3D object?** (e.g., a cube, a sphere)
-   **Is it animated?** (e.g., moving, rotating, changing color over time)
-   **Is it interactive?** (e.g., responding to mouse movement)
-   **Are you processing an image or texture?** (e.g., applying a blur, a color filter)

Let's use a simple example: **"I want to draw a single, multi-colored triangle that spins."**

---

## Step 2: The Vertex Shader - Positioning the Vertices

The **vertex shader's** primary job is to tell the GPU where each corner (vertex) of your shape should be on the screen.

### A. What data does each individual vertex need?

For our spinning triangle, each of its three vertices needs:
1.  A base **position** (x, y coordinates).
2.  A **color** (r, g, b values).

This translates directly to the `in` variables (attributes) at the top of your vertex shader. You can name them anything, but a common convention is to prefix them with `a_` for "attribute".

The following is a **Vertex Shader** example:

```glsl
#version 300 es

// The base (x, y) position for this vertex
in vec2 a_position;
// The color for this vertex
in vec3 a_color;
```

### B. What data needs to be passed to the Fragment Shader?

The vertex shader can pass data along to the fragment shader. For our example, we want the final color of the pixels to be based on the vertex colors. We'll define an `out` variable (often prefixed with `v_` for "varying") to pass the color along.

Here is the updated **Vertex Shader**:

```glsl
#version 300 es

in vec2 a_position;
in vec3 a_color;

// Pass the color to the fragment shader
out vec3 v_color;

void main() {
    // ... calculation happens here ...
    // Pass the attribute color directly through
    v_color = a_color;
}
```

### C. What data is the same for all vertices?

The triangle needs to spin. This spinning motion is the same for all three vertices in a single frame. Data that is uniform across all vertices is a **uniform**.

1.  We need the current **time** to control the rotation angle. The framework provides `u_time` automatically.

We'll declare this at the top of the shader.

This final **Vertex Shader** includes the time uniform for animation:

```glsl
#version 300 es

// Global time variable
uniform float u_time;

in vec2 a_position;
in vec3 a_color;
out vec3 v_color;

void main() {
    // Create a rotation matrix
    float angle = u_time;
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    // Apply the rotation to the position
    vec2 rotatedPosition = rotationMatrix * a_position;

    // The final output: where this vertex is on the screen
    gl_Position = vec4(rotatedPosition, 0.0, 1.0);

    v_color = a_color;
}
```

---

## Step 3: The Fragment Shader - Coloring the Pixels

The **fragment shader's** job is simple: determine the final color of each pixel on the surface of your shape.

### A. What data does it need from the Vertex Shader?

Our vertex shader is passing the color using `v_color`. The fragment shader needs to accept this with a matching `in` variable.

The following **Fragment Shader** receives the color:

```glsl
#version 300 es
// Necessary boilerplate
precision highp float;

// Received from the vertex shader
in vec3 v_color;
```
When the GPU renders the triangle, it will automatically interpolate (blend) the `v_color` values from the three vertices across the surface of the triangle, creating a smooth gradient.

### B. What is the final output?

The fragment shader must output a single `vec4` representing the Red, Green, Blue, and Alpha (transparency) of the pixel. We'll use the interpolated `v_color` for the RGB channels and set the alpha to 1.0 (fully opaque).

This is the complete **Fragment Shader**:

```glsl
#version 300 es
precision highp float;

in vec3 v_color;

// The final output color of the pixel
out vec4 fragColor;

void main() {
    fragColor = vec4(v_color, 1.0);
}
```

---

## Step 4: The JavaScript - Providing the Inputs

Now, we connect our data to the shaders using the `glsl.draw()` call.

### A. Prepare the Vertex Data

Create JavaScript arrays for the data each vertex needs, matching the `in` attributes from the vertex shader.

```typescript
// We have 3 vertices.
// Data for `a_position` (vec2)
const positions = [
     0.0,  0.5, // Vertex 1 (x, y)
    -0.5, -0.5, // Vertex 2 (x, y)
     0.5, -0.5  // Vertex 3 (x, y)
];

// Data for `a_color` (vec3)
const colors = [
    1.0, 0.0, 0.0, // Vertex 1 is red (r, g, b)
    0.0, 1.0, 0.0, // Vertex 2 is green (r, g, b)
    0.0, 0.0, 1.0  // Vertex 3 is blue (r, g, b)
];
```

### B. Create GPU Buffers

Upload this data to the GPU.

```typescript
const positionBuffer = glsl.createBuffer(positions);
const colorBuffer = glsl.createBuffer(colors);
```

### C. Configure the `draw` Call

Finally, map everything together in the `attributes` object. The keys of this object **must match the `in` attribute names in your vertex shader exactly.**

```typescript
function animate() {
    glsl.draw({
        vertexShader,   // Your vertex shader code as a string
        fragmentShader, // Your fragment shader code as a string
        attributes: {
            // Map shader attribute "a_position" to our buffer
            a_position: { buffer: positionBuffer, size: 2 }, // size = 2 because it's a vec2

            // Map shader attribute "a_color" to our buffer
            a_color: { buffer: colorBuffer, size: 3 } // size = 3 because it's a vec3
        },
        uniforms: {
            // The `u_time` uniform is provided by the framework automatically!
            // If we had other uniforms, we'd define them here.
            // e.g., u_mouse: [mouseX, mouseY]
        },
        textures: {}, // We don't use texture
        count: 3 // We are drawing 3 vertices
    });

    requestAnimationFrame(animate);
}

animate();
```

This completes the loop. By thinking about the data flow from concept -> vertex attributes -> vertex shader -> fragment shader -> JavaScript, you can construct even complex graphical effects.
