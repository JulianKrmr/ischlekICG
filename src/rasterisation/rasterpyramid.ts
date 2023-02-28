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
  elements: number;

  vertices: Array<number>;
  indices: Array<number>;
  normals: Array<number>;

  constructor(
    private gl: WebGL2RenderingContext,
    centerPoint: Vector,
    color1: Vector,
    color2?: Vector
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

    let colors = [
      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
      color2.r,
      color2.g,
      color2.b,

      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
      color2.r,
      color2.g,
      color2.b,

      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
      color2.r,
      color2.g,
      color2.b,

      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
      color2.r,
      color2.g,
      color2.b,

      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
      color1.r,
      color1.g,
      color1.b,
    ];

    // let point0 = new Vector(mi.x, mi.y, ma.z, 1);
    // let point1 = new Vector(ma.x, mi.y, ma.z, 1);
    // let point2 = new Vector(ma.x, mi.y, mi.z, 1);
    // let point3 = new Vector(mi.x, mi.y, mi.z, 1);
    // let point4 = new Vector((mi.x + ma.x) / 2, ma.y, (mi.z + ma.z) / 2, 1);

    // let vec_0_1 = point1.sub(point0);
    // let vec_0_4 = point4.sub(point0);
    // let frontUp = vec_0_1.cross(vec_0_4).normalize();

    // let vec_3_0 = point0.sub(point3);
    // let vec_3_4 = point4.sub(point3);
    // let leftUp = vec_3_0.cross(vec_3_4).normalize();

    // let vec_2_3 = point3.sub(point2);
    // let vec_2_4 = point4.sub(point2);
    // let backUp = vec_2_3.cross(vec_2_4).normalize();

    // let vec_1_2 = point2.sub(point1);
    // let vec_1_4 = point4.sub(point1);
    // let rightUp = vec_1_2.cross(vec_1_4).normalize();

    // let normals = [
    //   // facing front and up
    //   frontUp.x,
    //   frontUp.y,
    //   frontUp.z,
    //   frontUp.x,
    //   frontUp.y,
    //   frontUp.z,
    //   frontUp.x,
    //   frontUp.y,
    //   frontUp.z,

    //   // facing back and up
    //   backUp.x,
    //   backUp.y,
    //   backUp.z,
    //   backUp.x,
    //   backUp.y,
    //   backUp.z,
    //   backUp.x,
    //   backUp.y,
    //   backUp.z,

    //   rightUp.x,
    //   rightUp.y,
    //   rightUp.z, // right up
    //   rightUp.x,
    //   rightUp.y,
    //   rightUp.z, // right up
    //   rightUp.x,
    //   rightUp.y,
    //   rightUp.z, // right up

    //   leftUp.x,
    //   leftUp.y,
    //   leftUp.z,
    //   leftUp.x,
    //   leftUp.y,
    //   leftUp.z,
    //   leftUp.x,
    //   leftUp.y,
    //   leftUp.z,

    //   0,
    //   -1,
    //   0,
    //   0,
    //   -1,
    //   0,
    //   0,
    //   -1,
    //   0,
    //   0,
    //   -1,
    //   0,
    //   0,
    //   -1,
    //   0,
    //   0,
    //   -1,
    //   0,
    // ];

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
    this.elements = this.indices.length;

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
      this.elements,
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
