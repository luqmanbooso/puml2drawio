export type NodeType =
  | 'class'
  | 'enum'
  | 'entity'
  | 'actor'
  | 'usecase'
  | 'database'
  | 'component'
  | 'node'
  | 'cloud'
  | 'folder'
  | 'state'
  | 'start'
  | 'end'
  | 'decision'
  | 'package'
  | 'rectangle'
  | 'participant'
  | 'choice'
  | 'default';

export interface ParsedNode {
  id: string;
  label: string;
  type: NodeType;
  attributes?: string[];
  methods?: string[];
  members?: string[];
  parentId?: string;
  regionIndex?: number;
  regionCount?: number;
  regionDividers?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ParsedEdge {
  id: string;
  source: string;
  target: string;
  relType?: string;
  fromCardinality?: string;
  toCardinality?: string;
  label?: string;
  yPosition?: number;
}

export interface SequenceActivation {
  participantId: string;
  startY: number;
  endY?: number;
}

export interface SequenceGroup {
  id: string;
  type: 'alt' | 'opt' | 'loop' | 'par' | 'group';
  label: string;
  startY: number;
  endY?: number;
  dividers?: { y: number; label: string }[];
}

export interface SequenceNote {
  id: string;
  participantId: string;
  position: 'left' | 'right' | 'over';
  text: string;
  yPosition?: number;
}

export interface ParsedGraph {
  diagramType: 'general' | 'sequence';
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  containers?: ParsedNode[];
  activations?: SequenceActivation[];
  groups?: SequenceGroup[];
  notes?: SequenceNote[];
  sequenceEvents?: SequenceEvent[];
}

export type SequenceEventType = 'message' | 'activate' | 'deactivate' | 'groupStart' | 'groupElse' | 'groupEnd' | 'note';

export interface SequenceEvent {
  type: SequenceEventType;
  data: any;
}