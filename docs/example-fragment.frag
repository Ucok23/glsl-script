#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 fragColor;
uniform float u_time;

void main() {
    // Create a color based on the normalized coordinates and time
    float r = 0.5f + 0.5f * cos(u_time + v_texCoord.x * 5.0f);
    float g = 0.5f + 0.5f * sin(u_time + v_texCoord.y * 5.0f);
    float b = 0.5f + 0.5f * cos(u_time);

    // Assign the final color to the output
    fragColor = vec4(r, g, 0.8f, 1.0f);
}