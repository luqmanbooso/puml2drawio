export type ThemeName = 'classic' | 'dracula' | 'aws' | 'nord' | 'monochrome';

export interface ThemeColors {
  canvasBg: string;
  nodeFill: string;
  nodeStroke: string;
  nodeText: string;
  containerFill: string;
  containerBodyFill: string;
  containerStroke: string;
  containerText: string;
  edgeStroke: string;
  edgeText: string;
  labelBg: string;
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  classic: {
    canvasBg: '#ffffff',
    nodeFill: '#dae8fc',
    nodeStroke: '#6c8ebf',
    nodeText: '#000000',
    containerFill: '#e1d5e7',
    containerBodyFill: '#f8f9fa',
    containerStroke: '#9673a6',
    containerText: '#000000',
    edgeStroke: '#333333',
    edgeText: '#000000',
    labelBg: '#ffffff',
  },
  dracula: {
    canvasBg: '#282a36',
    nodeFill: '#44475a',
    nodeStroke: '#bd93f9',
    nodeText: '#f8f8f2',
    containerFill: '#6272a4',
    containerBodyFill: '#21222c',
    containerStroke: '#ff79c6',
    containerText: '#f8f8f2',
    edgeStroke: '#f1fa8c',
    edgeText: '#f8f8f2',
    labelBg: '#21222c',
  },
  aws: {
    canvasBg: '#ffffff',
    nodeFill: '#ffffff',
    nodeStroke: '#232f3e',
    nodeText: '#232f3e',
    containerFill: '#232f3e',
    containerBodyFill: '#f8f9fa',
    containerStroke: '#ff9900',
    containerText: '#ffffff',
    edgeStroke: '#545b64',
    edgeText: '#232f3e',
    labelBg: '#ffffff',
  },
  nord: {
    canvasBg: '#2e3440',
    nodeFill: '#434c5e',
    nodeStroke: '#88c0d0',
    nodeText: '#eceff4',
    containerFill: '#3b4252',
    containerBodyFill: '#2e3440',
    containerStroke: '#81a1c1',
    containerText: '#eceff4',
    edgeStroke: '#d8dee9',
    edgeText: '#eceff4',
    labelBg: '#2e3440',
  },
  monochrome: {
    canvasBg: '#ffffff',
    nodeFill: '#ffffff',
    nodeStroke: '#000000',
    nodeText: '#000000',
    containerFill: '#e0e0e0',
    containerBodyFill: '#ffffff',
    containerStroke: '#000000',
    containerText: '#000000',
    edgeStroke: '#000000',
    edgeText: '#000000',
    labelBg: '#ffffff',
  },
};

export function getTheme(themeName?: string): ThemeColors {
  if (!themeName) return THEMES.classic;
  const key = themeName.toLowerCase().trim() as ThemeName;
  return THEMES[key] || THEMES.classic;
}