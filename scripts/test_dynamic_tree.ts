import { GateType, Direction, GateDefinition, LevelDefinition, TestCase } from '../src/utils/Constants';
import { getDefaultPorts } from '../src/logic/GateTypes';
import { SignalEngine } from '../src/logic/SignalEngine';
import {
  PlacementDef,
  createGrid,
  testLevelSolvability,
  buildCascadeTreeLevel,
} from './build_full_100_levels';

export function buildDynamicClockedTreeLevel(
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
    tc1: { s: [number, number, number, number]; target: number; desc?: string };
    tc2: { s: [number, number, number, number]; target: number; desc?: string };
    tc3?: { s: [number, number, number, number]; target: number; desc?: string };
    lockedAnchor?: boolean;
    postGate?: GateType;
  }
): LevelDefinition {
  const baseLvl = buildCascadeTreeLevel(id, chapter, name, subtitle, tutorialText, {
    W: cfg.W,
    H: cfg.H,
    g1: cfg.g1,
    g2: cfg.g2,
    g3: cfg.g3,
    s: cfg.tc1.s,
    targetSignal: cfg.tc1.target,
    lockedAnchor: cfg.lockedAnchor,
    postGate: cfg.postGate,
  });

  const W = baseLvl.gridWidth;
  const testCases: TestCase[] = [
    {
      description: cfg.tc1.desc || 'Chu kỳ T0',
      sources: [
        { row: 0, col: 0, value: cfg.tc1.s[0] },
        { row: 2, col: 0, value: cfg.tc1.s[1] },
        { row: 3, col: 0, value: cfg.tc1.s[2] },
        { row: 5, col: 0, value: cfg.tc1.s[3] },
      ],
      leds: [{ row: 2, col: W - 1, targetSignal: cfg.tc1.target }],
    },
    {
      description: cfg.tc2.desc || 'Chu kỳ T1',
      sources: [
        { row: 0, col: 0, value: cfg.tc2.s[0] },
        { row: 2, col: 0, value: cfg.tc2.s[1] },
        { row: 3, col: 0, value: cfg.tc2.s[2] },
        { row: 5, col: 0, value: cfg.tc2.s[3] },
      ],
      leds: [{ row: 2, col: W - 1, targetSignal: cfg.tc2.target }],
    },
  ];

  if (cfg.tc3) {
    testCases.push({
      description: cfg.tc3.desc || 'Chu kỳ T2',
      sources: [
        { row: 0, col: 0, value: cfg.tc3.s[0] },
        { row: 2, col: 0, value: cfg.tc3.s[1] },
        { row: 3, col: 0, value: cfg.tc3.s[2] },
        { row: 5, col: 0, value: cfg.tc3.s[3] },
      ],
      leds: [{ row: 2, col: W - 1, targetSignal: cfg.tc3.target }],
    });
  }

  baseLvl.testCases = testCases;
  return baseLvl;
}

// Test: g1=AND, g2=OR, g3=NOR
// tc1: s=[1, 0, 0, 0] => g1=0, g2=0 => g3 = 0 NOR 0 = 1 (target: 1)
// tc2: s=[1, 1, 0, 0] => g1=1, g2=0 => g3 = 1 NOR 0 = 0 (target: 0)
const testLvl = buildDynamicClockedTreeLevel(996, 4, 'Dynamic Tree Test', 'Sub', 'Tut', {
  g1: GateType.AND,
  g2: GateType.OR,
  g3: GateType.NOR,
  tc1: { s: [1, 0, 0, 0], target: 1 },
  tc2: { s: [1, 1, 0, 0], target: 0 },
});

const res = testLevelSolvability(testLvl);
console.log('Dynamic Clocked Tree Test:', res.passed ? 'PASS!' : 'FAIL!', 'Short circuit:', res.shortCircuit);
