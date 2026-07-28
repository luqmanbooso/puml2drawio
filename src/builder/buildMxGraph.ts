import { create } from 'xmlbuilder2';
import { getTheme, ThemeName } from '../themes/themeManager';

function getUmlEdgeStyle(relType?: string, theme?: any): string {
  const base = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;fontSize=11;strokeColor=${theme.edgeStroke};fontColor=${theme.edgeText};labelBackgroundColor=${theme.labelBg};`;

  switch (relType) {
    case '<|--': // Inheritance (Target is parent)
      return `${base}startArrow=block;startFill=0;endArrow=none;`;
    case '--|>': // Inheritance (Source is parent)
      return `${base}endArrow=block;endFill=0;`;
    case '*--': // Composition
      return `${base}startArrow=diamond;startFill=1;endArrow=none;`;
    case '--*':
      return `${base}endArrow=diamond;endFill=1;`;
    case 'o--': // Aggregation
      return `${base}startArrow=diamond;startFill=0;endArrow=none;`;
    case '--o':
      return `${base}endArrow=diamond;endFill=0;`;
    case '..>': // Dependency
      return `${base}dashed=1;endArrow=open;endFill=0;`;
    case '<..':
      return `${base}dashed=1;startArrow=open;startFill=0;endArrow=none;`;
    default:
      return `${base}endArrow=none;`;
  }
}

export function buildMxGraph(layoutData: any, options: { theme?: ThemeName } = {}): string {
  const { graph } = layoutData;
  const theme = getTheme(options.theme || 'classic');

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
      pageWidth: '850',
      pageHeight: '1100',
      background: theme.canvasBg,
    })
    .ele('root');

  doc.ele('mxCell', { id: '0' });
  doc.ele('mxCell', { id: '1', parent: '0' });

  let cellCounter = 2;

  // Render Nodes & Native Draw.io UML Stencil Containers
  graph.nodes().forEach((id: string) => {
    const node = graph.node(id);
    const parent = graph.parent(id);

    let x = node.x - node.width / 2;
    let y = node.y - node.height / 2;

    if (parent) {
      const parentNode = graph.node(parent);
      x -= parentNode.x - parentNode.width / 2;
      y -= parentNode.y - parentNode.height / 2;
    }

    if (node.isContainer) {
      const style = `swimlane;whiteSpace=wrap;html=1;collapsible=1;container=1;fillColor=${theme.containerFill};strokeColor=${theme.containerStroke};fontColor=${theme.containerText};swimlaneFillColor=${theme.containerBodyFill};fontStyle=1;startSize=28;`;
      const cell = doc.ele('mxCell', {
        id,
        value: node.label,
        style,
        vertex: '1',
        parent: parent || '1',
      });
      cell.ele('mxGeometry', {
        x: x.toFixed(0),
        y: y.toFixed(0),
        width: node.width.toFixed(0),
        height: node.height.toFixed(0),
        as: 'geometry',
      });
    } else if (node.type === 'class' || node.type === 'enum') {
      // -------------------------------------------------------------
      // Native Draw.io Horizontal Header Stacked Container
      // -------------------------------------------------------------
      const isEnum = node.type === 'enum';
      const headerLabel = isEnum ? `«enum»<br/><b>${node.label}</b>` : `<b>${node.label}</b>`;

      // CRITICAL FIX: horizontal=1 keeps title header at top; horizontalStack=0 stacks compartments vertically
      const parentStyle = `swimlane;fontStyle=0;align=center;verticalAlign=middle;childLayout=stackLayout;horizontal=1;startSize=28;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;margin=0;whiteSpace=wrap;html=1;rounded=0;`;

      const parentCell = doc.ele('mxCell', {
        id,
        value: headerLabel,
        style: parentStyle,
        vertex: '1',
        parent: parent || '1',
      });

      parentCell.ele('mxGeometry', {
        x: x.toFixed(0),
        y: y.toFixed(0),
        width: node.width.toFixed(0),
        height: node.height.toFixed(0),
        as: 'geometry',
      });

      let currentY = 28; // Header height offset

      const addCompartment = (lines: string[]) => {
        if (!lines || lines.length === 0) return;

        const compHeight = lines.length * 18 + 8;
        const compStyle = `text;strokeColor=${theme.nodeStroke};fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=6;spacingTop=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;`;

        const subCellId = `${id}_comp_${cellCounter++}`;
        const subCell = doc.ele('mxCell', {
          id: subCellId,
          value: lines.join('<br/>'), // HTML break formatting for multi-line compartments
          style: compStyle,
          vertex: '1',
          parent: id,
        });

        subCell.ele('mxGeometry', {
          x: '0',
          y: String(currentY),
          width: node.width.toFixed(0),
          height: String(compHeight),
          as: 'geometry',
        });

        currentY += compHeight;
      };

      if (isEnum && node.members?.length) {
        addCompartment(node.members);
      } else {
        if (node.attributes?.length) addCompartment(node.attributes);
        if (node.methods?.length) addCompartment(node.methods);
      }
    } else {
      // Primitive Shapes
      const style = `rounded=1;whiteSpace=wrap;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
      const cell = doc.ele('mxCell', {
        id,
        value: node.label,
        style,
        vertex: '1',
        parent: parent || '1',
      });
      cell.ele('mxGeometry', {
        x: x.toFixed(0),
        y: y.toFixed(0),
        width: node.width.toFixed(0),
        height: node.height.toFixed(0),
        as: 'geometry',
      });
    }
  });

  // Render Relationships & Native Edge Cardinalities
  graph.edges().forEach((e: any, index: number) => {
    const edge = graph.edge(e);
    const style = getUmlEdgeStyle(edge.relType, theme);
    const edgeId = `edge_${index}`;

    const cell = doc.ele('mxCell', {
      id: edgeId,
      value: edge.label || '',
      style,
      edge: '1',
      parent: '1',
      source: e.v,
      target: e.w,
    });

    cell.ele('mxGeometry', { relative: '1', as: 'geometry' });

    if (edge.fromCardinality) {
      const srcLabel = doc.ele('mxCell', {
        id: `${edgeId}_src`,
        value: edge.fromCardinality,
        style: `edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;fontColor=${theme.edgeText};labelBackgroundColor=${theme.labelBg};`,
        vertex: '1',
        connectable: '0',
        parent: edgeId,
      });
      srcLabel.ele('mxGeometry', { x: '-0.8', y: '0', relative: '1', as: 'geometry' });
    }

    if (edge.toCardinality) {
      const trgLabel = doc.ele('mxCell', {
        id: `${edgeId}_trg`,
        value: edge.toCardinality,
        style: `edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;fontColor=${theme.edgeText};labelBackgroundColor=${theme.labelBg};`,
        vertex: '1',
        connectable: '0',
        parent: edgeId,
      });
      trgLabel.ele('mxGeometry', { x: '0.8', y: '0', relative: '1', as: 'geometry' });
    }
  });

  return doc.end({ prettyPrint: true });
}