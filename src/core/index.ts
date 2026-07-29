import { parsePuml } from '../parser/parsePuml';
import { calculateLayout } from '../layout/calculateLayout';
import { buildMxGraph } from '../builder/buildMxGraph';
import { ThemeName } from '../themes/themeManager';

export interface ConversionResult {
  xml: string;
  diagramType: 'general' | 'sequence';
  error?: string;
}

export function convertPumlToDrawIo(
  pumlCode: string,
  theme: ThemeName = 'classic'
): ConversionResult {
  if (!pumlCode.trim()) {
    return { xml: '', diagramType: 'general' };
  }

  try {
    const parsed = parsePuml(pumlCode);
    const layout = calculateLayout(parsed);
    const xml = buildMxGraph(layout, { theme });
    return { xml, diagramType: parsed.diagramType };
  } catch (err: any) {
    return { xml: '', diagramType: 'general', error: err.message || 'Parsing failed' };
  }
}

export type { ThemeName };
