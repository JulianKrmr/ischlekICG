import Intersection from "../math/intersection";
import Plane from "../math/plane";
import Ray from "../math/ray";
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
      // 6*6 = 36 vertices because every side needs 6 vertices (2 triangles)

      // front 012 023
      mi.x,
      mi.y,
      ma.z, // 0
      ma.x,
      mi.y,
      ma.z, // 1
      ma.x,
      ma.y,
      ma.z, // 2
      mi.x,
      mi.y,
      ma.z, // 0
      ma.x,
      ma.y,
      ma.z, // 2
      mi.x,
      ma.y,
      ma.z, // 3

      // back 456 467
      ma.x,
      mi.y,
      mi.z,
      mi.x,
      mi.y,
      mi.z,
      mi.x,
      ma.y,
      mi.z,
      ma.x,
      mi.y,
      mi.z,
      mi.x,
      ma.y,
      mi.z,
      ma.x,
      ma.y,
      mi.z,

      // right 147 172
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
      mi.y,
      ma.z,
      ma.x,
      ma.y,
      mi.z,
      ma.x,
      ma.y,
      ma.z,

      // bottom 541 510
      mi.x,
      mi.y,
      mi.z,
      ma.x,
      mi.y,
      mi.z,
      ma.x,
      mi.y,
      ma.z,
      mi.x,
      mi.y,
      mi.z,
      ma.x,
      mi.y,
      ma.z,
      mi.x,
      mi.y,
      ma.z,

      // top 327 375
      mi.x,
      ma.y,
      ma.z,
      ma.x,
      ma.y,
      ma.z,
      ma.x,
      ma.y,
      mi.z,
      mi.x,
      ma.y,
      ma.z,
      ma.x,
      ma.y,
      mi.z,
      mi.x,
      ma.y,
      mi.z,

      // left 503 536
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
      mi.y,
      mi.z,
      mi.x,
      ma.y,
      ma.z,
      mi.x,
      ma.y,
      mi.z,
    ];
    this.vertices = vertices;

    let colors = this.createColorArray(color);

    let normals = [
      // facing front
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,

      // facing back
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,

      // facing right
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,

      // facing bottom
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,

      // facing top
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,

      // facing left
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
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

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.normalBuffer);
    const normalLocation = shader.getAttributeLocation("a_normal");
    this.gl.enableVertexAttribArray(normalLocation);
    this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elements);

    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(colorLocation);
    this.gl.disableVertexAttribArray(normalLocation);
  }

  createColorArray(color: Vector) {

    return [
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,

      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,

      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,

      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,

      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,

      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
      color.r,
      color.g,
      color.b,
      color.a,
    ];
  }
}
