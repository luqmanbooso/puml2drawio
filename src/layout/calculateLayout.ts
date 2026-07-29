import * as dagrePkg from 'dagre';
import { ParsedGraph } from '../types';
import { calculateSequenceLayout } from './calculateSequenceLayout';

const dagre = (dagrePkg as any).default || dagrePkg;

export function calculateLayout(graph: ParsedGraph) {
  if (graph.diagramType === 'sequence') {
    return calculateSequenceLayout(graph);
  }

  const isStateDiagram =
    graph.nodes.some((n) => ['state', 'start', 'end', 'choice'].includes(n.type)) ||
    graph.containers?.some((c) => c.type === 'state');

  const g = new dagre.graphlib.Graph({ compound: true, multigraph: true });
  g.setGraph({
    rankdir: isStateDiagram ? 'TB' : 'LR',
    nodesep: 45,
    ranksep: 60,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  if (graph.containers) {
    graph.containers.forEach((c) => {
      g.setNode(c.id, {
        label: c.label,
        isContainer: true,
        regionCount: c.regionCount || 1,
        paddingX: 40,
        paddingY: 40,
      });
    });
  }

  graph.nodes.forEach((node) => {
    let width = 120;
    let height = 60;
    switch (node.type) {
      case 'actor':
        width = 50;
        height = 75;
        break;
      case 'usecase':
        width = Math.max(140, node.label.length * 9 + 25);
        height = 55;
        break;
      case 'database':
        width = 80;
        height = 80;
        break;
      case 'component':
        width = Math.max(130, node.label.length * 8 + 30);
        height = 55;
        break;
      case 'start':
      case 'end':
        width = 28;
        height = 28;
        break;
      case 'choice':
        width = 32;
        height = 32;
        break;
      case 'state': {
        const attrCount = node.attributes?.length || 0;
        if (attrCount > 0) {
          height = 45 + attrCount * 18;
          const allLines = [node.label, ...(node.attributes || [])];
          const maxLen = Math.max(...allLines.map((l) => l.length));
          width = Math.max(130, maxLen * 8 + 24);
        } else {
          width = Math.max(110, node.label.length * 9 + 30);
          height = 50;
        }
        break;
      }
      default:
        width = Math.max(110, node.label.length * 8 + 20);
        height = 50;
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
      regionIndex: node.regionIndex,
    });

    if (node.parentId && g.hasNode(node.parentId)) {
      g.setParent(node.id, node.parentId);
    }
  });

  // Helper to map container IDs to internal leaf nodes for Dagre's layout pass
  const resolveLeafNode = (nodeId: string): string => {
    if (g.hasNode(nodeId)) {
      const children = g.children(nodeId);
      if (children && children.length > 0) {
        const startChild = children.find((c: string) => g.node(c)?.type === 'start');
        const stateChild = children.find((c: string) => g.node(c)?.type === 'state');
        return startChild || stateChild || children[0];
      }
    }
    return nodeId;
  };

  // Add invisible layout constraints between regions inside composite states
  if (graph.containers) {
    graph.containers.forEach((c) => {
      if (c.regionCount && c.regionCount > 1) {
        const regionMap: Record<number, string[]> = {};
        graph.nodes.forEach((n) => {
          if (n.parentId === c.id && n.regionIndex !== undefined) {
            regionMap[n.regionIndex] = regionMap[n.regionIndex] || [];
            regionMap[n.regionIndex].push(n.id);
          }
        });

        for (let r = 0; r < c.regionCount - 1; r++) {
          const upperNodes = regionMap[r] || [];
          const lowerNodes = regionMap[r + 1] || [];
          if (upperNodes.length > 0 && lowerNodes.length > 0) {
            upperNodes.forEach((uId) => {
              lowerNodes.forEach((lId) => {
                g.setEdge(uId, lId, { isInvis: true, weight: 0, minlen: 1 });
              });
            });
          }
        }
      }
    });
  }

  graph.edges.forEach((edge, idx) => {
    const layoutSource = resolveLeafNode(edge.source);
    const layoutTarget = resolveLeafNode(edge.target);

    if (g.hasNode(layoutSource) && g.hasNode(layoutTarget)) {
      g.setEdge(
        layoutSource,
        layoutTarget,
        {
          id: edge.id,
          label: edge.label,
          relType: edge.relType,
          fromCardinality: edge.fromCardinality,
          toCardinality: edge.toCardinality,
          realSource: edge.source,
          realTarget: edge.target,
        },
        edge.id || `e_${idx}`
      );
    }
  });

  dagre.layout(g);

  // Post-layout: calculate divider Y positions for containers with concurrent regions
  if (graph.containers) {
    graph.containers.forEach((c) => {
      const cNode = g.node(c.id);
      if (!cNode || !c.regionCount || c.regionCount <= 1) return;

      const parentY = (cNode.y ?? 0) - (cNode.height ?? 200) / 2;
      const regionMap: Record<number, { minY: number; maxY: number }> = {};

      graph.nodes.forEach((n) => {
        if (n.parentId === c.id && n.regionIndex !== undefined) {
          const nodeData = g.node(n.id);
          if (!nodeData) return;
          const nTop = (nodeData.y ?? 0) - (nodeData.height ?? 50) / 2 - parentY;
          const nBottom = (nodeData.y ?? 0) + (nodeData.height ?? 50) / 2 - parentY;

          if (!regionMap[n.regionIndex]) {
            regionMap[n.regionIndex] = { minY: nTop, maxY: nBottom };
          } else {
            regionMap[n.regionIndex].minY = Math.min(regionMap[n.regionIndex].minY, nTop);
            regionMap[n.regionIndex].maxY = Math.max(regionMap[n.regionIndex].maxY, nBottom);
          }
        }
      });

      const regionDividers: number[] = [];
      for (let r = 0; r < c.regionCount - 1; r++) {
        if (regionMap[r] && regionMap[r + 1]) {
          const divY = (regionMap[r].maxY + regionMap[r + 1].minY) / 2;
          regionDividers.push(divY);
        }
      }

      cNode.regionDividers = regionDividers;
    });
  }

  return { diagramType: 'general' as const, graph: g, raw: graph };
}