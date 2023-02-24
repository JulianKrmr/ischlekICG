import {
  GroupNode,
  SphereNode,
  AABoxNode,
  TextureBoxNode,
  PyramidNode,
  CustomShapeNode,
  CameraNode, LightNode,
} from "./nodes";

export default interface Visitor {
  visitGroupNode(node: GroupNode): void;
  visitSphereNode(node: SphereNode): void;
  visitAABoxNode(node: AABoxNode): void;
  visitPyramidNode(node: PyramidNode): void;
  visitTextureBoxNode(node: TextureBoxNode): void;
  visitCameraNode(node: CameraNode, active: boolean): void;
  visitLightNode(node: LightNode): void;
  visitCustomShapeNode(node: CustomShapeNode): void;
}
