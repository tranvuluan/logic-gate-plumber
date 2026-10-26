import { GateType, Direction, GateDefinition, TestCase } from '../utils/Constants';
import {
  getRotatedPorts,
  getConnectedDirections,
  isConductor,
  evaluateGate,
  oppositeDirection,
} from './GateTypes';

export interface CellState {
  gate: GateDefinition | null;
  outputSignal: number;
  inputSignals: number[];
  connected: boolean;
  activeFlowDirections: Direction[]; // Directions currently carrying signal 1
}

export interface ShortCircuitEdge {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
}

/**
 * SignalEngine - High-fidelity BFS signal propagation with bi-directional wire support,
 * crossover bridges, multi-target outputs ([1] & [0]), short-circuit detection, and dynamic truth-tables.
 */
export class SignalEngine {
  private grid: (GateDefinition | null)[][];
  private rows: number;
  private cols: number;
  private cellStates: CellState[][];
  private shortCircuits: ShortCircuitEdge[];

  constructor(grid: (GateDefinition | null)[][], rows: number, cols: number) {
    this.grid = grid;
    this.rows = rows;
    this.cols = cols;
    this.cellStates = [];
    this.shortCircuits = [];
    this.initStates();
  }

  private initStates(): void {
    this.cellStates = [];
    this.shortCircuits = [];
    for (let r = 0; r < this.rows; r++) {
      this.cellStates[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.cellStates[r][c] = {
          gate: this.grid[r][c],
          outputSignal: 0,
          inputSignals: [],
          connected: false,
          activeFlowDirections: [],
        };
      }
    }
  }

  /**
   * Update the grid reference.
   */
  updateGrid(grid: (GateDefinition | null)[][]): void {
    this.grid = grid;
    this.initStates();
  }

  /**
   * Check if any short-circuit (ngắn mạch / xung đột ngõ ra) is present.
   */
  hasShortCircuit(): boolean {
    return this.shortCircuits.length > 0;
  }

  getShortCircuits(): ShortCircuitEdge[] {
    return this.shortCircuits;
  }

  /**
   * Propagate all signals from sources through the grid using BFS.
   */
  propagate(sources: { row: number; col: number; value: number }[]): CellState[][] {
    this.initStates();

    // Queue of cells to propagate from: [row, col, signal, incomingDirection | null]
    const queue: [number, number, number, Direction | null][] = [];

    // 1. Initialize power sources
    for (const source of sources) {
      const { row, col, value } = source;
      if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
        const state = this.cellStates[row][col];
        state.outputSignal = value;
        state.connected = true;

        const gate = this.grid[row][col];
        if (gate) {
          const ports = getRotatedPorts(gate.type, gate.rotation, gate.ports);
          const outPorts = ports.filter((p) => !p.isInput);
          for (const op of outPorts) {
            if (value === 1) {
              state.activeFlowDirections.push(op.direction);
            }
            queue.push([row, col, value, null]);
          }
        }
      }
    }

    const visitedEdges = new Set<string>();

    while (queue.length > 0) {
      const [r, c, currentSignal, inDir] = queue.shift()!;
      const cell = this.cellStates[r][c];
      const gate = this.grid[r][c];
      if (!gate) continue;

      let outDirections: Direction[] = [];

      if (gate.type === GateType.SOURCE) {
        const ports = getRotatedPorts(gate.type, gate.rotation, gate.ports);
        outDirections = ports.filter((p) => !p.isInput).map((p) => p.direction);
      } else if (gate.type === GateType.CROSSOVER) {
        // Crossover / Wire Bridge: Signal only continues straight across its own channel
        if (inDir !== null) {
          outDirections = [oppositeDirection(inDir)];
        } else {
          outDirections = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
        }
      } else if (isConductor(gate.type)) {
        // Conductors transmit to all their connected arms except the entry arm
        const connected = getConnectedDirections(gate.type, gate.rotation);
        if (inDir !== null) {
          outDirections = connected.filter((d) => d !== inDir);
        } else {
          outDirections = connected;
        }
      } else {
        // Directional logic gate (NOT, AND, OR, XOR, NAND, NOR, XNOR, DIODE)
        const ports = getRotatedPorts(gate.type, gate.rotation, gate.ports);
        outDirections = ports.filter((p) => !p.isInput).map((p) => p.direction);
      }

      // Propagate into neighbor cells
      for (const outDir of outDirections) {
        const [nr, nc] = this.getNeighbor(r, c, outDir);
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;

        const neighborGate = this.grid[nr][nc];
        if (!neighborGate) continue;

        const edgeKey = `${r},${c}->${nr},${nc}`;
        if (visitedEdges.has(edgeKey)) continue;

        const neededInNeighbor = oppositeDirection(outDir);

        // Check for Short-Circuit: Output pointing into another Output/Source directly
        if (!isConductor(gate.type) && !isConductor(neighborGate.type)) {
          const neighborPorts = getRotatedPorts(neighborGate.type, neighborGate.rotation, neighborGate.ports);
          const neighborOut = neighborPorts.find((p) => !p.isInput && p.direction === neededInNeighbor);
          if (neighborOut && currentSignal === 1) {
            // Short-circuit detected!
            this.shortCircuits.push({ r1: r, c1: c, r2: nr, c2: nc });
            continue;
          }
        }

        if (neighborGate.type === GateType.CROSSOVER) {
          // Crossover bridge neighbor accepts connections from any of the 4 orthogonal directions
          visitedEdges.add(edgeKey);
          const nState = this.cellStates[nr][nc];
          nState.connected = true;
          nState.inputSignals.push(currentSignal);
          nState.outputSignal = Math.max(nState.outputSignal, currentSignal);

          if (currentSignal === 1) {
            if (!cell.activeFlowDirections.includes(outDir)) {
              cell.activeFlowDirections.push(outDir);
            }
            if (!nState.activeFlowDirections.includes(neededInNeighbor)) {
              nState.activeFlowDirections.push(neededInNeighbor);
            }
          }

          queue.push([nr, nc, currentSignal, neededInNeighbor]);
        } else if (isConductor(neighborGate.type)) {
          // Check if neighbor conductor has an arm pointing back to us
          const neighborConnected = getConnectedDirections(neighborGate.type, neighborGate.rotation);
          if (!neighborConnected.includes(neededInNeighbor)) continue;

          visitedEdges.add(edgeKey);
          const nState = this.cellStates[nr][nc];
          nState.connected = true;
          nState.inputSignals.push(currentSignal);
          nState.outputSignal = Math.max(nState.outputSignal, currentSignal);

          if (currentSignal === 1) {
            if (!cell.activeFlowDirections.includes(outDir)) {
              cell.activeFlowDirections.push(outDir);
            }
            if (!nState.activeFlowDirections.includes(neededInNeighbor)) {
              nState.activeFlowDirections.push(neededInNeighbor);
            }
          }

          queue.push([nr, nc, currentSignal, neededInNeighbor]);
        } else {
          // Logic Gate or LED
          const neighborPorts = getRotatedPorts(neighborGate.type, neighborGate.rotation, neighborGate.ports);
          const matchingInput = neighborPorts.find(
            (p) => p.isInput && p.direction === neededInNeighbor
          );
          if (!matchingInput) continue;

          visitedEdges.add(edgeKey);
          const nState = this.cellStates[nr][nc];
          nState.connected = true;
          nState.inputSignals.push(currentSignal);

          if (currentSignal === 1) {
            if (!cell.activeFlowDirections.includes(outDir)) {
              cell.activeFlowDirections.push(outDir);
            }
          }

          // Evaluate logic gate
          const inputCount = neighborPorts.filter((p) => p.isInput).length;
          const isGateReady =
            neighborGate.type === GateType.LED ||
            neighborGate.type === GateType.NOT ||
            neighborGate.type === GateType.DIODE ||
            nState.inputSignals.length >= inputCount ||
            (neighborGate.type === GateType.OR && nState.inputSignals.includes(1));

          if (isGateReady) {
            nState.outputSignal = evaluateGate(neighborGate.type, nState.inputSignals);

            if (nState.outputSignal === 1 && neighborGate.type !== GateType.LED) {
              const neighborOutPorts = neighborPorts.filter((p) => !p.isInput);
              for (const nop of neighborOutPorts) {
                if (!nState.activeFlowDirections.includes(nop.direction)) {
                  nState.activeFlowDirections.push(nop.direction);
                }
              }
            }

            if (neighborGate.type !== GateType.LED) {
              queue.push([nr, nc, nState.outputSignal, null]);
            }
          }
        }
      }
    }

    return this.cellStates;
  }

  /**
   * Check if all LEDs satisfy their specific target output (1 or 0).
   * Short-circuit immediately prevents winning.
   */
  checkWin(leds: { row: number; col: number; targetSignal?: number }[]): boolean {
    if (this.hasShortCircuit()) return false;
    if (leds.length === 0) return false;

    for (const led of leds) {
      const state = this.cellStates[led.row]?.[led.col];
      if (!state || !state.connected || state.inputSignals.length === 0) {
        return false;
      }
      const target = led.targetSignal ?? 1;
      if (target === 1) {
        // High target (1): at least one 1 input
        if (!state.inputSignals.some((val) => val === 1)) {
          return false;
        }
      } else {
        // Low target (0): must be connected and receive strictly 0
        if (state.inputSignals.some((val) => val === 1)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Evaluates multiple test cases (Dynamic Clock / Truth Table).
   * All test cases must simultaneously evaluate to true.
   */
  evaluateAllTestCases(testCases: TestCase[]): { allPassed: boolean; results: boolean[] } {
    if (!testCases || testCases.length === 0) {
      return { allPassed: true, results: [] };
    }

    const results: boolean[] = [];
    let allPassed = true;

    for (const tc of testCases) {
      this.propagate(tc.sources);
      const passed = this.checkWin(tc.leds);
      results.push(passed);
      if (!passed) {
        allPassed = false;
      }
    }

    return { allPassed, results };
  }

  /**
   * Get neighbor coordinates.
   */
  private getNeighbor(row: number, col: number, dir: Direction): [number, number] {
    switch (dir) {
      case Direction.UP:
        return [row - 1, col];
      case Direction.RIGHT:
        return [row, col + 1];
      case Direction.DOWN:
        return [row + 1, col];
      case Direction.LEFT:
        return [row, col - 1];
    }
  }

  getCellStates(): CellState[][] {
    return this.cellStates;
  }
}
