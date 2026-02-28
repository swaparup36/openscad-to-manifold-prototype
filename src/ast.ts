export type Node = CubeNode | SphereNode | TranslateNode;

export interface CubeNode {
  type: "cube";
  size: number;
}

export interface SphereNode {
  type: "sphere";
  radius: number;
}

export interface TranslateNode {
  type: "translate";
  vector: number[];
  child: Node;
}