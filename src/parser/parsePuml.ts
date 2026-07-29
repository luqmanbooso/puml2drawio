import { ParsedGraph, ParsedNode, ParsedEdge, NodeType, SequenceEvent } from '../types';

export function parsePuml(pumlCode: string): ParsedGraph {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const containers: ParsedNode[] = [];
  const sequenceEvents: SequenceEvent[] = [];
  const processedNodeIds = new Set<string>();

  let startNodeCounter = 0;
  let endNodeCounter = 0;

  let cleanCode = pumlCode
    .replace(/\/'[\s\S]*?'\//g, '')
    .replace(/'[^\n]*/g, '');

  // -------------------------------------------------------------
  // Diagram Type Detection
  // -------------------------------------------------------------
  const isState = /\bstate\b/i.test(cleanCode) || /\[\*\]/.test(cleanCode);
  const isUseCase = /\busecase\b/i.test(cleanCode);
  const isClassOrEr = /\b(class|enum|entity)\b/i.test(cleanCode) || /\|\|--|--\|\||--o\{|--\|\{/.test(cleanCode);
  const isComponentOrDeploy = /\b(component|node|cloud|folder)\b/i.test(cleanCode);

  const isExplicitSequence =
    cleanCode.includes('participant') ||
    cleanCode.includes('activate') ||
    cleanCode.includes('deactivate') ||
    /\b(alt|opt|loop|par|autonumber)\b/i.test(cleanCode);

  const isSequence =
    isExplicitSequence ||
    (!isState && !isUseCase && !isClassOrEr && !isComponentOrDeploy && /^[A-Za-z0-9_]+\s*->>\s*[A-Za-z0-9_]+/m.test(cleanCode));

  const diagramType = isSequence ? 'sequence' : 'general';

  // -------------------------------------------------------------
  // PASS 1: Class / ER Multi-Compartment Blocks
  // -------------------------------------------------------------
  const blockRegex = /(class|enum|entity)\s+(?:"([^"]+)"\s+as\s+)?([A-Za-z0-9_]+)(?:\s+as\s+([A-Za-z0-9_]+))?\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleanCode)) !== null) {
    const keyword = match[1] as NodeType;
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

    nodes.push({ id, label, type: keyword, attributes, methods, members });
    processedNodeIds.add(id);
  }

  cleanCode = cleanCode.replace(blockRegex, '');

  // -------------------------------------------------------------
  // PASS 2: Line-by-Line AST Extraction
  // -------------------------------------------------------------
  const lines = cleanCode.split('\n').map((l) => l.trim()).filter(Boolean);
  let activeContainerId: string | undefined = undefined;
  let activeRegionIndex = 0;
  let sequenceStepCounter = 1;

  for (const line of lines) {
    if (line.startsWith('@startuml') || line.startsWith('@enduml') || line.includes('direction') || line.startsWith('autonumber')) continue;

    // 1. Choice Stencils (state c_check <<choice>>)
    const choiceMatch = line.match(/^state\s+([A-Za-z0-9_]+)\s*<<choice>>/i);
    if (choiceMatch) {
      const id = choiceMatch[1];
      nodes.push({ id, label: '', type: 'choice', parentId: activeContainerId, regionIndex: activeContainerId ? activeRegionIndex : undefined });
      processedNodeIds.add(id);
      continue;
    }

    // 2. Composite Containers (state Active { ... } OR package/rectangle)
    const stateContainerMatch = line.match(/^state\s+([A-Za-z0-9_]+)\s*\{/i);
    const containerMatch = line.match(/^(package|rectangle|node|frame|cloud)\s+(?:"([^"]+)"|([A-Za-z0-9_]+))(?:\s+as\s+([A-Za-z0-9_]+))?\s*\{/i);

    if ((containerMatch || stateContainerMatch) && !isSequence) {
      const cId = stateContainerMatch
        ? stateContainerMatch[1]
        : (containerMatch![4] || (containerMatch![2] || containerMatch![3]).replace(/[^A-Za-z0-9_]/g, '_'));
      const cLabel = stateContainerMatch ? stateContainerMatch[1] : (containerMatch![2] || containerMatch![3]);

      containers.push({ id: cId, label: cLabel, type: 'state', regionCount: 1 });
      processedNodeIds.add(cId);
      activeContainerId = cId;
      activeRegionIndex = 0;

      const dupIdx = nodes.findIndex((n) => n.id === cId);
      if (dupIdx !== -1) {
        nodes.splice(dupIdx, 1);
      }
      continue;
    }

    if (line === '}' && !isSequence) {
      activeContainerId = undefined;
      activeRegionIndex = 0;
      continue;
    }

    // 3. Concurrent Region Divider (--)
    if (line === '--') {
      if (activeContainerId) {
        activeRegionIndex++;
        const cont = containers.find((c) => c.id === activeContainerId);
        if (cont) {
          cont.regionCount = Math.max(cont.regionCount || 1, activeRegionIndex + 1);
        }
      }
      continue;
    }

    // 4. State Actions / Body Attachments
    const actionMatch = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
    if (actionMatch && !line.includes('-->') && !line.includes('..>') && !line.includes('->')) {
      const targetId = actionMatch[1];
      const actionText = actionMatch[2].trim();

      const existingNode = nodes.find((n) => n.id === targetId);
      if (existingNode) {
        existingNode.attributes = existingNode.attributes || [];
        existingNode.attributes.push(actionText);
      } else {
        nodes.push({
          id: targetId,
          label: targetId,
          type: 'state',
          parentId: activeContainerId,
          regionIndex: activeContainerId ? activeRegionIndex : undefined,
          attributes: [actionText],
        });
        processedNodeIds.add(targetId);
      }
      continue;
    }

    // 5. Explicit Node Declarations
    const kwMatch = line.match(/^(database|component|actor|participant|usecase|state|node|cloud|folder|entity)\s+(?:"([^"]+)"\s+as\s+)?([A-Za-z0-9_]+|\[[^\]]+\]|\([^\)]+\)|:[^:]+:)/i);
    if (kwMatch) {
      const type = kwMatch[1].toLowerCase() as NodeType;
      let rawName = kwMatch[3];
      const id = rawName.replace(/[\[\]\(\):]/g, '');
      const label = kwMatch[2] || id;

      if (!processedNodeIds.has(id)) {
        nodes.push({
          id,
          label,
          type,
          parentId: activeContainerId,
          regionIndex: activeContainerId ? activeRegionIndex : undefined,
        });
        processedNodeIds.add(id);
      }
      continue;
    }

    // 6. Universal Relationships & Scoped [*] Initial/Final States
    const relRegex = /^([A-Za-z0-9_\[\]\(\):]+|\[\*\])\s*(?:"([^"]+)")?\s*(<\|--|--\|>|\*--|--\*|o--|--o|\|\|--\|\||\|\|--o\{|\|\|--\|\{|\}\|--\|\{|\.\.\.>|\.\.>|\.>|\-\-\->|\-\->|\->|<\-\-\-|<\-\-|<|--|\.\.|-\w+->|\.\w+\.>|\->>|-->>)(\+\+|\-\-)?\s*(?:"([^"]+)")?\s*([A-Za-z0-9_\[\]\(\):]+|\[\*\])(\+\+|\-\-)?(?:\s*:\s*(.+))?$/;
    const relMatch = line.match(relRegex);

    if (relMatch) {
      let rawSourceStr = relMatch[1].trim();
      let rawTargetStr = relMatch[6].trim();
      let relType = relMatch[3];
      const inlineActTarget = relMatch[7];
      let label = relMatch[8]?.trim() || '';

      let sourceId = rawSourceStr.replace(/[\[\]\(\):]/g, '');
      let targetId = rawTargetStr.replace(/[\[\]\(\):]/g, '');

      // Normalize left-pointing arrows
      if (relType.startsWith('<') && !relType.startsWith('<|')) {
        const temp = sourceId;
        sourceId = targetId;
        targetId = temp;
        relType = relType.includes('.') ? '..>' : '-->';
      }

      // Unique Scoped Node IDs for [*]
      let sourceIsStart = false;
      let targetIsEnd = false;

      if (rawSourceStr === '[*]') {
        startNodeCounter++;
        sourceId = `start_${activeContainerId || 'top'}_${startNodeCounter}`;
        sourceIsStart = true;
      }
      if (rawTargetStr === '[*]') {
        endNodeCounter++;
        targetId = `end_${activeContainerId || 'top'}_${endNodeCounter}`;
        targetIsEnd = true;
      }

      [
        { id: sourceId, isSpecial: sourceIsStart, type: 'start' },
        { id: targetId, isSpecial: targetIsEnd, type: 'end' },
      ].forEach(({ id, isSpecial, type }) => {
        if (!processedNodeIds.has(id)) {
          nodes.push({
            id,
            label: isSpecial ? '' : id,
            type: isSpecial ? (type as NodeType) : isSequence ? 'participant' : 'state',
            parentId: activeContainerId,
            regionIndex: activeContainerId ? activeRegionIndex : undefined,
          });
          processedNodeIds.add(id);
        }
      });

      const edgeObj: ParsedEdge = {
        id: `e_${sourceId}_${targetId}_${edges.length}`,
        source: sourceId,
        target: targetId,
        relType,
        label,
      };

      edges.push(edgeObj);

      if (isSequence) {
        sequenceEvents.push({ type: 'message', data: edgeObj });
        if (inlineActTarget === '++') sequenceEvents.push({ type: 'activate', data: { participantId: targetId } });
        if (inlineActTarget === '--') sequenceEvents.push({ type: 'deactivate', data: { participantId: targetId } });
      }
    }
  }

  return { diagramType, nodes, edges, containers, sequenceEvents };
}