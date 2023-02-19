import {
  GroupNode,
  SphereNode,
  AABoxNode,
  TextureBoxNode,
  PyramidNode,
  CustomShapeNode,
} from "./nodes";

export default interface Visitor {
  visitGroupNode(node: GroupNode): void;
  visitSphereNode(node: SphereNode): void;
  visitAABoxNode(node: AABoxNode): void;
  visitPyramidNode(node: PyramidNode): void;
  visitTextureBoxNode(node: TextureBoxNode): void;
  visitCustomShapeNode(node: CustomShapeNode): void;
}
