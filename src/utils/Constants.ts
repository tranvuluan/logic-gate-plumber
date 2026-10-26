// Game dimensions (portrait mode, standard mobile)
export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// Grid settings
export const CELL_SIZE = 110;
export const GRID_PADDING = 30;

// Cyberpunk Circuit Colors
export const COLORS = {
  // Background & Board
  BG_DARK: 0x070e1b,
  BG_CARD: 0x0f1c30,
  BG_HOVER: 0x162a48,
  BOARD_BG: 0x091424,
  BOARD_BORDER: 0x00f0ff,
  BOARD_GRID: 0x142844,

  // Neon Signal Glow
  SIGNAL_ON: 0x00ff88,       // Neon Green (Active High 1)
  SIGNAL_ON_GLOW: 0x00ffaa,  // Lighter cyan-green glow
  SIGNAL_OFF: 0x22364c,      // Inactive dark wire (Low 0)
  SIGNAL_WRONG: 0xff2a55,    // Mismatched / unpowered
  WIRE_COPPER: 0xbf8230,     // Unpowered copper trace

  // Cyberpunk Accents
  CYBER_CYAN: 0x00f0ff,
  CYBER_PURPLE: 0x8b00ff,
  CYBER_PINK: 0xff007f,
  CYBER_YELLOW: 0xffd000,
  CYBER_GOLD: 0xffc400,

  // Gate Visuals
  GATE_BODY: 0x112238,
  GATE_BODY_LOCKED: 0x1e3020,
  GATE_BORDER: 0x00a8cc,
  GATE_BORDER_LOCKED: 0xffc400,
  GATE_TEXT: 0xffffff,

  // LED States
  LED_ON: 0x00ff66,
  LED_OFF: 0x1c2b3a,
  LED_GLOW: 0x00ff88,

  // UI
  UI_PANEL: 0x0d1a2d,
  UI_BORDER: 0x00aaff,
  UI_PRIMARY: 0x00f0ff,
  UI_SECONDARY: 0x00a8cc,
  UI_TEXT_MAIN: 0xffffff,
  UI_TEXT_MUTED: 0x7a99b8,
  UI_TEXT_CYAN: 0x00f0ff,
  UI_BUTTON: 0x132a48,
  UI_BUTTON_HOVER: 0x1b3c66,
  UI_BUTTON_ACTIVE: 0x00a870,
  SUCCESS: 0x00ff88,
  PCB_TRACE: 0xbf8230,
};

// Gate types
export enum GateType {
  WIRE = 'WIRE',                 // Straight wire (Left-Right at 0)
  WIRE_CORNER = 'WIRE_CORNER',   // 90° corner wire (Left-Down at 0)
  SPLIT = 'SPLIT',               // T-Junction wire (Left-Right-Down at 0)
  NOT = 'NOT',                   // Inverter
  AND = 'AND',                   // AND Gate
  OR = 'OR',                     // OR Gate
  XOR = 'XOR',                   // XOR Gate
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
}

// Gate definition for a cell
export interface GateDefinition {
  type: GateType;
  rotation: number;          // Current rotation: 0, 1, 2, 3
  correctRotation: number;   // Solution rotation: 0, 1, 2, 3
  fixed: boolean;            // Fixed cells cannot be rotated
  locked?: boolean;          // Locked by Hint button
  ports?: Port[];            // Optional custom ports
}

// Level definition
export interface LevelDefinition {
  id: number;
  name: string;
  subtitle: string;
  gridWidth: number;
  gridHeight: number;
  tutorialText: string;
  timeLimit: number;         // Time limit in seconds
  cells: (GateDefinition | null)[][];
  sources: { row: number; col: number; value: number }[];
  leds: { row: number; col: number }[];
}

// Animation durations
export const ANIM = {
  ROTATE_DURATION: 180,
  HINT_ROTATE_DURATION: 300,
  SIGNAL_PULSE_SPEED: 400,
  LED_GLOW_DURATION: 400,
  WIN_DELAY: 900,
};

// Touch settings
export const TOUCH = {
  LONG_PRESS_MS: 400,
  TAP_THRESHOLD_PX: 16,
};
