#version 300 es

uniform float u_time; // Global time variable

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
  gl_Position = vec4(rotatedPosition, 0.0f, 1.0f);

  v_color = a_color;
}