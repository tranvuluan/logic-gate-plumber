import { GateType, Direction, GateDefinition, LevelDefinition, TestCase } from '../src/utils/Constants';
import { getDefaultPorts } from '../src/logic/GateTypes';
import { SignalEngine } from '../src/logic/SignalEngine';
import {
  PlacementDef,
  createGrid,
  testLevelSolvability,
} from './build_full_100_levels';

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
  }
): LevelDefinition {
  const W = cfg.W || 7;
  const H = cfg.H || 7;
  const rc = 3;
  const cc = 2;

  const placements: PlacementDef[] = [
    // Source
    { r: rc, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: rc, c: 1, type: GateType.WIRE, correctRotation: 0, fixed: false },
    // Cross Splitter at (3, 2)
    { r: rc, c: cc, type: GateType.SPLIT_4, correctRotation: 0, fixed: cfg.lockedSplitter || false },

    // Branch UP: (2, 2) corner rot 3 (DOWN & RIGHT) -> Gate Up at (2, 3) -> LED 1 at (2, W-1)
    { r: rc - 1, c: cc, type: GateType.WIRE_CORNER, correctRotation: 3, fixed: false },
    { r: rc - 1, c: cc + 1, type: cfg.gUp, correctRotation: 0, fixed: false },
    { r: rc - 1, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },

    // Branch RIGHT: (3, 3) Gate Right -> LED 2 at (3, W-1)
    { r: rc, c: cc + 1, type: cfg.gRight, correctRotation: 0, fixed: false },
    { r: rc, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },

    // Branch DOWN: (4, 2) corner rot 2 (UP & RIGHT) -> Gate Down at (4, 3) -> LED 3 at (4, W-1)
    { r: rc + 1, c: cc, type: GateType.WIRE_CORNER, correctRotation: 2, fixed: false },
    { r: rc + 1, c: cc + 1, type: cfg.gDown, correctRotation: 0, fixed: false },
    { r: rc + 1, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },
  ];

  for (let c = cc + 2; c < W - 1; c++) {
    placements.push({ r: rc - 1, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
    placements.push({ r: rc, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
    placements.push({ r: rc + 1, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
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

const testLvl = buildCrossSplitter4Level(998, 3, 'Cross Splitter Test', 'Sub', 'Tut', {
  sVal: 1,
  gUp: GateType.NOT, // 1 -> NOT -> 0 (target 0)
  gRight: GateType.DIODE, // 1 -> DIODE -> 1 (target 1)
  gDown: GateType.WIRE, // 1 -> WIRE -> 1 (target 1)
  targetUp: 0,
  targetRight: 1,
  targetDown: 1,
});

const res = testLevelSolvability(testLvl);
console.log('Cross Splitter 4 Test:', res.passed ? 'PASS!' : 'FAIL!', 'Short circuit:', res.shortCircuit);
