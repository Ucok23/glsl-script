// main.ts
import { GLSL } from '../src/glsl';
import vertexShader from './example-vertex.vert?raw'
import fragmentShader from './example-fragment.frag?raw'

const canvas = document.getElementById('gl-canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const glsl = new GLSL(canvas);

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