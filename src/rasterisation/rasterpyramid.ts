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

  normalBuffer: WebGLBuffer;

  private colorBuffer: WebGLBuffer;
  /**
   * The amount of indices
   */
  vertices: Array<number>;
  indices: Array<number>;
  normals: Array<number>;

  constructor(
    private gl: WebGL2RenderingContext,
    centerPoint: Vector,
    color: Vector
  ) {
    let height = 1;
    let width = 0.5;

    this.gl = gl;

    this.vertices = [
      //Vorderseite links
      centerPoint.x - width,
      centerPoint.y,
      centerPoint.z + width,

      //Vorderseite rechts
      centerPoint.x + width,
      centerPoint.y,
      centerPoint.z + width,

      //Hinterseite rechts
      centerPoint.x + width,
      centerPoint.y,
      centerPoint.z - width,

      //Hinterseite links
      centerPoint.x - width,
      centerPoint.y,
      centerPoint.z - width,

      //Spitze
      centerPoint.x,
      centerPoint.y + height,
      centerPoint.z,
    ];

    this.indices = [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4, 3, 1, 0, 3, 2, 1];

    //Für jedes indice einen vector
    this.normals = [];

    //for each indice, take the 3 vertices, calulate 2 vectors from them (that span a plane),
    //cross product them, normalize the vector and push it to the normals array, resulting in the normal vector for each triangle
    for (let i = 0; i < this.indices.length; i += 3) {
      let p1 = new Vector(
        this.vertices[this.indices[i] * 3],
        this.vertices[this.indices[i] * 3 + 1],
        this.vertices[this.indices[i] * 3 + 2],
        1
      );
      let p2 = new Vector(
        this.vertices[this.indices[i + 1] * 3],
        this.vertices[this.indices[i + 1] * 3 + 1],
        this.vertices[this.indices[i + 1] * 3 + 2],
        1
      );
      let p3 = new Vector(
        this.vertices[this.indices[i + 2] * 3],
        this.vertices[this.indices[i + 2] * 3 + 1],
        this.vertices[this.indices[i + 2] * 3 + 2],
        1
      );

      let vec1 = p2.sub(p1); //Vector von p1 nach p2
      let vec2 = p3.sub(p1); //Vector von p1 nach p3
      let normalVector = vec1.cross(vec2).normalize(); //Normalenvektor

      this.normals.push(normalVector.x);
      this.normals.push(normalVector.y);
      this.normals.push(normalVector.z);
    }

    let colors = [];
    for (let i = 0; i < this.vertices.length / 3; i++) {
      colors.push(color.x);
      colors.push(color.y);
      colors.push(color.z);
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices),
      gl.STATIC_DRAW
    );
    this.vertexBuffer = vertexBuffer;

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.indices),
      gl.STATIC_DRAW
    );
    this.indexBuffer = indexBuffer;

    const normalBuffer = this.gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.normals),
      this.gl.STATIC_DRAW
    );
    this.normalBuffer = normalBuffer;

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

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    const normalLocation = shader.getAttributeLocation("a_normal");
    this.gl.enableVertexAttribArray(normalLocation);
    this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.indices.length,
      this.gl.UNSIGNED_SHORT,
      0
    );

    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(colorLocation);
    this.gl.disableVertexAttribArray(normalLocation);
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
