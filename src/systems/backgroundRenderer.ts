import { createShader, createProgram } from "./webglUtils";

// Vertex shader for fullscreen quad with tiling
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  uniform vec2 u_tileRepeat;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = (vec2(a_position.x, -a_position.y) * 0.5 + 0.5) * u_tileRepeat;
  }
`;

// Fragment shader with fract() for NPOT texture tiling
const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_texture;
  
  void main() {
    gl_FragColor = texture2D(u_texture, fract(v_texCoord));
  }
`;

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
  private tileRepeatX: number = 1;
  private tileRepeatY: number = 1;
  private imageDimensions: { width: number; height: number } | null = null;

  constructor(
    gl: WebGLRenderingContext,
    private canvasWidth: number,
    private canvasHeight: number,
  ) {
    this.gl = gl;

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
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    // Load the tile texture
    this.loadTileTexture("/tile.png");
  }

  private loadTileTexture(url: string): void {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      console.error("Failed to create texture");
      return;
    }

    this.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Placeholder pixel while loading
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([64, 64, 64, 255]),
    );

    // Load image
    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );

      // Use CLAMP_TO_EDGE for WebGL 1.0 compatibility (tiling via fract() in shader)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Store dimensions and calculate tile repeat
      this.imageDimensions = { width: image.width, height: image.height };
      this.tileRepeatX = this.canvasWidth / image.width;
      this.tileRepeatY = this.canvasHeight / image.height;
    };
    image.onerror = () => console.error("Failed to load tile image:", url);
    image.src = url;
  }

  public updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    if (this.imageDimensions) {
      this.tileRepeatX = width / this.imageDimensions.width;
      this.tileRepeatY = height / this.imageDimensions.height;
    }
  }

  public render(): void {
    if (!this.texture) return;

    const gl = this.gl;
    gl.useProgram(this.program);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.locations.texture, 0);

    // Set tile repeat uniform
    gl.uniform2f(this.locations.tileRepeat, this.tileRepeatX, this.tileRepeatY);

    // Bind quad buffer and draw
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.enableVertexAttribArray(this.locations.position);
    gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(this.locations.position);
  }
}
