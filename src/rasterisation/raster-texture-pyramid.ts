import Intersection from "../math/intersection";
import Plane from "../math/plane";
import Ray from "../math/ray";
import Vector from "../math/vector";
import Shader from "../shader/shader";

/**
 * A class creating buffers for an axis aligned pyramid to render it with WebGL
 */
export default class RasterTexturePyramid {
  /**
   * The buffer containing the pyramids vertices
   */
  vertexBuffer: WebGLBuffer;
  /**
   * The indices describing which vertices form a triangle
   */
  indexBuffer: WebGLBuffer;

  texBuffer: WebGLBuffer
  texCoords: WebGLBuffer
  normalMapBuffer: WebGLBuffer
  tangents: Array<number>;
  bitangents: Array<number>;
  tangentBuffer: WebGLBuffer;
  bitangentBuffer: WebGLBuffer;

  normalBuffer: WebGLBuffer;
  /**
   * The amount of indices
   */
  vertices: Array<number>;
  indices: Array<number>;
  normals: Array<number>;

  constructor(
    private gl: WebGL2RenderingContext,
    centerPoint: Vector,
    texture: string,
    normalMap?: string
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

    let pyramidTexture = gl.createTexture();
    const pyramidImg = new Image();
    pyramidImg.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, pyramidTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pyramidImg
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    pyramidImg.src = texture;
    this.texBuffer = pyramidTexture;

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
     this.calculateTangentsAndBitangents(this.vertices, uv);
 
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


    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    const normalLocation = shader.getAttributeLocation("a_normal");
    this.gl.enableVertexAttribArray(normalLocation);
    this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

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

    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.indices.length,
      this.gl.UNSIGNED_SHORT,
      0
    );

    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(normalLocation);
    this.gl.disableVertexAttribArray(texCoordLocation);
    this.gl.disableVertexAttribArray(tangentLocation);
    this.gl.disableVertexAttribArray(bitangentLocation);
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

  calculateTangentsAndBitangents(vertices: Array<number>, uv: Array<number>) {
    /*
    the loop is iterating over 6 faces of a mesh (assuming the mesh is a cube or a similar object), and for each face, 
    it calculates tangents and bitangents for each of the three vertices.
    */
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

      // calculate for each of the 3 vertices
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
