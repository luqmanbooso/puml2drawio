import * as dagrePkg from 'dagre';
import { ParsedGraph } from '../parser/parsePuml';

const dagre = (dagrePkg as any).default || dagrePkg;

export interface PositionedNode {
  id: string;
  label: string;
  type?: string;
  parentId?: string;
  isContainer?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionedEdge {
  source: string;
  target: string;
  label?: string;
  points?: { x: number; y: number }[];
}

export interface PositionedGraph {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  width: number;
  height: number;
}

export interface LayoutOptions {
  rankdir?: 'TB' | 'LR' | 'BT' | 'RL';
  nodesep?: number;
  ranksep?: number;
  nodeWidth?: number;
  nodeHeight?: number;
}

export function calculateLayout(
  parsedGraph: ParsedGraph,
  options: LayoutOptions = {}
): PositionedGraph {
  // Enable compound graph mode for Dagre
  const g = new dagre.graphlib.Graph({ compound: true });

  g.setGraph({
  rankdir: options.rankdir || 'TB',
  nodesep: 80, // Increased horizontal separation between siblings
  ranksep: 90, // Increased vertical separation
  marginx: 40,
  marginy: 40,
});

  g.setDefaultEdgeLabel(() => ({}));

  const baseWidth = options.nodeWidth || 140;
  const baseHeight = options.nodeHeight || 60;

  // 1. Register nodes and containers
  for (const node of parsedGraph.nodes) {
    if (node.isContainer) {
      g.setNode(node.id, {
        label: node.label,
        paddingX: 30,
        paddingY: 45, // Top padding for title header
      });
    } else {
      const labelLen = node.label.length;
      const nodeType = (node.type || '').toLowerCase();

      let width = Math.max(baseWidth, labelLen * 10 + 20);
      let height = baseHeight;

      if (nodeType === 'actor' || nodeType === 'person') {
        width = 50;
        height = 75;
      } else if (nodeType === 'database' || nodeType === 'storage') {
        width = 110;
        height = 70;
      } else if (nodeType === 'folder') {
        width = 130;
        height = 70;
      }

      g.setNode(node.id, { label: node.label, width, height });
    }

    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  }

  // 2. Register edges
  for (const edge of parsedGraph.edges) {
    g.setEdge(edge.source, edge.target, { label: edge.label });
  }

  // 3. Compute layout
  dagre.layout(g);

  // 4. Calculate Absolute Positions
  const absPosMap = new Map<string, { x: number; y: number; width: number; height: number }>();

  for (const node of parsedGraph.nodes) {
    const dNode = g.node(node.id);
    if (!dNode) continue;
    const w = Math.round(dNode.width);
    const h = Math.round(dNode.height);
    const absX = Math.round(dNode.x - w / 2);
    const absY = Math.round(dNode.y - h / 2);

    absPosMap.set(node.id, { x: absX, y: absY, width: w, height: h });
  }

  // 5. Convert Absolute -> Relative Coordinates for Children
  const positionedNodes: PositionedNode[] = parsedGraph.nodes.map((node) => {
    const absPos = absPosMap.get(node.id)!;
    let relX = absPos.x;
    let relY = absPos.y;

    if (node.parentId && absPosMap.has(node.parentId)) {
      const parentAbs = absPosMap.get(node.parentId)!;
      relX = absPos.x - parentAbs.x;
      relY = absPos.y - parentAbs.y;
    }

    return {
      id: node.id,
      label: node.label,
      type: node.type,
      parentId: node.parentId,
      isContainer: node.isContainer,
      x: relX,
      y: relY,
      width: absPos.width,
      height: absPos.height,
    };
  });

  const positionedEdges: PositionedEdge[] = parsedGraph.edges.map((edge) => {
    const dEdge = g.edge(edge.source, edge.target);
    return {
      source: edge.source,
      target: edge.target,
      label: edge.label,
      points: dEdge ? dEdge.points || [] : [],
    };
  });

  const graphMeta = g.graph();

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    width: graphMeta.width || 0,
    height: graphMeta.height || 0,
  };
}