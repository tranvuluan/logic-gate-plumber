import { GateType, Direction, GateDefinition, LevelDefinition, TestCase } from '../src/utils/Constants';
import { getDefaultPorts } from '../src/logic/GateTypes';
import { SignalEngine } from '../src/logic/SignalEngine';

function createGrid(rows: number, cols: number, placements: any[]) {
  const grid: (GateDefinition | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = null;
  }
  for (const p of placements) {
    grid[p.r][p.c] = {
      type: p.type,
      rotation: p.correctRotation,
      correctRotation: p.correctRotation,
      fixed: p.fixed || false,
      ports: getDefaultPorts(p.type),
    };
  }
  return grid;
}

const placements = [
  { r: 1, c: 0, type: GateType.SOURCE, correctRotation: 0, fixed: true },
  { r: 1, c: 1, type: GateType.WIRE, correctRotation: 0, fixed: false },
  { r: 1, c: 2, type: GateType.CROSSOVER, correctRotation: 0, fixed: false },
  { r: 1, c: 3, type: GateType.WIRE, correctRotation: 0, fixed: false },
  { r: 1, c: 4, type: GateType.NOT, correctRotation: 0, fixed: false },
  { r: 1, c: 5, type: GateType.LED, correctRotation: 0, fixed: true },

  { r: 0, c: 2, type: GateType.SOURCE, correctRotation: 1, fixed: true },
  { r: 2, c: 2, type: GateType.WIRE, correctRotation: 1, fixed: false },
  { r: 3, c: 2, type: GateType.WIRE_CORNER, correctRotation: 2, fixed: false }, // UP & RIGHT
  { r: 3, c: 3, type: GateType.DIODE, correctRotation: 0, fixed: false },
  { r: 3, c: 4, type: GateType.LED, correctRotation: 0, fixed: true },
];

const sources = [
  { row: 1, col: 0, value: 0 },
  { row: 0, col: 2, value: 1 },
];
const leds = [
  { row: 1, col: 5, targetSignal: 1 },
  { row: 3, col: 4, targetSignal: 1 },
];

const grid = createGrid(5, 6, placements);
const engine = new SignalEngine(grid, 5, 6);
const states = engine.propagate(sources);

for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 6; c++) {
    const s = states[r][c];
    if (s.gate) {
      console.log(`(${r},${c}) ${s.gate.type} rot=${s.gate.rotation} conn=${s.connected} in=[${s.inputSignals}] out=${s.outputSignal}`);
    }
  }
}

const won = engine.checkWin(leds);
console.log('Crossover Highway test:', won ? 'PASS!' : 'FAIL!', 'Short circuit:', engine.hasShortCircuit());
