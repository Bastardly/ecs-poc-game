// Simple vertex shader for fullscreen quad
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  uniform vec2 u_tileRepeat;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    // Convert from clip space (-1 to 1) to texture space (0 to tileRepeat)
    // Flip Y because WebGL texture coords start at bottom-left
    v_texCoord = (vec2(a_position.x, -a_position.y) * 0.5 + 0.5) * u_tileRepeat;
  }
`;

// Simple fragment shader for textured quad
const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_texture;
  
  void main() {
    // Use fract() to enable tiling with NPOT textures in WebGL 1.0
    gl_FragColor = texture2D(u_texture, fract(v_texCoord));
  }
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export class BackgroundRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private locations: {
    position: number;
    texture: WebGLUniformLocation | null;
    tileRepeat: WebGLUniformLocation | null;
  };
  private quadBuffer: WebGLBuffer;
  private texture: WebGLTexture | null = null;
  private tileWidth: number = 1;
  private tileHeight: number = 1;
  private canvasWidth: number;
  private canvasHeight: number;
  private tileRepeatX: number = 1;
  private tileRepeatY: number = 1;
  private renderCount: number = 0;

  constructor(
    gl: WebGLRenderingContext,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    this.gl = gl;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Create shaders and program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    if (!vertexShader || !fragmentShader) {
      throw new Error("Failed to create background shaders");
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      throw new Error("Failed to create background program");
    }

    this.program = program;

    // Get attribute/uniform locations
    this.locations = {
      position: gl.getAttribLocation(program, "a_position"),
      texture: gl.getUniformLocation(program, "u_texture"),
      tileRepeat: gl.getUniformLocation(program, "u_tileRepeat"),
    };

    // Create fullscreen quad buffer
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const quadVertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // Load the tile texture
    this.loadTileTexture("/tile.png");
  }

  private loadTileTexture(url: string): void {
    const gl = this.gl;

    // Create texture
    const texture = gl.createTexture();
    if (!texture) {
      console.error("Failed to create texture");
      return;
    }

    this.texture = texture;

    // Create a 1x1 placeholder pixel
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const pixel = new Uint8Array([64, 64, 64, 255]); // Dark gray with full opacity
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixel,
    );

    // Load the actual image
    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // Use RGBA format for PNG images
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );

      // Check if texture is power-of-two
      const isPowerOf2 = (value: number) => (value & (value - 1)) === 0;
      const widthIsPOT = isPowerOf2(image.width);
      const heightIsPOT = isPowerOf2(image.height);

      if (widthIsPOT && heightIsPOT) {
        // Power-of-two texture: use REPEAT and generate mipmaps
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        // Non-power-of-two: use CLAMP_TO_EDGE (tiling handled in shader with fract())
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      }

      // Store tile dimensions
      this.tileWidth = image.width;
      this.tileHeight = image.height;

      // Recalculate tile repeat values
      this.updateTileRepeat();

      console.log(
        `✅ Background loaded: ${image.width}x${image.height}${!widthIsPOT || !heightIsPOT ? " (non-POT)" : ""}, repeat: ${this.tileRepeatX.toFixed(2)}x${this.tileRepeatY.toFixed(2)}`,
      );
    };
    image.onerror = () => {
      console.error("❌ Failed to load tile image:", url);
    };
    image.src = url;
  }

  private updateTileRepeat(): void {
    // Calculate how many times the tile should repeat to fill the canvas
    this.tileRepeatX = this.canvasWidth / this.tileWidth;
    this.tileRepeatY = this.canvasHeight / this.tileHeight;
  }

  public updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.updateTileRepeat();
  }

  public render(): void {
    if (!this.texture) {
      if (this.renderCount === 0) {
        console.warn("⚠️ Render called but texture not loaded yet");
      }
      this.renderCount++;
      return;
    }

    const gl = this.gl;

    // Log first successful render
    if (this.renderCount === 0) {
      console.log(
        `🎨 Rendering background: repeat ${this.tileRepeatX.toFixed(2)}x${this.tileRepeatY.toFixed(2)}`,
      );
    }
    this.renderCount++;

    // Use background program
    gl.useProgram(this.program);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.locations.texture, 0);

    // Set tile repeat uniform
    gl.uniform2f(this.locations.tileRepeat, this.tileRepeatX, this.tileRepeatY);

    // Bind quad buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Clean up state
    gl.disableVertexAttribArray(this.locations.position);
  }
}
