import { create } from 'xmlbuilder2';
import { getTheme, ThemeName } from '../themes/themeManager';

function formatUmlText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<<([^>]+)>>/g, '«$1»')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getUniversalEdgeStyle(
  relType?: string,
  label?: string,
  sourceType?: string,
  targetType?: string,
  theme?: any
): string {
  const base = `edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;fontSize=11;strokeColor=${theme.edgeStroke};fontColor=${theme.edgeText};labelBackgroundColor=${theme.labelBg};`;

  if (label?.includes('include') || label?.includes('extend') || label?.includes('«') || relType?.startsWith('.')) {
    return `${base}dashed=1;endArrow=open;endFill=0;`;
  }
  if (relType === '<|--') return `${base}startArrow=block;startFill=0;endArrow=none;`;
  if (relType === '--|>') return `${base}endArrow=block;endFill=0;`;
  if (sourceType === 'usecase' && targetType === 'actor') return `${base}endArrow=open;endFill=0;`;
  if (sourceType === 'actor' && targetType === 'usecase') return `${base}endArrow=none;startArrow=none;`;
  if (relType === '-->' || relType === '->') return `${base}endArrow=open;endFill=0;`;
  return `${base}endArrow=none;`;
}

export function buildMxGraph(layoutData: any, options: { theme?: ThemeName } = {}): string {
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

  // -------------------------------------------------------------
  // BRANCH A: Sequence Diagrams
  // -------------------------------------------------------------
  if (layoutData.diagramType === 'sequence') {
    const { nodes, edges, activations, groups, notes, totalHeight, participantXMap, baselineY } = layoutData;
    const xCoords = Array.from(participantXMap.values()) as number[];
    const minX = Math.min(...xCoords) - 70;
    const maxX = Math.max(...xCoords) + 70;
    const groupWidth = maxX - minX;

    groups?.forEach((grp: any) => {
      const gHeight = (grp.endY || totalHeight) - grp.startY;
      const tabTitle = grp.label ? `${grp.type} [${grp.label}]` : grp.type;
      const groupStyle = `shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;recursiveResize=0;container=0;collapsible=0;fillColor=none;strokeColor=${theme.containerStroke};fontColor=${theme.containerText};fontStyle=1;width=${Math.max(80, tabTitle.length * 8)};height=25;verticalAlign=top;align=left;spacingLeft=8;spacingTop=4;`;
      const cell = doc.ele('mxCell', {
        id: grp.id,
        value: formatUmlText(tabTitle),
        style: groupStyle,
        vertex: '1',
        parent: '1',
      });
      cell.ele('mxGeometry', {
        x: minX.toFixed(0),
        y: grp.startY.toFixed(0),
        width: groupWidth.toFixed(0),
        height: gHeight.toFixed(0),
        as: 'geometry',
      });

      grp.dividers?.forEach((div: any, dIdx: number) => {
        const divId = `${grp.id}_div_${dIdx}`;
        const divLine = doc.ele('mxCell', {
          id: divId,
          value: '',
          style: `endArrow=none;dashed=1;html=1;strokeColor=${theme.containerStroke};`,
          edge: '1',
          parent: '1',
        });
        const geo = divLine.ele('mxGeometry', { relative: '1', as: 'geometry' });
        geo.ele('mxPoint', { x: minX.toFixed(0), y: div.y.toFixed(0), as: 'sourcePoint' });
        geo.ele('mxPoint', { x: maxX.toFixed(0), y: div.y.toFixed(0), as: 'targetPoint' });

        if (div.label) {
          const lblCell = doc.ele('mxCell', {
            id: `${divId}_lbl`,
            value: formatUmlText(`[${div.label}]`),
            style: `edgeLabel;html=1;align=left;verticalAlign=bottom;resizable=0;points=[];fontSize=10;fontColor=${theme.containerText};fontStyle=1;labelBackgroundColor=${theme.canvasBg};`,
            vertex: '1',
            connectable: '0',
            parent: divId,
          });
          lblCell.ele('mxGeometry', { x: '-0.92', y: '0', relative: '1', as: 'geometry' });
        }
      });
    });

    nodes.forEach((node: any) => {
      const x = node.x - node.width / 2;
      const y = node.y;
      let style = `rounded=1;whiteSpace=wrap;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};fontStyle=1;`;
      if (node.type === 'actor') {
        style = `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
      } else if (node.type === 'database') {
        style = `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
      }

      const cell = doc.ele('mxCell', {
        id: node.id,
        value: formatUmlText(node.label),
        style,
        vertex: '1',
        parent: '1',
      });
      cell.ele('mxGeometry', {
        x: x.toFixed(0),
        y: y.toFixed(0),
        width: node.width.toFixed(0),
        height: node.height.toFixed(0),
        as: 'geometry',
      });

      const lineCell = doc.ele('mxCell', {
        id: `line_${node.id}`,
        value: '',
        style: `endArrow=none;dashed=1;html=1;strokeColor=${theme.edgeStroke};strokeWidth=1;`,
        edge: '1',
        parent: '1',
      });
      const lineGeo = lineCell.ele('mxGeometry', { relative: '1', as: 'geometry' });
      lineGeo.ele('mxPoint', { x: node.x.toFixed(0), y: baselineY.toFixed(0), as: 'sourcePoint' });
      lineGeo.ele('mxPoint', { x: node.x.toFixed(0), y: totalHeight.toFixed(0), as: 'targetPoint' });
    });

    activations?.forEach((act: any, aIdx: number) => {
      const pX = participantXMap.get(act.participantId) || 0;
      const barWidth = 12;
      const x = pX - barWidth / 2;
      const height = Math.max(20, (act.endY || totalHeight) - act.startY);
      const actCell = doc.ele('mxCell', {
        id: `act_${aIdx}`,
        value: '',
        style: `rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=${theme.nodeStroke};strokeWidth=1;`,
        vertex: '1',
        parent: '1',
      });
      actCell.ele('mxGeometry', {
        x: x.toFixed(0),
        y: act.startY.toFixed(0),
        width: String(barWidth),
        height: height.toFixed(0),
        as: 'geometry',
      });
    });

    edges.forEach((edge: any, index: number) => {
      const sourceX = participantXMap.get(edge.source);
      const targetX = participantXMap.get(edge.target);
      const y = edge.yPosition;
      const isDashed = edge.relType?.includes('--');
      const edgeStyle = `edgeStyle=none;html=1;fontSize=11;strokeColor=${theme.edgeStroke};fontColor=${theme.edgeText};align=center;verticalAlign=bottom;spacingBottom=3;labelBackgroundColor=${theme.labelBg};${
        isDashed ? 'dashed=1;endArrow=open;endFill=0;' : 'endArrow=block;endFill=1;'
      }`;
      const cell = doc.ele('mxCell', {
        id: `seq_edge_${index}`,
        value: formatUmlText(edge.label || ''),
        style: edgeStyle,
        edge: '1',
        parent: '1',
      });
      const geo = cell.ele('mxGeometry', { relative: '1', as: 'geometry' });
      geo.ele('mxPoint', { x: sourceX.toFixed(0), y: y.toFixed(0), as: 'sourcePoint' });
      geo.ele('mxPoint', { x: targetX.toFixed(0), y: y.toFixed(0), as: 'targetPoint' });
    });

    notes?.forEach((note: any) => {
      const pX = participantXMap.get(note.participantId) || 0;
      let nX = pX + 25;
      if (note.position === 'left') nX = pX - 145;
      if (note.position === 'over') nX = pX - 60;
      const noteStyle = `shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#fff2cc;strokeColor=#d6b656;fontColor=#333333;fontSize=11;align=center;verticalAlign=middle;size=12;`;
      const cell = doc.ele('mxCell', {
        id: note.id,
        value: formatUmlText(note.text),
        style: noteStyle,
        vertex: '1',
        parent: '1',
      });
      cell.ele('mxGeometry', {
        x: nX.toFixed(0),
        y: note.yPosition.toFixed(0),
        width: '120',
        height: '40',
        as: 'geometry',
      });
    });

    return doc.end({ prettyPrint: true });
  }

  // -------------------------------------------------------------
  // BRANCH B: General Dagre Diagrams (State, Class, ER, Use Case, etc.)
  // -------------------------------------------------------------
  const { graph } = layoutData;
  let cellCounter = 2;

  // 1. Render Containers & Concurrent Region Dividers
  graph.nodes().forEach((id: string) => {
    const node = graph.node(id);
    if (!node || !node.isContainer) return;
    const width = node.width ?? 300;
    const height = node.height ?? 200;
    const x = (node.x ?? 0) - width / 2;
    const y = (node.y ?? 0) - height / 2;
    const tabWidth = Math.max(120, (node.label || '').length * 9 + 30);
    const tabHeight = 28;
    const style = `shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;recursiveResize=0;container=1;collapsible=0;absPos=0;fillColor=none;strokeColor=${theme.containerStroke};fontColor=${theme.containerText};fontStyle=1;width=${tabWidth};height=${tabHeight};verticalAlign=top;align=left;spacingLeft=10;spacingTop=4;`;

    const cell = doc.ele('mxCell', {
      id,
      value: formatUmlText(node.label),
      style,
      vertex: '1',
      parent: '1',
    });
    cell.ele('mxGeometry', {
      x: x.toFixed(0),
      y: y.toFixed(0),
      width: width.toFixed(0),
      height: height.toFixed(0),
      as: 'geometry',
    });

    // Render Dashed Dividers across composite state regions
    node.regionDividers?.forEach((divY: number, dIdx: number) => {
      const divCell = doc.ele('mxCell', {
        id: `${id}_region_div_${dIdx}`,
        value: '',
        style: `endArrow=none;dashed=1;html=1;strokeColor=${theme.containerStroke};strokeWidth=1.5;`,
        edge: '1',
        parent: id,
      });
      const divGeo = divCell.ele('mxGeometry', { relative: '1', as: 'geometry' });
      divGeo.ele('mxPoint', { x: '0', y: divY.toFixed(0), as: 'sourcePoint' });
      divGeo.ele('mxPoint', { x: width.toFixed(0), y: divY.toFixed(0), as: 'targetPoint' });
    });
  });

  // 2. Render Inner Nodes
  graph.nodes().forEach((id: string) => {
    const node = graph.node(id);
    if (!node || node.isContainer) return;
    const parent = graph.parent(id);
    const width = node.width ?? 120;
    const height = node.height ?? 60;
    let x = (node.x ?? 0) - width / 2;
    let y = (node.y ?? 0) - height / 2;

    if (parent) {
      const parentNode = graph.node(parent);
      if (parentNode) {
        x -= (parentNode.x ?? 0) - (parentNode.width ?? 300) / 2;
        y -= (parentNode.y ?? 0) - (parentNode.height ?? 200) / 2;
      }
    }

    let style = '';
    switch (node.type) {
      case 'actor':
        style = `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
        break;
      case 'usecase':
        style = `ellipse;whiteSpace=wrap;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
        break;
      case 'database':
        style = `shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
        break;
      case 'component':
        style = `shape=component;whiteSpace=wrap;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};align=center;`;
        break;
      case 'cloud':
        style = `ellipse;shape=cloud;whiteSpace=wrap;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
        break;
      case 'start':
        style = `ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;`;
        break;
      case 'end':
        style = `ellipse;html=1;shape=endState;fillColor=#000000;strokeColor=#000000;double=1;`;
        break;
      case 'choice':
        style = `rhombus;whiteSpace=wrap;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
        break;
      case 'state':
        style = `rounded=1;arcSize=40;whiteSpace=wrap;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
        break;
      case 'class':
      case 'enum':
      case 'entity': {
        const isEnum = node.type === 'enum';
        const headerLabel = isEnum ? ` enum <br/><b>${node.label}</b>` : `<b>${node.label}</b>`;
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
          width: width.toFixed(0),
          height: height.toFixed(0),
          as: 'geometry',
        });

        let currentY = 28;
        const addCompartment = (lines: string[]) => {
          if (!lines || lines.length === 0) return;
          const compHeight = lines.length * 18 + 8;
          const compStyle = `text;strokeColor=${theme.nodeStroke};fillColor=none;align=left;verticalAlign=top;spacingLeft=6;spacingRight=6;spacingTop=4;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;whiteSpace=wrap;html=1;`;
          const subCell = doc.ele('mxCell', {
            id: `${id}_comp_${cellCounter++}`,
            value: formatUmlText(lines.join('<br/>')),
            style: compStyle,
            vertex: '1',
            parent: id,
          });
          subCell.ele('mxGeometry', {
            x: '0',
            y: String(currentY),
            width: width.toFixed(0),
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
        return;
      }
      default:
        style = `rounded=1;whiteSpace=wrap;html=1;fillColor=${theme.nodeFill};strokeColor=${theme.nodeStroke};fontColor=${theme.nodeText};`;
    }

    let val = formatUmlText(node.label);
    if (node.type === 'state' && node.attributes && node.attributes.length > 0) {
      val = `<b>${formatUmlText(node.label)}</b><hr/>${node.attributes.map((a: string) => formatUmlText(a)).join('<br/>')}`;
    }

    const cell = doc.ele('mxCell', {
      id,
      value: val,
      style,
      vertex: '1',
      parent: parent || '1',
    });
    cell.ele('mxGeometry', {
      x: x.toFixed(0),
      y: y.toFixed(0),
      width: width.toFixed(0),
      height: height.toFixed(0),
      as: 'geometry',
    });
  });

  // 3. Render Edges (Skipping invisible layout constraints)
  graph.edges().forEach((e: any, index: number) => {
    const edge = graph.edge(e);
    if (edge?.isInvis) return;

    const sourceNode = graph.node(e.v);
    const targetNode = graph.node(e.w);
    const style = getUniversalEdgeStyle(
      edge.relType,
      edge.label,
      sourceNode?.type,
      targetNode?.type,
      theme
    );
    const edgeId = `edge_${index}`;
    const cell = doc.ele('mxCell', {
      id: edgeId,
      value: formatUmlText(edge.label || ''),
      style,
      edge: '1',
      parent: '1',
      source: edge?.realSource || e.v,
      target: edge?.realTarget || e.w,
    });

    cell.ele('mxGeometry', { relative: '1', as: 'geometry' });

    if (edge.fromCardinality) {
      const srcLabel = doc.ele('mxCell', {
        id: `${edgeId}_src`,
        value: formatUmlText(edge.fromCardinality),
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
        value: formatUmlText(edge.toCardinality),
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