import Intersection from "../math/intersection";
import Plane from "../math/plane";
import Ray from "../math/ray";
import Vector from "../math/vector";
import Shader from "../shader/shader";

/**
 * A class creating buffers for an axis aligned pyramid to render it with WebGL
 */
export default class RasterPyramid {
  /**
   * The buffer containing the pyramids vertices
   */
  vertexBuffer: WebGLBuffer;
  /**
   * The indices describing which vertices form a triangle
   */
  indexBuffer: WebGLBuffer;

  private colorBuffer: WebGLBuffer;
  /**
   * The amount of indices
   */
  elements: number;

  vertices: Array<number>;
  indices: Array<number>;

  constructor(
    private gl: WebGL2RenderingContext,
    color: Vector, //muss vermutlich ein array werden
    point1: Vector,
    point2: Vector,
    point3: Vector,
    point4: Vector
  ) {
    this.gl = gl;
    const p1 = point1;
    const p2 = point2;
    const p3 = point3;
    const p4 = point4;

    //alle eckpunkte
    let vertices = [
      p1.x,
      p1.y,
      p1.z,
      p2.x,
      p2.y,
      p2.z,
      p3.x,
      p3.y,
      p3.z,
      p4.x,
      p4.y,
      p4.z,
    ];
    this.vertices = vertices;

    //alle dreiecke
    let indices = [0, 1, 2, 0, 2, 3, 0, 1, 3, 1, 2, 3];
    this.indices = indices;

    let colors = [];
    for (let i = 0; i < vertices.length / 3; i++) {
      colors.push(color.r, color.g, color.b);
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.vertexBuffer = vertexBuffer;

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );
    this.indexBuffer = indexBuffer;

    this.elements = indices.length;

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    this.colorBuffer = colorBuffer;
  }

  /**
   * Renders the pyramid
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

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.elements,
      this.gl.UNSIGNED_SHORT,
      0
    );

    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(colorLocation);
  }

  intersect(ray: Ray): Intersection | null {
    let intersectionMin = null;
    let intersectionTMin = Infinity;

    //iterate over all triangles of the pyramid
    for (let i = 0; i < this.indices.length; i += 3) {
      //get the vertices of the triangle
      const a = new Vector(
        this.vertices[this.indices[i] * 3],
        this.vertices[this.indices[i] * 3 + 1],
        this.vertices[this.indices[i] * 3 + 2],
        0
      );
      const b = new Vector(
        this.vertices[this.indices[i + 1] * 3],
        this.vertices[this.indices[i + 1] * 3 + 1],
        this.vertices[this.indices[i + 1] * 3 + 2],
        0
      );
      const c = new Vector(
        this.vertices[this.indices[i + 2] * 3],
        this.vertices[this.indices[i + 2] * 3 + 1],
        this.vertices[this.indices[i + 2] * 3 + 2],
        0
      );

      //create a plane from the 3 vertices of the pyramid
      const plane = new Plane(a, b, c);
      //calculate the intersection of the ray with the plane
      const intersection = plane.intersect(ray);

      const vertices = [a, b, c];
      // if the intersection is not null and is inside the triangle, return it
      if (
        intersection &&
        plane.isInside(vertices, intersection.point) &&
        intersection.t < intersectionTMin
      ) {
        intersectionMin = intersection;
        intersectionTMin = intersection.t;
      }
    }
    return intersectionMin;
  }
}
