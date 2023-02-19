import Vector from "../math/vector";
import Shader from "../shader/shader";

/**
 * A class creating buffers for an axis aligned box to render it with WebGL
 */
export default class RasterBox {
  /**
   * The buffer containing the box's vertices
   */
  vertexBuffer: WebGLBuffer;

  normalBuffer: WebGLBuffer;
  /**
   * The indices describing which vertices form a triangle
   */
  // TODO private variable for color buffer
  colorBuffer: WebGLBuffer;
  /**
   * The amount of indices
   */
  elements: number;
  vertices: Array<number>;

  /**
   * Creates all WebGL buffers for the box
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
   */
  constructor(
    private gl: WebGL2RenderingContext,
    minPoint: Vector,
    maxPoint: Vector,
    color?: Vector
  ) {
    this.gl = gl;
    const mi = minPoint;
    const ma = maxPoint;
    let vertices = [
      // front
      mi.x, mi.y, ma.z,
      ma.x, mi.y, ma.z,
      ma.x, ma.y, ma.z,
      ma.x, ma.y, ma.z,
      mi.x, ma.y, ma.z,
      mi.x, mi.y, ma.z,
      // back
      ma.x, mi.y, mi.z,
      mi.x, mi.y, mi.z,
      mi.x, ma.y, mi.z,
      mi.x, ma.y, mi.z,
      ma.x, ma.y, mi.z,
      ma.x, mi.y, mi.z,
      // right
      ma.x, mi.y, ma.z,
      ma.x, mi.y, mi.z,
      ma.x, ma.y, mi.z,
      ma.x, ma.y, mi.z,
      ma.x, ma.y, ma.z,
      ma.x, mi.y, ma.z,
      // top
      mi.x, ma.y, ma.z,
      ma.x, ma.y, ma.z,
      ma.x, ma.y, mi.z,
      ma.x, ma.y, mi.z,
      mi.x, ma.y, mi.z,
      mi.x, ma.y, ma.z,
      // left
      mi.x, mi.y, mi.z,
      mi.x, mi.y, ma.z,
      mi.x, ma.y, ma.z,
      mi.x, ma.y, ma.z,
      mi.x, ma.y, mi.z,
      mi.x, mi.y, mi.z,
      // bottom
      mi.x, mi.y, mi.z,
      ma.x, mi.y, mi.z,
      ma.x, mi.y, ma.z,
      ma.x, mi.y, ma.z,
      mi.x, mi.y, ma.z,
      mi.x, mi.y, mi.z
  ];

    this.vertices = vertices;



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

    const colors = this.createColors(color, new Vector(1.0, 0.0, 0.0, 0.0))

    this.elements = vertices.length / 3

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.vertexBuffer = vertexBuffer;

    const normalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(normals),
      this.gl.STATIC_DRAW
    );
    this.normalBuffer = normalBuffer;

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    this.colorBuffer = colorBuffer;
  }

  /**
   * Renders the box
   * @param shader The shader used to render
   */
  render(shader: Shader) {
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

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
    const colorLocation = shader.getAttributeLocation("a_color");
    this.gl.enableVertexAttribArray(colorLocation);
    this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    const normalLocation = shader.getAttributeLocation("a_normal");
    this.gl.enableVertexAttribArray(normalLocation);
    this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elements);

    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(colorLocation);
    this.gl.disableVertexAttribArray(normalLocation);
  }

  createColors(color1: Vector, color2: Vector){
    // add the colors for every vertex
    return [
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,

            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,

            color1.r, color1.g, color1.b, color1.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color1.r, color1.g, color1.b, color1.a,
            color2.r, color2.g, color2.b, color2.a,
            color2.r, color2.g, color2.b, color2.a,
    ]
  }
}
