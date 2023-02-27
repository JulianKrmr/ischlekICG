import Vector from "../math/vector";
import Shader from "../shader/shader";

/**
 * A class creating buffers for a textured box to render it with WebGL
 * Source:
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Animating_textures_in_WebGL?retiredLocale=de
 */
export default class RasterVideoTextureBox {
  private video: HTMLVideoElement;
  private copyVideo: Boolean;
  /**
   * The buffer containing the box's vertices
   */
  vertexBuffer: WebGLBuffer;
  /**
   * The buffer containing the box's texture
   */
  texBuffer: WebGLBuffer;

  /**
   * The buffer containing the box's texture coordinates
   */
  texCoords: WebGLBuffer;
  normalBuffer: WebGLBuffer;

  normalMapBuffer: WebGLBuffer;

  tangents: Array<number>;
  bitangents: Array<number>;
  tangentBuffer: WebGLBuffer;
  bitangentBuffer: WebGLBuffer;
  /**
   * The amount of faces
   */
  elements: number;

  /**
   * Creates all WebGL buffers for the textured box
   *     6 ------- 7
   *    / |       / |
   *   3 ------- 2  |
   *   |  |      |  |
   *   |  5 -----|- 4
   *   | /       | /
   *   0 ------- 1
   *  looking in negative z axis direction
   * @param gl The canvas' context
   * @param minPoint The minimal x,y,z of the box
   * @param maxPoint The maximal x,y,z of the box
   * @param texture The URL to the image to be used as texture
   * @param normalMap The URL to the normal map texture
   */
  constructor(
    private gl: WebGL2RenderingContext,
    minPoint: Vector,
    maxPoint: Vector,
    texture: string,
    normalMap?: string
  ) {
    const mi = minPoint;
    const ma = maxPoint;
    let vertices = [
      // front
      mi.x,
      mi.y,
      ma.z,
      ma.x,
      mi.y,
      ma.z,
      ma.x,
      ma.y,
      ma.z,
      ma.x,
      ma.y,
      ma.z,
      mi.x,
      ma.y,
      ma.z,
      mi.x,
      mi.y,
      ma.z,
      // back
      ma.x,
      mi.y,
      mi.z,
      mi.x,
      mi.y,
      mi.z,
      mi.x,
      ma.y,
      mi.z,
      mi.x,
      ma.y,
      mi.z,
      ma.x,
      ma.y,
      mi.z,
      ma.x,
      mi.y,
      mi.z,
      // right
      ma.x,
      mi.y,
      ma.z,
      ma.x,
      mi.y,
      mi.z,
      ma.x,
      ma.y,
      mi.z,
      ma.x,
      ma.y,
      mi.z,
      ma.x,
      ma.y,
      ma.z,
      ma.x,
      mi.y,
      ma.z,
      // top
      mi.x,
      ma.y,
      ma.z,
      ma.x,
      ma.y,
      ma.z,
      ma.x,
      ma.y,
      mi.z,
      ma.x,
      ma.y,
      mi.z,
      mi.x,
      ma.y,
      mi.z,
      mi.x,
      ma.y,
      ma.z,
      // left
      mi.x,
      mi.y,
      mi.z,
      mi.x,
      mi.y,
      ma.z,
      mi.x,
      ma.y,
      ma.z,
      mi.x,
      ma.y,
      ma.z,
      mi.x,
      ma.y,
      mi.z,
      mi.x,
      mi.y,
      mi.z,
      // bottom
      mi.x,
      mi.y,
      mi.z,
      ma.x,
      mi.y,
      mi.z,
      ma.x,
      mi.y,
      ma.z,
      ma.x,
      mi.y,
      ma.z,
      mi.x,
      mi.y,
      ma.z,
      mi.x,
      mi.y,
      mi.z,
    ];

    let normals = [
      // Front
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,

      // Back
      0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0, -1.0,

      // Right
      1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,

      // Top
      0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,

      // Left
      -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
      0.0, -1.0, 0.0, 0.0,

      // Bottom
      0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
      0.0, 0.0, -1.0, 0.0,
    ];

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.vertexBuffer = vertexBuffer;
    this.elements = vertices.length / 3;

    const normalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(normals),
      this.gl.STATIC_DRAW
    );
    this.normalBuffer = normalBuffer;

    const normalTex = gl.createTexture();
    const normalImg = new Image();
    normalImg.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, normalTex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        normalImg
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    };
    normalImg.src = normalMap;
    this.normalMapBuffer = normalTex;

    let uv = [
      // front
      0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0,
      // back
      0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0,
      // right
      0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0,
      // top
      0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0,
      // left
      0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0,
      // bottom
      0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0,
    ];
    let uvBuffer = this.gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    this.texCoords = uvBuffer;

    // https://learnopengl.com/Advanced-Lighting/Normal-Mapping
    this.tangents = [];
    this.bitangents = [];
    this.calculateTangentsAndBitangents(vertices, uv);

    const tangentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tangentBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.tangents),
      gl.STATIC_DRAW
    );
    this.tangentBuffer = tangentBuffer;

    const bitangentBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bitangentBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.bitangents),
      gl.STATIC_DRAW
    );
    this.bitangentBuffer = bitangentBuffer;

    this.texBuffer = this.initTexture(gl);
    this.video = this.setupVideo(texture);
    this.copyVideo = false;
  }

  setupVideo(url: string) {
    const video = document.createElement("video");

    let playing = false;
    let timeupdate = false;

    video.playsInline = true;
    video.muted = true;
    video.loop = true;
    video.addEventListener(
      "playing",
      () => {
        playing = true;
        this.checkReady(playing, timeupdate);
      },
      true
    );
    video.addEventListener(
      "timeupdate",
      () => {
        timeupdate = true;
        this.checkReady(playing, timeupdate);
      },
      true
    );

    video.src = url;
    video.play();

    return video;
  }

  private checkReady(playing: boolean, timeupdate: boolean) {
    if (playing && timeupdate) {
      this.copyVideo = true;
    }
  }

  private initTexture(gl: WebGL2RenderingContext) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because video havs to be download over the internet
    // they might take a moment until it's ready so
    // put a single pixel in the texture so we can
    // use it immediately.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );

    // Turn off mips and set wrapping to clamp to edge so it
    // will work regardless of the dimensions of the video.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return texture;
  }
  private updateTexture(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    video: HTMLVideoElement
  ) {
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      video
    );
  }

  /**
   * Renders the textured box
   * @param {Shader} shader - The shader used to render
   */
  render(shader: Shader) {
    if (this.copyVideo) {
      this.updateTexture(this.gl, this.texBuffer, this.video);
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const positionLocation = shader.getAttributeLocation("a_position");
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    const normalLocation = shader.getAttributeLocation("a_normal");
    this.gl.enableVertexAttribArray(normalLocation);
    this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoords);
    const texCoordLocation = shader.getAttributeLocation("a_texCoord");
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(
      texCoordLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tangentBuffer);
    const tangentLocation = shader.getAttributeLocation("a_tangent");
    this.gl.enableVertexAttribArray(tangentLocation);
    this.gl.vertexAttribPointer(tangentLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bitangentBuffer);
    const bitangentLocation = shader.getAttributeLocation("a_bitangent");
    this.gl.enableVertexAttribArray(bitangentLocation);
    this.gl.vertexAttribPointer(
      bitangentLocation,
      3,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texBuffer);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.normalMapBuffer);
    shader.getUniformInt("sampler").set(0);
    shader.getUniformInt("normalSampler").set(1);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elements);

    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(texCoordLocation);
    this.gl.disableVertexAttribArray(normalLocation);
    this.gl.disableVertexAttribArray(tangentLocation);
    this.gl.disableVertexAttribArray(bitangentLocation);
  }
  // https://learnopengl.com/Advanced-Lighting/Normal-Mapping
  calculateTangentsAndBitangents(vertices: Array<number>, uv: Array<number>) {
    for (let i = 0; i < 6; i++) {
      let pos1 = new Vector(
        vertices[0 + i * 18],
        vertices[1 + i * 18],
        vertices[2 + i * 18],
        1
      );
      let pos2 = new Vector(
        vertices[3 + i * 18],
        vertices[4 + i * 18],
        vertices[5 + i * 18],
        1
      );
      let pos3 = new Vector(
        vertices[6 + i * 18],
        vertices[7 + i * 18],
        vertices[8 + i * 18],
        1
      );
      let pos4 = new Vector(
        vertices[12 + i * 18],
        vertices[13 + i * 18],
        vertices[14 + i * 18],
        1
      );

      let uv1 = new Vector(uv[0 + i * 12], uv[1 + i * 12], 0, 1);
      let uv2 = new Vector(uv[2 + i * 12], uv[3 + i * 12], 0, 1);
      let uv3 = new Vector(uv[4 + i * 12], uv[5 + i * 12], 0, 1);
      let uv4 = new Vector(uv[8 + i * 12], uv[9 + i * 12], 0, 1);

      let edge1 = pos2.sub(pos1);
      let edge2 = pos3.sub(pos1);
      let edge3 = pos3.sub(pos1);
      let edge4 = pos4.sub(pos3);
      let deltaUV1 = uv2.sub(uv1);
      let deltaUV2 = uv3.sub(uv1);
      let deltaUV3 = uv3.sub(uv1);
      let deltaUV4 = uv4.sub(uv3);

      let f = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);

      let tangent1x = f * (deltaUV2.y * edge1.x - deltaUV1.y * edge2.x);
      let tangent1y = f * (deltaUV2.y * edge1.y - deltaUV1.y * edge2.y);
      let tangent1z = f * (deltaUV2.y * edge1.z - deltaUV1.y * edge2.z);

      let tangent2x = f * (deltaUV4.y * edge3.x - deltaUV3.y * edge4.x);
      let tangent2y = f * (deltaUV4.y * edge3.y - deltaUV3.y * edge4.y);
      let tangent2z = f * (deltaUV4.y * edge3.z - deltaUV3.y * edge4.z);

      let bitangent1x = f * (-deltaUV2.x * edge1.x + deltaUV1.x * edge2.x);
      let bitangent1y = f * (-deltaUV2.x * edge1.y + deltaUV1.x * edge2.y);
      let bitangent1z = f * (-deltaUV2.x * edge1.z + deltaUV1.x * edge2.z);

      let bitangent2x = f * (-deltaUV4.x * edge3.x + deltaUV3.x * edge4.x);
      let bitangent2y = f * (-deltaUV4.x * edge3.y + deltaUV3.x * edge4.y);
      let bitangent2z = f * (-deltaUV4.x * edge3.z + deltaUV3.x * edge4.z);

      for (let j = 0; j < 3; j++) {
        this.tangents[0 + i * 18 + j * 3] = tangent1x;
        this.tangents[1 + i * 18 + j * 3] = tangent1y;
        this.tangents[2 + i * 18 + j * 3] = tangent1z;

        this.bitangents[0 + i * 18 + j * 3] = bitangent1x;
        this.bitangents[1 + i * 18 + j * 3] = bitangent1y;
        this.bitangents[2 + i * 18 + j * 3] = bitangent1z;

        this.tangents[9 + i * 18 + j * 3] = tangent2x;
        this.tangents[10 + i * 18 + j * 3] = tangent2y;
        this.tangents[11 + i * 18 + j * 3] = tangent2z;

        this.bitangents[9 + i * 18 + j * 3] = bitangent2x;
        this.bitangents[10 + i * 18 + j * 3] = bitangent2y;
        this.bitangents[11 + i * 18 + j * 3] = bitangent2z;
      }
    }
  }
}
