import { create } from 'xmlbuilder2';
import { PositionedGraph } from '../layout/calculateLayout';
import { getTheme, ThemeName, ThemeColors } from '../themes/themeManager';

export interface BuildOptions {
  theme?: ThemeName | string;
}

function getShapeStyle(
  type: string | undefined,
  isContainer: boolean | undefined,
  theme: ThemeColors
): string {
  const shapeType = (type || '').toLowerCase();

  // 1. Container / Swimlane Styling with explicit body fill
  if (isContainer) {
    const isSquare = shapeType === 'rectangle';
    const rounded = isSquare ? '0' : '1';
    return `swimlane;whiteSpace=wrap;html=1;startSize=28;fillColor=${theme.containerFill};swimlaneFillColor=${theme.containerBodyFill};strokeColor=${theme.containerStroke};fontColor=${theme.containerText};fontStyle=1;container=1;collapsible=1;rounded=${rounded};`;
  }

  // Common node colors
  const colors = `fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;

  // 2. Shape Stencils
  switch (shapeType) {
    case 'actor':
    case 'person':
      return `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;${colors}fontStyle=1;`;

    case 'database':
    case 'storage':
      return `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;${colors}fontStyle=1;`;

    case 'node':
      return `shape=cube;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;darkOpacity=0.05;${colors}fontStyle=1;`;

    case 'queue':
      return `shape=mxgraph.flowchart.direct_data;whiteSpace=wrap;html=1;${colors}fontStyle=1;`;

    case 'cloud':
      return `ellipse;shape=cloud;whiteSpace=wrap;html=1;${colors}fontStyle=1;`;

    case 'artifact':
      return `shape=note;whiteSpace=wrap;html=1;size=14;${colors}fontStyle=1;`;

    case 'folder':
    case 'package':
      return `shape=folder;fontStyle=1;tabWidth=110;tabHeight=30;tabPosition=left;html=1;boundedLbl=1;whiteSpace=wrap;${colors}`;

    case 'hexagon':
      return `shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;${colors}fontStyle=1;`;

    case 'usecase':
      return `ellipse;whiteSpace=wrap;html=1;${colors}fontStyle=1;`;

    default:
      return `rounded=1;whiteSpace=wrap;html=1;${colors}fontStyle=1;fontSize=12;`;
  }
}

export function buildMxGraph(
  layout: PositionedGraph,
  options: BuildOptions = {}
): string {
  const theme = getTheme(options.theme);

// Inside src/builder/buildMxGraph.ts
const defaultEdgeStyle = 
  `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;fontSize=11;strokeColor=${theme.edgeStroke};fontColor=${theme.edgeText};labelBackgroundColor=${theme.labelBg};verticalAlign=bottom;`;
  
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('mxGraphModel', {
      dx: '1000',
      dy: '1000',
      grid: '1',
      gridSize: '10',
      guides: '1',
      tooltips: '1',
      connect: '1',
      arrows: '1',
      fold: '1',
      page: '1',
      pageScale: '1',
      pageWidth: '827',
      pageHeight: '1169',
      background: theme.canvasBg, // Sets full canvas background color in Draw.io
    })
    .ele('root');

  doc.ele('mxCell', { id: '0' });
  doc.ele('mxCell', { id: '1', parent: '0' });

  let cellIndex = 2;
  const nodeToCellIdMap = new Map<string, string>();

  // Build containers first so children can attach properly
  const sortedNodes = [...layout.nodes].sort((a, b) => {
    if (a.isContainer && !b.isContainer) return -1;
    if (!a.isContainer && b.isContainer) return 1;
    return 0;
  });

  for (const node of sortedNodes) {
    const cellId = `node_${cellIndex++}`;
    nodeToCellIdMap.set(node.id, cellId);

    const parentCellId = node.parentId ? (nodeToCellIdMap.get(node.parentId) || '1') : '1';
    const style = getShapeStyle(node.type, node.isContainer, theme);

    doc
      .ele('mxCell', {
        id: cellId,
        value: node.label,
        style,
        vertex: '1',
        parent: parentCellId,
      })
      .ele('mxGeometry', {
        x: String(node.x),
        y: String(node.y),
        width: String(node.width),
        height: String(node.height),
        as: 'geometry',
      });
  }

  for (const edge of layout.edges) {
    const sourceCellId = nodeToCellIdMap.get(edge.source) || edge.source;
    const targetCellId = nodeToCellIdMap.get(edge.target) || edge.target;
    const edgeCellId = `edge_${cellIndex++}`;

    const edgeCell = doc.ele('mxCell', {
      id: edgeCellId,
      value: edge.label || '',
      style: defaultEdgeStyle,
      edge: '1',
      parent: '1',
      source: sourceCellId,
      target: targetCellId,
    });

    const geometry = edgeCell.ele('mxGeometry', {
      relative: '1',
      as: 'geometry',
    });

    if (edge.points && edge.points.length > 2) {
      const arrayEle = geometry.ele('Array', { as: 'points' });
      for (let i = 1; i < edge.points.length - 1; i++) {
        arrayEle.ele('mxPoint', {
          x: String(Math.round(edge.points[i].x)),
          y: String(Math.round(edge.points[i].y)),
        });
      }
    }
  }

  return doc.end({ prettyPrint: true });
}