export type NodeType =
  | 'node' | 'actor' | 'database' | 'queue' | 'cloud'
  | 'hexagon' | 'folder' | 'class' | 'enum' | 'usecase' | 'package';

export interface ParsedNode {
  id: string;
  label: string;
  type: NodeType;
  parentId?: string;
  attributes?: string[];
  methods?: string[];
  members?: string[];
}

export interface ParsedEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relType?: string;
  fromCardinality?: string;
  toCardinality?: string;
}

export interface ParsedGraph {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  containers: ParsedNode[];
}