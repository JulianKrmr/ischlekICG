import {
  GroupNode,
  SphereNode,
  AABoxNode,
  TextureBoxNode,
  PyramidNode,
  CustomShapeNode,
  CameraNode,
  LightNode,
  TextureVideoBoxNode,
  TextureTextBoxNode,
  TexturePyramidNode,
} from "./nodes";

export default interface Visitor {
  visitGroupNode(node: GroupNode): void;
  visitSphereNode(node: SphereNode): void;
  visitAABoxNode(node: AABoxNode): void;
  visitPyramidNode(node: PyramidNode): void;
  visitTexturePyramidNode(node: TexturePyramidNode): void;
  visitTextureBoxNode(node: TextureBoxNode): void;
  visitTextureVideoBoxNode(node: TextureVideoBoxNode): void;
  visitTextureTextBoxNode(node: TextureTextBoxNode): void;
  visitCameraNode(): void;
  visitLightNode(): void;
  visitCustomShapeNode(node: CustomShapeNode): void;
}
