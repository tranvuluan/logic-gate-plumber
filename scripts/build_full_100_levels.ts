import * as fs from 'fs';
import { GateType, Direction, GateDefinition, LevelDefinition, TestCase } from '../src/utils/Constants';
import { getDefaultPorts } from '../src/logic/GateTypes';
import { SignalEngine } from '../src/logic/SignalEngine';

export interface PlacementDef {
  r: number;
  c: number;
  type: GateType;
  correctRotation: number;
  fixed?: boolean;
}

export function createGrid(rows: number, cols: number, placements: PlacementDef[], scramble: boolean = true): (GateDefinition | null)[][] {
  const grid: (GateDefinition | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = null;
  }
  let seed = 42;
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (const p of placements) {
    let initialRot = p.correctRotation;
    if (scramble && !p.fixed && p.type !== GateType.SOURCE && p.type !== GateType.LED) {
      if (p.type === GateType.WIRE) {
        initialRot = (p.correctRotation + 1) % 2;
      } else {
        const offset = 1 + Math.floor(pseudoRand() * 3);
        initialRot = (p.correctRotation + offset) % 4;
      }
    }

    grid[p.r][p.c] = {
      type: p.type,
      rotation: initialRot,
      correctRotation: p.correctRotation,
      fixed: p.fixed || false,
      ports: getDefaultPorts(p.type),
    };
  }
  return grid;
}

export function testLevelSolvability(lvl: LevelDefinition): { passed: boolean; shortCircuit: boolean } {
  const grid = lvl.cells.map(row => row.map(cell => cell ? { ...cell, rotation: cell.correctRotation } : null));
  const engine = new SignalEngine(grid, lvl.gridHeight, lvl.gridWidth);

  let passed = false;
  if (lvl.testCases && lvl.testCases.length > 0) {
    passed = engine.evaluateAllTestCases(lvl.testCases).allPassed;
  } else {
    engine.propagate(lvl.sources);
    passed = engine.checkWin(lvl.leds);
  }

  return { passed, shortCircuit: engine.hasShortCircuit() };
}

// ==========================================
// ARCHETYPE 1: Single Gate with Decorators (5x4 / 5x5)
// ==========================================
export function buildSingleGateLevel(
  id: number,
  chapter: number,
  name: string,
  subtitle: string,
  tutorialText: string,
  gateType: GateType,
  s1: number,
  s2: number,
  targetSignal: number,
  decorator?: { type: GateType; col: number }
): LevelDefinition {
  const W = 5;
  const H = 4;
  const placements: PlacementDef[] = [
    { r: 0, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 2, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 0, c: 1, type: GateType.WIRE_CORNER, correctRotation: 0, fixed: false },
    { r: 2, c: 1, type: GateType.WIRE_CORNER, correctRotation: 1, fixed: false },
    { r: 1, c: 1, type: gateType, correctRotation: 0, fixed: false },
  ];

  if (decorator) {
    placements.push({ r: 1, c: 2, type: decorator.type, correctRotation: 0, fixed: false });
    placements.push({ r: 1, c: 3, type: GateType.WIRE, correctRotation: 0, fixed: false });
  } else {
    placements.push({ r: 1, c: 2, type: GateType.WIRE, correctRotation: 0, fixed: false });
    placements.push({ r: 1, c: 3, type: GateType.WIRE, correctRotation: 0, fixed: false });
  }
  placements.push({ r: 1, c: 4, type: GateType.LED, correctRotation: 0, fixed: true });

  const sources = [
    { row: 0, col: 0, value: s1 },
    { row: 2, col: 0, value: s2 },
  ];
  const leds = [{ row: 1, col: 4, targetSignal }];

  const rotatableCount = placements.filter(p => !p.fixed && p.type !== GateType.SOURCE && p.type !== GateType.LED).length;

  return {
    id,
    chapter,
    name,
    subtitle,
    gridWidth: W,
    gridHeight: H,
    timeLimit: 75,
    parMoves: Math.max(3, rotatableCount + 2),
    tutorialText,
    sources,
    leds,
    cells: createGrid(H, W, placements),
  };
}

// ==========================================
// ARCHETYPE 2: Crossover Highway (6x6 / 7x7 / 8x8)
// ==========================================
export function buildCrossoverHighwayLevel(
  id: number,
  chapter: number,
  name: string,
  subtitle: string,
  tutorialText: string,
  cfg: {
    W?: number;
    H?: number;
    rh: number;
    cc: number;
    sh: number;
    sv: number;
    gateH?: GateType;
    gateV?: GateType;
    targetH?: number;
    targetV?: number;
    lockedCross?: boolean;
    lockedAnchor?: { r: number; c: number; type: GateType; rot: number };
  }
): LevelDefinition {
  const W = cfg.W || 6;
  const H = cfg.H || 6;
  const rh = cfg.rh;
  const cc = cfg.cc;
  const targetH = cfg.targetH ?? 1;
  const targetV = cfg.targetV ?? 1;

  const placements: PlacementDef[] = [
    // Horizontal Path
    { r: rh, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: rh, c: cc, type: GateType.CROSSOVER, correctRotation: 0, fixed: cfg.lockedCross || false },
    { r: rh, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },

    // Vertical Path
    { r: 0, c: cc, type: GateType.SOURCE, correctRotation: 1, fixed: true },
    { r: H - 1, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },
  ];

  // Horizontal wires/gates before crossover
  for (let c = 1; c < cc; c++) {
    placements.push({ r: rh, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
  }
  // Horizontal wires/gates after crossover
  for (let c = cc + 1; c < W - 1; c++) {
    const isGate = c === cc + 1 && cfg.gateH;
    placements.push({
      r: rh,
      c,
      type: isGate ? cfg.gateH! : GateType.WIRE,
      correctRotation: 0,
      fixed: false,
    });
  }

  // Vertical wires before crossover
  for (let r = 1; r < rh; r++) {
    placements.push({ r, c: cc, type: GateType.WIRE, correctRotation: 1, fixed: false });
  }
  // Vertical wires after crossover until turn row (H-1)
  for (let r = rh + 1; r < H - 1; r++) {
    placements.push({ r, c: cc, type: GateType.WIRE, correctRotation: 1, fixed: false });
  }

  // Corner at (H - 1, cc) turning UP & RIGHT
  placements.push({ r: H - 1, c: cc, type: GateType.WIRE_CORNER, correctRotation: 2, fixed: false });

  // From turn to LED
  for (let c = cc + 1; c < W - 1; c++) {
    const isGate = c === cc + 1 && cfg.gateV;
    placements.push({
      r: H - 1,
      c,
      type: isGate ? cfg.gateV! : GateType.WIRE,
      correctRotation: 0,
      fixed: false,
    });
  }

  if (cfg.lockedAnchor) {
    placements.push({
      r: cfg.lockedAnchor.r,
      c: cfg.lockedAnchor.c,
      type: cfg.lockedAnchor.type,
      correctRotation: cfg.lockedAnchor.rot,
      fixed: true,
    });
  }

  const sources = [
    { row: rh, col: 0, value: cfg.sh },
    { row: 0, col: cc, value: cfg.sv },
  ];
  const leds = [
    { row: rh, col: W - 1, targetSignal: targetH },
    { row: H - 1, col: W - 1, targetSignal: targetV },
  ];

  const rotatableCount = placements.filter(p => !p.fixed && p.type !== GateType.SOURCE && p.type !== GateType.LED).length;

  return {
    id,
    chapter,
    name,
    subtitle,
    gridWidth: W,
    gridHeight: H,
    timeLimit: 100,
    parMoves: Math.max(5, rotatableCount + 3),
    tutorialText,
    sources,
    leds,
    cells: createGrid(H, W, placements),
  };
}

// ==========================================
// ARCHETYPE 3: Cascade 2-Stage Tree (6x6 / 7x7 / 8x8)
// ==========================================
export function buildCascadeTreeLevel(
  id: number,
  chapter: number,
  name: string,
  subtitle: string,
  tutorialText: string,
  cfg: {
    W?: number;
    H?: number;
    g1: GateType;
    g2: GateType;
    g3: GateType;
    s: [number, number, number, number];
    targetSignal?: number;
    lockedAnchor?: boolean;
    postGate?: GateType;
  }
): LevelDefinition {
  const W = cfg.W || 6;
  const H = cfg.H || 6;
  const targetSignal = cfg.targetSignal ?? 1;

  const placements: PlacementDef[] = [
    // 4 Sources
    { r: 0, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 2, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 3, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 5, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },

    // Stage 1 corners into Gate 1 (1, 1) and Gate 2 (4, 1)
    { r: 0, c: 1, type: GateType.WIRE_CORNER, correctRotation: 0, fixed: false },
    { r: 2, c: 1, type: GateType.WIRE_CORNER, correctRotation: 1, fixed: false },
    { r: 1, c: 1, type: cfg.g1, correctRotation: 0, fixed: false },

    { r: 3, c: 1, type: GateType.WIRE_CORNER, correctRotation: 0, fixed: false },
    { r: 5, c: 1, type: GateType.WIRE_CORNER, correctRotation: 1, fixed: false },
    { r: 4, c: 1, type: cfg.g2, correctRotation: 0, fixed: false },

    // Stage 1 outputs to Stage 2 Gate 3 at (2, 3)
    { r: 1, c: 2, type: GateType.WIRE, correctRotation: 0, fixed: false },
    { r: 1, c: 3, type: GateType.WIRE_CORNER, correctRotation: 0, fixed: false },

    { r: 4, c: 2, type: GateType.WIRE, correctRotation: 0, fixed: false },
    { r: 4, c: 3, type: GateType.WIRE_CORNER, correctRotation: 1, fixed: false },
    { r: 3, c: 3, type: GateType.WIRE, correctRotation: 1, fixed: false },

    // Stage 2 Gate 3
    { r: 2, c: 3, type: cfg.g3, correctRotation: 0, fixed: cfg.lockedAnchor || false },

    // Output to LED
    {
      r: 2,
      c: 4,
      type: cfg.postGate ? cfg.postGate : GateType.WIRE,
      correctRotation: 0,
      fixed: false,
    },
    { r: 2, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },
  ];

  if (W > 6) {
    for (let c = 5; c < W - 1; c++) {
      placements.push({ r: 2, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
    }
  }

  const sources = [
    { row: 0, col: 0, value: cfg.s[0] },
    { row: 2, col: 0, value: cfg.s[1] },
    { row: 3, col: 0, value: cfg.s[2] },
    { row: 5, col: 0, value: cfg.s[3] },
  ];
  const leds = [{ row: 2, col: W - 1, targetSignal }];

  const rotatableCount = placements.filter(p => !p.fixed && p.type !== GateType.SOURCE && p.type !== GateType.LED).length;

  return {
    id,
    chapter,
    name,
    subtitle,
    gridWidth: W,
    gridHeight: H,
    timeLimit: 110,
    parMoves: Math.max(7, rotatableCount + 3),
    tutorialText,
    sources,
    leds,
    cells: createGrid(H, W, placements),
  };
}

// ==========================================
// ARCHETYPE 4: Split Distribution (6x5 / 6x6 / 7x7)
// ==========================================
export function buildSplitDistributionLevel(
  id: number,
  chapter: number,
  name: string,
  subtitle: string,
  tutorialText: string,
  cfg: {
    W?: number;
    H?: number;
    g1: GateType;
    g2: GateType;
    s1: number;
    target1?: number;
    target2?: number;
    lockedSplit?: boolean;
    lockedAnchor?: { r: number; c: number; type: GateType; rot: number };
  }
): LevelDefinition {
  const W = cfg.W || 6;
  const H = cfg.H || 5;
  const target1 = cfg.target1 ?? 1;
  const target2 = cfg.target2 ?? 1;

  const placements: PlacementDef[] = [
    // Primary Source at (2, 0)
    { r: 2, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 2, c: 1, type: GateType.WIRE, correctRotation: 0, fixed: false },
    // Splitter at (2, 2) rot 1: connects LEFT, UP, DOWN
    { r: 2, c: 2, type: GateType.SPLIT, correctRotation: 1, fixed: cfg.lockedSplit || false },

    // Branch 1 (UP): corner at (1, 2) rot 3 (DOWN & RIGHT) -> Gate 1 at (1, 3) -> LED 1 at (1, W-1)
    { r: 1, c: 2, type: GateType.WIRE_CORNER, correctRotation: 3, fixed: false },
    { r: 1, c: 3, type: cfg.g1, correctRotation: 0, fixed: false },
    { r: 1, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },

    // Branch 2 (DOWN): corner at (3, 2) rot 2 (UP & RIGHT) -> Gate 2 at (3, 3) -> LED 2 at (3, W-1)
    { r: 3, c: 2, type: GateType.WIRE_CORNER, correctRotation: 2, fixed: false },
    { r: 3, c: 3, type: cfg.g2, correctRotation: 0, fixed: false },
    { r: 3, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },
  ];

  for (let c = 4; c < W - 1; c++) {
    placements.push({ r: 1, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
    placements.push({ r: 3, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
  }

  if (cfg.lockedAnchor) {
    placements.push({
      r: cfg.lockedAnchor.r,
      c: cfg.lockedAnchor.c,
      type: cfg.lockedAnchor.type,
      correctRotation: cfg.lockedAnchor.rot,
      fixed: true,
    });
  }

  const sources = [{ row: 2, col: 0, value: cfg.s1 }];
  const leds = [
    { row: 1, col: W - 1, targetSignal: target1 },
    { row: 3, col: W - 1, targetSignal: target2 },
  ];

  const rotatableCount = placements.filter(p => !p.fixed && p.type !== GateType.SOURCE && p.type !== GateType.LED).length;

  return {
    id,
    chapter,
    name,
    subtitle,
    gridWidth: W,
    gridHeight: H,
    timeLimit: 90,
    parMoves: Math.max(5, rotatableCount + 2),
    tutorialText,
    sources,
    leds,
    cells: createGrid(H, W, placements),
  };
}

// ==========================================
// ARCHETYPE 5: Cross Splitter 4-Way (7x7 / 8x8)
// ==========================================
export function buildCrossSplitter4Level(
  id: number,
  chapter: number,
  name: string,
  subtitle: string,
  tutorialText: string,
  cfg: {
    W?: number;
    H?: number;
    sVal: number;
    gUp: GateType;
    gRight: GateType;
    gDown: GateType;
    targetUp?: number;
    targetRight?: number;
    targetDown?: number;
    lockedSplitter?: boolean;
    lockedAnchor?: { r: number; c: number; type: GateType; rot: number };
  }
): LevelDefinition {
  const W = cfg.W || 7;
  const H = cfg.H || 7;
  const rc = Math.floor(H / 2);
  const cc = 2;

  const placements: PlacementDef[] = [
    { r: rc, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: rc, c: 1, type: GateType.WIRE, correctRotation: 0, fixed: false },
    { r: rc, c: cc, type: GateType.SPLIT_4, correctRotation: 0, fixed: cfg.lockedSplitter || false },

    // Branch UP
    { r: rc - 1, c: cc, type: GateType.WIRE_CORNER, correctRotation: 3, fixed: false },
    { r: rc - 1, c: cc + 1, type: cfg.gUp, correctRotation: 0, fixed: false },
    { r: rc - 1, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },

    // Branch RIGHT
    { r: rc, c: cc + 1, type: cfg.gRight, correctRotation: 0, fixed: false },
    { r: rc, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },

    // Branch DOWN
    { r: rc + 1, c: cc, type: GateType.WIRE_CORNER, correctRotation: 2, fixed: false },
    { r: rc + 1, c: cc + 1, type: cfg.gDown, correctRotation: 0, fixed: false },
    { r: rc + 1, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },
  ];

  for (let c = cc + 2; c < W - 1; c++) {
    placements.push({ r: rc - 1, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
    placements.push({ r: rc, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
    placements.push({ r: rc + 1, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
  }

  if (cfg.lockedAnchor) {
    placements.push({
      r: cfg.lockedAnchor.r,
      c: cfg.lockedAnchor.c,
      type: cfg.lockedAnchor.type,
      correctRotation: cfg.lockedAnchor.rot,
      fixed: true,
    });
  }

  const sources = [{ row: rc, col: 0, value: cfg.sVal }];
  const leds = [
    { row: rc - 1, col: W - 1, targetSignal: cfg.targetUp ?? 1 },
    { row: rc, col: W - 1, targetSignal: cfg.targetRight ?? 1 },
    { row: rc + 1, col: W - 1, targetSignal: cfg.targetDown ?? 1 },
  ];

  const rotatableCount = placements.filter(p => !p.fixed && p.type !== GateType.SOURCE && p.type !== GateType.LED).length;

  return {
    id,
    chapter,
    name,
    subtitle,
    gridWidth: W,
    gridHeight: H,
    timeLimit: 120,
    parMoves: Math.max(6, rotatableCount + 2),
    tutorialText,
    sources,
    leds,
    cells: createGrid(H, W, placements),
  };
}

// ==========================================
// ARCHETYPE 6: Dynamic Controlled Inverter / Clocked Gate (5x4 / 6x5 / 7x6)
// ==========================================
export function buildControlledInverterLevel(
  id: number,
  chapter: number,
  name: string,
  subtitle: string,
  tutorialText: string,
  cfg: {
    W?: number;
    H?: number;
    gateType?: GateType;
    lockedGate?: boolean;
    postGate?: GateType;
  }
): LevelDefinition {
  const W = cfg.W || 5;
  const H = cfg.H || 4;

  const placements: PlacementDef[] = [
    { r: 0, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 2, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 0, c: 1, type: GateType.WIRE_CORNER, correctRotation: 0, fixed: false },
    { r: 2, c: 1, type: GateType.WIRE_CORNER, correctRotation: 1, fixed: false },
    { r: 1, c: 1, type: cfg.gateType || GateType.XOR, correctRotation: 0, fixed: cfg.lockedGate || false },
    { r: 1, c: 2, type: cfg.postGate ? cfg.postGate : GateType.WIRE, correctRotation: 0, fixed: false },
    { r: 1, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },
  ];

  for (let c = 3; c < W - 1; c++) {
    placements.push({ r: 1, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
  }

  const isXor = (cfg.gateType || GateType.XOR) === GateType.XOR;
  const isPostNot = cfg.postGate === GateType.NOT;

  // If XOR: A=1, C=0 => 1 (with NOT => 0); A=1, C=1 => 0 (with NOT => 1)
  const targetT0 = isXor ? (isPostNot ? 0 : 1) : (isPostNot ? 1 : 0);
  const targetT1 = isXor ? (isPostNot ? 1 : 0) : (isPostNot ? 0 : 1);

  const testCases: TestCase[] = [
    {
      description: 'Xung nhịp T0: C=0',
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
      ],
      leds: [{ row: 1, col: W - 1, targetSignal: targetT0 }],
    },
    {
      description: 'Xung nhịp T1: C=1',
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 1 },
      ],
      leds: [{ row: 1, col: W - 1, targetSignal: targetT1 }],
    },
  ];

  const rotatableCount = placements.filter(p => !p.fixed && p.type !== GateType.SOURCE && p.type !== GateType.LED).length;

  return {
    id,
    chapter,
    name,
    subtitle,
    gridWidth: W,
    gridHeight: H,
    timeLimit: 90,
    parMoves: Math.max(4, rotatableCount + 2),
    tutorialText,
    sources: testCases[0].sources,
    leds: testCases[0].leds,
    testCases,
    cells: createGrid(H, W, placements),
  };
}

console.log('All 6 archetypes ready.');
