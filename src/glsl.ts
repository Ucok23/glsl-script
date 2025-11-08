/**
 * Defines the possible types for a non-texture uniform.
 * Supports single floats, vectors (up to 4 components), and matrices (3x3, 4x4).
 */
export type UniformValue = number | number[] | Float32Array;

// A simple type to define a vertex attribute buffer
export interface AttributeInfo {
  buffer: WebGLBuffer;
  size: number; // e.g., 3 for a vec3 position
  // You could add more here like 'type', 'normalized', 'stride', 'offset' for advanced use
}

export interface GraphicsProgramConfig {
  /** The GLSL code for the vertex shader. */
  vertexShader: string;
  /** The GLSL code for the fragment shader. */
  fragmentShader: string;
  /** A dictionary mapping attribute names in the vertex shader to their buffer info. */
  attributes: { [name: string]: AttributeInfo };
  /** A dictionary mapping uniform names to their values (matrices, vectors, floats, etc.). */
  uniforms: { [name: string]: UniformValue };
  /** A dictionary mapping uniform names to their corresponding WebGLTexture inputs. */
  textures: { [name: string]: WebGLTexture };
  /** The number of vertices to draw. */
  count: number;
  /** The drawing primitive to use (e.g., 'TRIANGLES', 'LINES', 'POINTS'). Defaults to 'TRIANGLES'. */
  primitive?: 'POINTS' | 'LINES' | 'LINE_LOOP' | 'LINE_STRIP' | 'TRIANGLES' | 'TRIANGLE_STRIP' | 'TRIANGLE_FAN';
  /** The output framebuffer. If null, renders to the canvas. For post-processing. */
  output?: WebGLFramebuffer | null;
}


/**
 * A micro-framework for WebGL2 programming.
 * This class abstracts away the boilerplate of setting up shaders, framebuffers,
 * and uniforms, allowing you to focus on the GLSL shader logic.
 */
export class GLSL {
  public readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly programCache: Map<string, WebGLProgram> = new Map();
  private readonly startTime: number;

  /**
   * Creates an instance of the GLSL framework.
   * @param canvas The HTMLCanvasElement to use for the WebGL2 context.
   */
  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      throw new Error("WebGL2 is not supported by your browser.");
    }
    this.canvas = canvas;
    this.gl = gl;
    this.startTime = Date.now();
  }

  /**
   * Creates a WebGL buffer with the given data.
   * @param data The array of numbers to load into the buffer.
   * @returns The created WebGLBuffer.
   */
  public createBuffer(data: number[] | Float32Array): WebGLBuffer {
    const gl = this.gl;
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
  }

  /**
* Creates a WebGL texture.
* @param width The width of the texture.
* @param height The height of the texture.
* @param data Optional initial data for the texture. If a Float32Array is provided, a float texture will be created.
* @returns The created WebGLTexture.
*/
  public createTexture(width: number, height: number, data: Float32Array | Uint8Array | null = null): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set parameters for data textures: no interpolation, no wrapping.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    if (data instanceof Float32Array) {
      // RGBA32F is a 4-channel, 32-bit float texture format.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
    } else {
      // Default to a standard 8-bit RGBA texture.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }

    gl.bindTexture(gl.TEXTURE_2D, null); // Clean up
    return texture;
  }

  /**
   * Executes a WebGL draw call with the given configuration.
   * @param config The configuration object for the draw call.
   */
  public draw(config: GraphicsProgramConfig): void {
    const gl = this.gl;

    // 1. Get and cache the program from both shaders
    const program = this._getProgram(config.vertexShader, config.fragmentShader);
    gl.useProgram(program);

    // Combine user uniforms with common uniforms. User uniforms take precedence.
    const uniforms: { [name: string]: UniformValue } = {
      u_time: (Date.now() - this.startTime) / 1000.0,
      u_resolution: [this.canvas.width, this.canvas.height],
      ...config.uniforms,
    };

    // 2. Bind Attributes
    for (const name in config.attributes) {
      const info = config.attributes[name];
      const location = gl.getAttribLocation(program, name);
      if (location === -1) continue; // Attribute not used in shader

      gl.bindBuffer(gl.ARRAY_BUFFER, info.buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, info.size, gl.FLOAT, false, 0, 0);
    }

    // 3. Bind Uniforms and Textures
    let textureUnit = 0;
    for (const name in config.textures) {
      const texture = config.textures[name];
      const location = gl.getUniformLocation(program, name);
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(location, textureUnit);
      textureUnit++;
    }

    for (const name in uniforms) {
      const value = uniforms[name];
      const location = gl.getUniformLocation(program, name);
      if (location) {
        if (typeof value === 'number') {
          gl.uniform1f(location, value);
        } else if (Array.isArray(value) || value instanceof Float32Array) {
          switch (value.length) {
            case 2: gl.uniform2fv(location, value); break;
            case 3: gl.uniform3fv(location, value); break;
            case 4: gl.uniform4fv(location, value); break;
            case 9: gl.uniformMatrix3fv(location, false, value); break;
            case 16: gl.uniformMatrix4fv(location, false, value); break;
            default: console.warn(`Uniform '${name}' has an unsupported array length: ${value.length}`);
          }
        }
      }
    }

    // 4. Set Output Target
    gl.bindFramebuffer(gl.FRAMEBUFFER, config.output || null);
    // You might want to set the viewport here based on the output target's size

    // 5. Execute the Draw Call
    const primitive = gl[config.primitive || 'TRIANGLES'];
    gl.drawArrays(primitive, 0, config.count);

    // Cleanup could be added here: unbind buffers, disable vertex arrays etc.
  }

  /**
   * A convenience method to display a texture on the canvas.
   * @param texture The texture to display.
   */
  public display(texture: WebGLTexture): void {
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
      uniform sampler2D u_texture;
      void main() {
          fragColor = texture(u_texture, v_texCoord);
      }`;

    const quadBuffer = this.createBuffer([-1, -1, 1, -1, -1, 1, 1, 1]);

    this.draw({
      vertexShader,
      fragmentShader,
      attributes: {
        a_position: { buffer: quadBuffer, size: 2 }
      },
      textures: { u_texture: texture },
      uniforms: {},
      count: 4,
      primitive: 'TRIANGLE_STRIP',
      output: null, // Render to canvas
    });
  }

  /**
   * Reads the pixel data from a texture back to the CPU.
   * WARNING: This is a very slow operation as it stalls the GPU pipeline. Use it sparingly, primarily for debugging.
   * @param texture The texture to read from.
   * @param width The width of the texture.
   * @param height The height of the texture.
   * @returns A Float32Array containing the texture data.
   */
  public readData(texture: WebGLTexture, width: number, height: number): Float32Array {
    const gl = this.gl;
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer is not complete for reading data.");
    }

    const buffer = new Float32Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, buffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);

    return buffer;
  }

  /**
   * Compiles and links a WebGL program from user code, with caching.
   * @private
   */
  private _getProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const cacheKey = vertexSource + fragmentSource;
    if (this.programCache.has(cacheKey)) {
      return this.programCache.get(cacheKey)!;
    }

    const gl = this.gl;

    const vertexShader = this._createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this._createShader(gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = `Error linking program: ${gl.getProgramInfoLog(program)}`;
      gl.deleteProgram(program);
      throw new Error(error);
    }

    // Shaders are no longer needed after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    this.programCache.set(cacheKey, program);
    return program;
  }

  /**
   * Compiles a single shader.
   * @private
   */
  private _createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = `Error compiling shader: ${gl.getShaderInfoLog(shader)}`;
      gl.deleteShader(shader);
      throw new Error(error);
    }
    return shader;
  }
}