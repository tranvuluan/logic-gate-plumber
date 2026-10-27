import { GateType, Direction, GateDefinition, LevelDefinition, TestCase } from '../src/utils/Constants';
import { getDefaultPorts } from '../src/logic/GateTypes';
import { SignalEngine } from '../src/logic/SignalEngine';
import {
  PlacementDef,
  createGrid,
  testLevelSolvability,
} from './build_full_100_levels';

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
  }
): LevelDefinition {
  const W = cfg.W || 5;
  const H = cfg.H || 4;

  const placements: PlacementDef[] = [
    { r: 0, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 2, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
    { r: 0, c: 1, type: GateType.WIRE_CORNER, correctRotation: 0, fixed: false },
    { r: 2, c: 1, type: GateType.WIRE_CORNER, correctRotation: 1, fixed: false },
    { r: 1, c: 1, type: cfg.gateType || GateType.XOR, correctRotation: 0, fixed: false },
    { r: 1, c: 2, type: GateType.WIRE, correctRotation: 0, fixed: false },
    { r: 1, c: W - 1, type: GateType.LED, correctRotation: 0, fixed: true },
  ];

  for (let c = 3; c < W - 1; c++) {
    placements.push({ r: 1, c, type: GateType.WIRE, correctRotation: 0, fixed: false });
  }

  const testCases: TestCase[] = [
    {
      description: 'Xung nhịp T0: Tín hiệu gốc (C=0 -> Ra=1)',
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 0 },
      ],
      leds: [{ row: 1, col: W - 1, targetSignal: 1 }],
    },
    {
      description: 'Xung nhịp T1: Kích hoạt đảo (C=1 -> Ra=0)',
      sources: [
        { row: 0, col: 0, value: 1 },
        { row: 2, col: 0, value: 1 },
      ],
      leds: [{ row: 1, col: W - 1, targetSignal: 0 }],
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

const testLvl = buildControlledInverterLevel(997, 4, 'Controlled Inverter Test', 'Sub', 'Tut', {});
const res = testLevelSolvability(testLvl);
console.log('Controlled Inverter Test:', res.passed ? 'PASS!' : 'FAIL!', 'Short circuit:', res.shortCircuit);
