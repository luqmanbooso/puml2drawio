import { ParsedGraph, SequenceActivation, SequenceGroup, SequenceNote } from '../types';

export function calculateSequenceLayout(parsed: ParsedGraph) {
  const nodes = [...parsed.nodes];
  const edges = [...parsed.edges];
  const events = parsed.sequenceEvents || [];

  const PARTICIPANT_SPACING = 220;
  const START_X = 120;
  const BASELINE_Y = 120;
  const STEP_Y = 55;

  // 1. Position Participant Lifelines
  nodes.forEach((node, idx) => {
    let width = 120;
    let height = 45;

    if (node.type === 'actor') {
      width = 45;
      height = 70;
    } else if (node.type === 'database') {
      width = 75;
      height = 65;
    }

    node.width = width;
    node.height = height;
    node.x = START_X + idx * PARTICIPANT_SPACING;
    node.y = BASELINE_Y - height;
  });

  const participantXMap = new Map<string, number>();
  nodes.forEach((node) => participantXMap.set(node.id, node.x!));

  const lastParticipantYMap = new Map<string, number>();

  // 2. Step-by-Step Vertical Timeline Traversal
  let currentY = BASELINE_Y + 40;

  const activations: SequenceActivation[] = [];
  const openActivationsMap = new Map<string, SequenceActivation>();

  const groups: SequenceGroup[] = [];
  const groupStack: SequenceGroup[] = [];

  const notes: SequenceNote[] = [];

  events.forEach((evt) => {
    switch (evt.type) {
      case 'message': {
        const edge = evt.data;
        edge.yPosition = currentY;

        lastParticipantYMap.set(edge.source, currentY);
        lastParticipantYMap.set(edge.target, currentY);

        currentY += STEP_Y;
        break;
      }
      case 'activate': {
        const pId = evt.data.participantId;
        const act: SequenceActivation = { participantId: pId, startY: currentY - 15 };
        activations.push(act);
        openActivationsMap.set(pId, act);
        break;
      }
      case 'deactivate': {
        const pId = evt.data.participantId;
        const act = openActivationsMap.get(pId);
        if (act) {
          act.endY = currentY - 15;
          openActivationsMap.delete(pId);
        }
        break;
      }
      case 'groupStart': {
        currentY += 10;
        const grp: SequenceGroup = {
          id: `grp_${groups.length}`,
          type: evt.data.type,
          label: evt.data.label,
          startY: currentY - 20,
          dividers: [],
        };
        groups.push(grp);
        groupStack.push(grp);
        currentY += 15;
        break;
      }
      case 'groupElse': {
        currentY += 25; // Padding before divider line
        const currentGrp = groupStack[groupStack.length - 1];
        if (currentGrp) {
          currentGrp.dividers?.push({ y: currentY, label: evt.data.label });
          currentY += 30; // Padding after divider line
        }
        break;
      }
      case 'groupEnd': {
        currentY += 15;
        const currentGrp = groupStack.pop();
        if (currentGrp) {
          currentGrp.endY = currentY - 10;
          currentY += 25;
        }
        break;
      }
      case 'note': {
        currentY += 10; // Padding before note card
        const note: SequenceNote = {
          id: `note_${notes.length}`,
          participantId: evt.data.participantId,
          position: evt.data.position,
          text: evt.data.text,
          yPosition: currentY,
        };
        notes.push(note);
        currentY += 55; // Vertical space reserved for 40px note height
        break;
      }
    }
  });

  // Automatically cap open activation lifespans at last message activity
  openActivationsMap.forEach((act, pId) => {
    const lastY = lastParticipantYMap.get(pId);
    act.endY = lastY ? lastY + 10 : currentY - 20;
  });

  groupStack.forEach((grp) => {
    grp.endY = currentY;
  });

  const totalHeight = currentY + 40;

  return {
    diagramType: 'sequence' as const,
    nodes,
    edges,
    activations,
    groups,
    notes,
    totalHeight,
    participantXMap,
    baselineY: BASELINE_Y,
  };
}
