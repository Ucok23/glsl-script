// main.ts
import { GLSL } from '../src/glsl';
import vertexShader from './example-vertex.vert?raw'
import fragmentShader from './example-fragment.frag?raw'

const canvas = document.getElementById('gl-canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const glsl = new GLSL(canvas);

// We have 3 vertices.
// Data for `a_position` (vec2)
const positions = [
  0.0, 0.5, // Vertex 1 (x, y)
  -0.5, -0.5, // Vertex 2 (x, y)
  0.5, -0.5  // Vertex 3 (x, y)
];

// Data for `a_color` (vec3)
const colors = [
  1.0, 0.0, 0.0, // Vertex 1 is red (r, g, b)
  0.0, 1.0, 0.0, // Vertex 2 is green (r, g, b)
  0.0, 0.0, 1.0  // Vertex 3 is blue (r, g, b)
];

const positionBuffer = glsl.createBuffer(positions);
const colorBuffer = glsl.createBuffer(colors);

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

// Handle window resizing
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});