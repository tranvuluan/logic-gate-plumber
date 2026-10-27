import { GateType, Direction, GateDefinition, LevelDefinition, TestCase } from '../src/utils/Constants';
import { getDefaultPorts } from '../src/logic/GateTypes';
import { SignalEngine } from '../src/logic/SignalEngine';
import {
  PlacementDef,
  createGrid,
  testLevelSolvability,
  buildSingleGateLevel,
  buildCrossoverHighwayLevel,
  buildCascadeTreeLevel,
} from './build_full_100_levels';

// Test Archetype 4: Split Distribution
export function buildSplitDistributionLevel(
  id: number,
  chapter: number,
  name: string,
  subtitle: string,
  tutorialText: string,
  cfg: {
    W?: number;
    H?: number;
    g1: GateType; // single-input gate or 2-input gate
    g2: GateType;
    s1: number;
    s2?: number; // optional second source for g2
    target1?: number;
    target2?: number;
    lockedSplit?: boolean;
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

// Test this level
const testLvl = buildSplitDistributionLevel(999, 2, 'Test', 'Sub', 'Tut', {
  g1: GateType.NOT, // s1=1 -> NOT -> 0 (target 0)
  g2: GateType.DIODE, // s1=1 -> DIODE -> 1 (target 1)
  s1: 1,
  target1: 0,
  target2: 1,
});

const res = testLevelSolvability(testLvl);
console.log('Split Distribution Test:', res.passed ? 'PASS!' : 'FAIL!', 'Short circuit:', res.shortCircuit);
