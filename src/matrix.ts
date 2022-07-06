import Vector from "./vector";

/**
 * Class representing a 4x4 Matrix
 */
export default class Matrix {
  /**
   * Data representing the matrix values
   */
  data: Float32Array;

  /**
   * Constructor of the matrix. Expects an array in row-major layout. Saves the data as column major internally.
   * @param mat Matrix values row major
   */
  constructor(mat: Array<number>) {
    this.data = new Float32Array(16);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.data[row * 4 + col] = mat[col * 4 + row];
      }
    }
  }

  /**
   * Returns the value of the matrix at position row, col
   * @param row The value's row
   * @param col The value's column
   * @return The requested value
   */
  getVal(row: number, col: number): number {
    return this.data[col * 4 + row];
  }

  /**
   * Sets the value of the matrix at position row, col
   * @param row The value's row
   * @param val The value to set to
   * @param col The value's column
   */
  setVal(row: number, col: number, val: number) {
    this.data[col * 4 + row] = val;
  }

  /**
   * Returns a matrix that represents a translation
   * @param translation The translation vector that shall be expressed by the matrix
   * @return The resulting translation matrix
   */
  //identity methode verwenden
  static translation(translation: Vector): Matrix {
    let newMatrix = this.identity();
    newMatrix.data[3] = translation.x;
    return newMatrix;
  }

  /**
   * Returns a matrix that represents a rotation. The rotation axis is either the x, y or z axis (either x, y, z is 1).
   * @param axis The axis to rotate around
   * @param angle The angle to rotate
   * @return The resulting rotation matrix
   */
  static rotation(axis: Vector, angle: number): Matrix {
    let newMatrix = this.identity();
    for (let row = 0; row < 4; row++) {
      let cos = Math.cos(angle);
      let sin = Math.sin(angle);

      if (axis.x == 1) {
        newMatrix.data[10] = cos;
        newMatrix.data[6] = -1 * sin;
        newMatrix.data[9] = sin;
        newMatrix.data[5] = cos;
      } else if (axis.y == 1) {
        newMatrix.data[0] = cos;
        newMatrix.data[2] = sin;
        newMatrix.data[8] = -1 * sin;
        newMatrix.data[10] = cos;
      } else if (axis.z == 1) {
        newMatrix.data[0] = cos;
        newMatrix.data[1] = -1 * sin;
        newMatrix.data[4] = sin;
        newMatrix.data[5] = cos;
      }
    }
    return newMatrix;
  }

  /**
   * Returns a matrix that represents a scaling
   * @param scale The amount to scale in each direction
   * @return The resulting scaling matrix
   */
  static scaling(scale: Vector): Matrix {
    const scalingVector = scale.data;
    return new Matrix([
      scalingVector[0],
      0,
      0,
      0,
      0,
      scalingVector[1],
      0,
      0,
      0,
      0,
      scalingVector[2],
      0,
      0,
      0,
      0,
      1,
    ]);
  }

  /**
   * Constructs a lookat matrix
   * @param eye The position of the viewer
   * @param center The position to look at
   * @param up The up direction
   * @return The resulting lookat matrix
   */
  static lookat(eye: Vector, center: Vector, up: Vector): Matrix {
    const f = center.sub(eye).normalize();
    const s = f.cross(up).normalize();
    const u = s.cross(f).normalize();
    const m = new Matrix([
      s.x,
      u.x,
      -f.x,
      0,
      s.y,
      u.y,
      -f.y,
      0,
      s.z,
      u.z,
      -f.z,
      0,
      0,
      0,
      0,
      1,
    ]);
    return m;
  }

  // /**
  //  * Constructs a new matrix that represents a projection normalisation transformation
  //  * @param left Camera-space left value of lower near point
  //  * @param right Camera-space right value of upper right far point
  //  * @param bottom Camera-space bottom value of lower lower near point
  //  * @param top Camera-space top value of upper right far point
  //  * @param near Camera-space near value of lower lower near point
  //  * @param far Camera-space far value of upper right far point
  //  * @return The rotation matrix
  //  */
  static frustum(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
  ): Matrix {
    return null;
  }

  /**
   * Constructs a new matrix that represents a projection normalisation transformation.
   * @param fovy Field of view in y-direction
   * @param aspect Aspect ratio between width and height
   * @param near Camera-space distance to near plane
   * @param far Camera-space distance to far plane
   * @return The resulting matrix
   */
  static perspective(
    fovy: number,
    aspect: number,
    near: number,
    far: number
  ): Matrix {
    return null;
  }

  /**
   * Returns the identity matrix
   * @return A new identity matrix
   */
  static identity(): Matrix {
    return new Matrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /**
   * Matrix multiplication
   * @param other The matrix to multiply with
   * @return The result of the multiplication this*other
   */
  mul(other: Matrix): Matrix {
    let NewData = new Array(16);

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        let sum: number = 0;
        for (let i = 0; i < 4; i++) {
          sum += this.data[row * 4 + i] * other.data[i * 4 + col];
        }
        NewData[col * 4 + row] = sum;
      }
    }
    return new Matrix(NewData);
  }

  /**
   * Matrix-vector multiplication
   * @param other The vector to multiply with
   * @return The result of the multiplication this*other
   */
  mulVec(other: Vector): Vector {
    let newVector: Vector = new Vector(0, 0, 0, 0);

    //iteriert über die newMatrix
    for (let row = 0; row < 4; row++) {
      let result: number = 0;
      for (let col = 0; col < 4; col++) {
        //führt immer die vier benötigten rechenschritte durch
        result += this.data[row * 4 + col] * other.data[col];
      }
      newVector.data[row] = result;
    }
    return newVector;
  }

  /**
   * Returns the transpose of this matrix
   * @return A new matrix that is the transposed of this
   */
  transpose(): Matrix {
    return null;
  }

  /**
   * Debug print to console
   */
  print() {
    for (let row = 0; row < 4; row++) {
      console.log(
        "> " +
          this.getVal(row, 0) +
          "\t" +
          this.getVal(row, 1) +
          "\t" +
          this.getVal(row, 2) +
          "\t" +
          this.getVal(row, 3)
      );
    }
  }
}