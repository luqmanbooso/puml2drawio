import * as dagrePkg from 'dagre';
import { ParsedGraph } from '../types';

const dagre = (dagrePkg as any).default || dagrePkg;

export function calculateLayout(graph: ParsedGraph) {
  const g = new dagre.graphlib.Graph({ compound: true });

  g.setGraph({
    rankdir: 'TB',
    nodesep: 70,
    ranksep: 80,
    marginx: 30,
    marginy: 30,
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Set Container Parent/Child Hierarchy
  graph.containers.forEach((c) => {
    g.setNode(c.id, { label: c.label, isContainer: true });
  });

  // Calculate Node Dynamic Sizes
  graph.nodes.forEach((node) => {
    let width = 120;
    let height = 70;

    if (node.type === 'class' || node.type === 'enum') {
      const lineCount =
        (node.attributes?.length || 0) +
        (node.methods?.length || 0) +
        (node.members?.length || 0);

      // Dynamic height based on lines
      height = Math.max(80, 45 + lineCount * 18);

      // Dynamic width based on longest line string
      const allLines = [
        node.label,
        ...(node.attributes || []),
        ...(node.methods || []),
        ...(node.members || []),
      ];
      const maxLen = Math.max(...allLines.map((l) => l.length));
      width = Math.max(140, maxLen * 8 + 20);
    } else if (node.type === 'actor') {
      width = 50;
      height = 75;
    } else if (node.type === 'database') {
      width = 110;
      height = 70;
    }

    g.setNode(node.id, {
      width,
      height,
      label: node.label,
      type: node.type,
      attributes: node.attributes,
      methods: node.methods,
      members: node.members,
      parentId: node.parentId,
    });

    if (node.parentId) {
      g.setParent(node.id, node.parentId);
    }
  });

  graph.edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target, {
      id: edge.id,
      label: edge.label,
      relType: edge.relType,
      fromCardinality: edge.fromCardinality,
      toCardinality: edge.toCardinality,
    });
  });

  dagre.layout(g);

  return { graph: g, raw: graph };
}