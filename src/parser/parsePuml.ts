import { ParsedGraph, ParsedNode, ParsedEdge } from '../types';

export function parsePuml(pumlCode: string): ParsedGraph {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const containers: ParsedNode[] = [];
  const processedNodeIds = new Set<string>();

  // Clean code & remove single/multi-line comments
  let cleanCode = pumlCode
    .replace(/\/'[\s\S]*?'\//g, '')
    .replace(/'[^\n]*/g, '');

  // -------------------------------------------------------------
  // PASS 1: Extract Compartment Blocks (class "Name" { ... }, enum { ... })
  // -------------------------------------------------------------
  const blockRegex = /(class|enum)\s+(?:"([^"]+)"\s+as\s+)?([A-Za-z0-9_]+)(?:\s+as\s+([A-Za-z0-9_]+))?\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleanCode)) !== null) {
    const keyword = match[1] as 'class' | 'enum';
    const labelQuoted = match[2];
    const rawId = match[3];
    const aliasId = match[4];
    const bodyText = match[5];

    const id = aliasId || rawId;
    const label = labelQuoted || rawId;

    const attributes: string[] = [];
    const methods: string[] = [];
    const members: string[] = [];

    const lines = bodyText.split('\n').map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      if (keyword === 'enum') {
        members.push(line);
      } else if (line.includes('(') && line.includes(')')) {
        methods.push(line);
      } else {
        attributes.push(line);
      }
    }

    nodes.push({
      id,
      label,
      type: keyword,
      attributes,
      methods,
      members,
    });

    processedNodeIds.add(id);
  }

  // Remove parsed block bodies to simplify line-by-line parsing
  cleanCode = cleanCode.replace(blockRegex, '');

  // -------------------------------------------------------------
  // PASS 2: Line-by-Line Parsing (Containers, Nodes, Relationships)
  // -------------------------------------------------------------
  const lines = cleanCode.split('\n').map((l) => l.trim()).filter(Boolean);
  let activeContainerId: string | undefined = undefined;

  for (const line of lines) {
    if (line.startsWith('@startuml') || line.startsWith('@enduml')) continue;

    // Detect Container Start
    const containerMatch = line.match(/^(package|rectangle)\s+(?:"([^"]+)"\s+as\s+)?([A-Za-z0-9_]+)/);
    if (containerMatch && !line.includes('{')) {
      const cId = containerMatch[3];
      const cLabel = containerMatch[2] || cId;
      containers.push({ id: cId, label: cLabel, type: 'package' });
      activeContainerId = cId;
      continue;
    }

    if (line === '}') {
      activeContainerId = undefined;
      continue;
    }

    // Detect Class without body (e.g. class Customer)
    const singleClassMatch = line.match(/^(class|enum)\s+(?:"([^"]+)"\s+as\s+)?([A-Za-z0-9_]+)/);
    if (singleClassMatch) {
      const id = singleClassMatch[3];
      const label = singleClassMatch[2] || id;
      if (!processedNodeIds.has(id)) {
        nodes.push({ id, label, type: singleClassMatch[1] as any, parentId: activeContainerId });
        processedNodeIds.add(id);
      }
      continue;
    }

    // Detect Relationships (Handles <|--, *--, o--, ..>, cardinalities "1" -- "0..*", and labels)
    const relRegex = /^([A-Za-z0-9_]+)\s*(?:"([^"]+)")?\s*(<\|--|--\|>|\*--|--\*|o--|--o|\.\.>|<\.\.|-->|<--|--)\s*(?:"([^"]+)")?\s*([A-Za-z0-9_]+)(?:\s*:\s*(.+))?$/;
    const relMatch = line.match(relRegex);

    if (relMatch) {
      const source = relMatch[1];
      const fromCard = relMatch[2];
      const relType = relMatch[3];
      const toCard = relMatch[4];
      const target = relMatch[5];
      const label = relMatch[6]?.trim();

      // Ensure nodes exist if implicitly referenced in a relationship
      [source, target].forEach((nodeId) => {
        if (!processedNodeIds.has(nodeId)) {
          nodes.push({ id: nodeId, label: nodeId, type: 'class', parentId: activeContainerId });
          processedNodeIds.add(nodeId);
        }
      });

      edges.push({
        id: `e_${source}_${target}_${edges.length}`,
        source,
        target,
        relType,
        fromCardinality: fromCard,
        toCardinality: toCard,
        label,
      });
      continue;
    }

    // Standard Primitive Nodes (actor, database, node, etc.)
    const primitiveMatch = line.match(/^(actor|database|queue|cloud|hexagon|folder|node|usecase)\s+(?:"([^"]+)"\s+as\s+)?([A-Za-z0-9_]+)/);
    if (primitiveMatch) {
      const type = primitiveMatch[1] as any;
      const id = primitiveMatch[3];
      const label = primitiveMatch[2] || id;
      if (!processedNodeIds.has(id)) {
        nodes.push({ id, label, type, parentId: activeContainerId });
        processedNodeIds.add(id);
      }
    }
  }

  return { nodes, edges, containers };
}