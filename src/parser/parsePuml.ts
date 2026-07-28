import * as plantumlParserPkg from 'plantuml-parser';

const parse =
  plantumlParserPkg.parse || (plantumlParserPkg as any).default?.parse;

export interface ParsedNode {
  id: string;
  label: string;
  type?: string;
  parentId?: string;
  isContainer?: boolean;
}

export interface ParsedEdge {
  source: string;
  target: string;
  label?: string;
}

export interface ParsedGraph {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
}

function extractName(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') {
    return (val.name || val.title || val.label || val.id || val.alias || '').trim();
  }
  return String(val).trim();
}

/**
 * Pre-parses shape declarations and nested containers (packages, nodes, clouds, etc.)
 */
function preParsePuml(pumlText: string): Map<string, ParsedNode> {
  const nodesMap = new Map<string, ParsedNode>();
  const lines = pumlText.split('\n');

  const containerStack: string[] = [];

  const containerKeywords = 'package|node|rectangle|folder|frame|cloud|database|cluster';
  const shapeKeywords = [
    'actor', 'person', 'agent', 'artifact', 'boundary', 'card', 'cloud',
    'component', 'control', 'database', 'entity', 'file', 'folder', 'frame',
    'hexagon', 'interface', 'node', 'package', 'queue', 'rectangle', 'stack',
    'storage', 'usecase'
  ].join('|');

  // Regex patterns
  const containerStartRegex = new RegExp(
    `^\\s*(${containerKeywords})\\s+(?:"([^"]+)"(?:\\s+as\\s+([A-Za-z0-9_\\-\\.]+))?|([A-Za-z0-9_\\-\\.]+))\\s*\\{\\s*$`,
    'i'
  );

  const patternAs = new RegExp(
    `^\\s*(${shapeKeywords})\\s+"([^"]+)"(?:\\s*<<[^>]+>>)?\\s+as\\s+([A-Za-z0-9_\\-\\.]+)\\s*$`, 'i'
  );
  const patternAliasLabel = new RegExp(
    `^\\s*(${shapeKeywords})\\s+([A-Za-z0-9_\\-\\.]+)\\s+"([^"]+)"\\s*$`, 'i'
  );
  const patternLabelOnly = new RegExp(
    `^\\s*(${shapeKeywords})\\s+"([^"]+)"\\s*$`, 'i'
  );
  const patternIdOnly = new RegExp(
    `^\\s*(${shapeKeywords})\\s+([A-Za-z0-9_\\-\\.]+)\\s*$`, 'i'
  );

  const patternBracketComponent = /^\s*\[([^\]]+)\](?:\s+as\s+([A-Za-z0-9_\-\.]+))?\s*$/i;
  const patternParenUsecase = /^\s*\(([^\)]+)\)(?:\s+as\s+([A-Za-z0-9_\-\.]+))?\s*$/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('\'') || line.startsWith('@')) continue;

    const currentParent = containerStack.length > 0 ? containerStack[containerStack.length - 1] : undefined;

    // 1. Check Container Open `{`
    const containerMatch = line.match(containerStartRegex);
    if (containerMatch) {
      const type = containerMatch[1].toLowerCase();
      const label = containerMatch[2] || containerMatch[4];
      const id = containerMatch[3] || containerMatch[4] || containerMatch[2];

      nodesMap.set(id, {
        id,
        label,
        type,
        parentId: currentParent,
        isContainer: true,
      });

      containerStack.push(id);
      continue;
    }

    // 2. Check Container Close `}`
    if (line === '}') {
      containerStack.pop();
      continue;
    }

    // 3. Regular Shape Declarations inside or outside containers
    let match = line.match(patternAs);
    if (match) {
      const [, type, label, id] = match;
      nodesMap.set(id, { id, label, type: type.toLowerCase(), parentId: currentParent });
      continue;
    }

    match = line.match(patternAliasLabel);
    if (match) {
      const [, type, id, label] = match;
      nodesMap.set(id, { id, label, type: type.toLowerCase(), parentId: currentParent });
      continue;
    }

    match = line.match(patternLabelOnly);
    if (match) {
      const [, type, label] = match;
      nodesMap.set(label, { id: label, label, type: type.toLowerCase(), parentId: currentParent });
      continue;
    }

    match = line.match(patternIdOnly);
    if (match) {
      const [, type, id] = match;
      nodesMap.set(id, { id, label: id, type: type.toLowerCase(), parentId: currentParent });
      continue;
    }

    match = line.match(patternBracketComponent);
    if (match) {
      const [, label, alias] = match;
      const id = alias || label;
      nodesMap.set(id, { id, label, type: 'component', parentId: currentParent });
      continue;
    }

    match = line.match(patternParenUsecase);
    if (match) {
      const [, label, alias] = match;
      const id = alias || label;
      nodesMap.set(id, { id, label, type: 'usecase', parentId: currentParent });
      continue;
    }
  }

  return nodesMap;
}

export function parsePuml(pumlText: string): ParsedGraph {
  const nodesMap = preParsePuml(pumlText);
  const edges: ParsedEdge[] = [];

  if (parse) {
    try {
      const ast = parse(pumlText);
      for (const diagram of ast as any[]) {
        if (!diagram.elements) continue;

        for (const element of diagram.elements) {
          const el = element as any;
          const type = (el.type || '').toLowerCase();

          if (type === 'relation' || type === 'relationship' || (el.left && el.right)) {
            const source = extractName(el.left);
            const target = extractName(el.right);
            const label = extractName(el.label);

            if (source && target) {
              if (!nodesMap.has(source)) {
                nodesMap.set(source, { id: source, label: source });
              }
              if (!nodesMap.has(target)) {
                nodesMap.set(target, { id: target, label: target });
              }
              edges.push({ source, target, label });
            }
          }
        }
      }
    } catch (e) {
      console.warn('AST parser warning:', e);
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
  };
}