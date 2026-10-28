// Game dimensions (Responsive Dual-Orientation: 16:9 Landscape & 9:16 Portrait)
export const LANDSCAPE_WIDTH = 1280;
export const LANDSCAPE_HEIGHT = 720;
export const PORTRAIT_WIDTH = 720;
export const PORTRAIT_HEIGHT = 1280;

// Default fallback dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Grid settings
export const CELL_SIZE = 96;
export const GRID_PADDING = 24;

// High-tech Cyberpunk Google Fonts
export const FONTS = {
  TITLE: "'Orbitron', 'Rajdhani', sans-serif",
  UI: "'Rajdhani', 'Orbitron', sans-serif",
  MONO: "'Orbitron', monospace",
};

// Cyberpunk Circuit Colors
export const COLORS = {
  // Background & Board
  BG_DARK: 0x060c18,
  BG_CARD: 0x0c1a2e,
  BG_HOVER: 0x142844,
  BOARD_BG: 0x081322,
  BOARD_BORDER: 0x00f0ff,
  BOARD_GRID: 0x12243d,

  // Neon Signal Glow
  SIGNAL_ON: 0x00ff9d,       // Vivid Neon Green (Active High 1)
  SIGNAL_ON_GLOW: 0x00ffbb,  // Electric mint cyan glow
  SIGNAL_OFF: 0x1e3247,      // Inactive dark wire (Low 0)
  SIGNAL_WRONG: 0xff2a55,    // Mismatched / unpowered
  WIRE_COPPER: 0xd49339,     // Unpowered copper PCB trace

  // Cyberpunk Accents
  CYBER_CYAN: 0x00f0ff,
  CYBER_PURPLE: 0x9d4edd,
  CYBER_PINK: 0xff007f,
  CYBER_YELLOW: 0xffd000,
  CYBER_GOLD: 0xffc400,

  // Gate Visuals
  GATE_BODY: 0x0f2138,
  GATE_BODY_LOCKED: 0x1a2636,     // Heavy metallic locked base
  GATE_BORDER: 0x00d2ff,
  GATE_BORDER_LOCKED: 0x6e8294,   // Industrial steel border
  GATE_TEXT: 0xffffff,

  // LED States
  LED_ON: 0x00ff9d,
  LED_OFF: 0x172535,
  LED_GLOW: 0x00ffaa,
  LED_ZERO_TARGET: 0x00b4d8,     // Target 0 indicator (Cyan blue)
  LED_ZERO_MATCH: 0x00f5d4,      // Target 0 matched
  LED_ALERT_RED: 0xff2255,       // Short-circuit / mismatch red

  // Short Circuit Penalty
  SHORT_CIRCUIT_RED: 0xff1744,
  SHORT_CIRCUIT_GLOW: 0xff5252,

  // UI
  UI_PANEL: 0x0a182b,
  UI_BORDER: 0x00f0ff,
  UI_PRIMARY: 0x00f0ff,
  UI_SECONDARY: 0x00c4e8,
  UI_TEXT_MAIN: 0xffffff,
  UI_TEXT_MUTED: 0x82a5c7,
  UI_TEXT_CYAN: 0x00f0ff,
  UI_BUTTON: 0x102540,
  UI_BUTTON_HOVER: 0x193b66,
  UI_BUTTON_ACTIVE: 0x00c282,
  SUCCESS: 0x00ff9d,
  PCB_TRACE: 0xd49339,
};

// Gate types
export enum GateType {
  WIRE = 'WIRE',                 // Straight wire (Left-Right at 0)
  WIRE_CORNER = 'WIRE_CORNER',   // 90° corner wire (Left-Down at 0)
  SPLIT = 'SPLIT',               // T-Junction wire (Left-Right-Down at 0)
  SPLIT_4 = 'SPLIT_4',           // 4-Way Cross Splitter (Left-Right-Up-Down)
  CROSSOVER = 'CROSSOVER',       // Wire Bridge / Cầu vượt cáp (H & V independent)
  DIODE = 'DIODE',               // Cổng 1 chiều (Unidirectional diode)
  NOT = 'NOT',                   // Inverter
  AND = 'AND',                   // AND Gate
  OR = 'OR',                     // OR Gate
  XOR = 'XOR',                   // XOR Gate
  NAND = 'NAND',                 // NAND Gate (AND + NOT)
  NOR = 'NOR',                   // NOR Gate (OR + NOT)
  XNOR = 'XNOR',                 // XNOR Gate (XOR + NOT)
  SOURCE = 'SOURCE',             // Power input 0 or 1
  LED = 'LED',                   // Target LED
  EMPTY = 'EMPTY',
}

// Direction enum (0=UP, 1=RIGHT, 2=DOWN, 3=LEFT)
export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

// Port definition
export interface Port {
  direction: Direction;
  isInput: boolean;
  signal?: number; // 0 or 1
  channel?: 'H' | 'V'; // For crossover bridge independent routing
}

// Gate definition for a cell
export interface GateDefinition {
  type: GateType;
  rotation: number;          // Current rotation: 0, 1, 2, 3
  correctRotation: number;   // Solution rotation: 0, 1, 2, 3
  fixed: boolean;            // Fixed / locked metallic cells cannot be rotated
  locked?: boolean;          // Locked by Hint button
  ports?: Port[];            // Optional custom ports
}

// Multi-Test-Case definition (Truth Table testing)
export interface TestCase {
  name?: string;
  description?: string;
  sources: { row: number; col: number; value: number }[];
  leds: { row: number; col: number; targetSignal: number }[];
}

// Level definition
export interface LevelDefinition {
  id: number;
  chapter: number;           // Chapter 1 to 5 (or 6 for Endless)
  name: string;
  subtitle: string;
  gridWidth: number;
  gridHeight: number;
  tutorialText: string;
  timeLimit: number;         // Time limit in seconds
  parMoves: number;          // Optimal moves for 3-star rating
  maxMoves?: number;         // Move limit: maximum allowed rotations before game over
  cells: (GateDefinition | null)[][];
  sources: { row: number; col: number; value: number }[];
  leds: { row: number; col: number; targetSignal?: number }[]; // targetSignal: 1 (default) or 0
  testCases?: TestCase[];    // Dynamic clock / truth-table test cases
}

// Animation durations
export const ANIM = {
  ROTATE_DURATION: 160,
  HINT_ROTATE_DURATION: 260,
  SIGNAL_PULSE_SPEED: 350,
  LED_GLOW_DURATION: 350,
  WIN_DELAY: 800,
};

// Touch settings
export const TOUCH = {
  LONG_PRESS_MS: 380,
  TAP_THRESHOLD_PX: 14,
};
