// main.ts
import { GLSL } from '../src/glsl';

const canvas = document.getElementById('gl-canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const glsl = new GLSL(canvas);

const vertexShader = `#version 300 es
  in vec2 a_position;
  out vec2 v_texCoord;
  void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
  }`;

const fragmentShader = `#version 300 es
  precision highp float;
  in vec2 v_texCoord;
  out vec4 fragColor;
  uniform float u_time;
  uniform vec2 u_resolution;

  void main() {
      // Create a color based on the normalized coordinates and time
      float r = 0.5 + 0.5 * cos(u_time + v_texCoord.x * 5.0);
      float g = 0.5 + 0.5 * sin(u_time + v_texCoord.y * 5.0);
      float b = 0.5 + 0.5 * cos(u_time);

      // Assign the final color to the output
      fragColor = vec4(r, g, 0.8, 1.0);
  }
`;

const quadBuffer = glsl.createBuffer([-1, -1, 1, -1, -1, 1, 1, 1]);

// Create an animation loop
function animate() {
  // Execute the shader program, rendering directly to the canvas
  glsl.draw({
    vertexShader,
    fragmentShader,
    attributes: {
      a_position: { buffer: quadBuffer, size: 2 }
    },
    textures: {},
    uniforms: {},
    count: 4,
    primitive: 'TRIANGLE_STRIP',
    output: null, // Render to the canvas
  });

  // Request the next frame
  requestAnimationFrame(animate);
}

// Start the animation
animate();

// Handle window resizing
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});