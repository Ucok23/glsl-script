#version 300 es
precision highp float;

in vec3 v_color;

out vec4 fragColor; // The final output color of the pixel

void main() {
    fragColor = vec4(v_color, 1.0f);
}