import { GateType, Direction, Port } from '../utils/Constants';

/**
 * Returns default ports for a gate type at rotation 0.
 */
export function getDefaultPorts(type: GateType): Port[] {
  switch (type) {
    case GateType.WIRE:
      // Straight wire: connects LEFT and RIGHT
      return [
        { direction: Direction.LEFT, isInput: true },
        { direction: Direction.RIGHT, isInput: false },
      ];

    case GateType.WIRE_CORNER:
      // Corner wire: connects LEFT and DOWN at rotation 0
      return [
        { direction: Direction.LEFT, isInput: true },
        { direction: Direction.DOWN, isInput: false },
      ];

    case GateType.SPLIT:
      // T-Splitter: in from LEFT, out to RIGHT and DOWN
      return [
        { direction: Direction.LEFT, isInput: true },
        { direction: Direction.RIGHT, isInput: false },
        { direction: Direction.DOWN, isInput: false },
      ];

    case GateType.NOT:
      // Inverter: in on LEFT, out on RIGHT
      return [
        { direction: Direction.LEFT, isInput: true },
        { direction: Direction.RIGHT, isInput: false },
      ];

    case GateType.AND:
    case GateType.OR:
    case GateType.XOR:
      // 2-Input Logic Gate: inputs on UP and DOWN, output on RIGHT
      return [
        { direction: Direction.UP, isInput: true },
        { direction: Direction.DOWN, isInput: true },
        { direction: Direction.RIGHT, isInput: false },
      ];

    case GateType.SOURCE:
      return [{ direction: Direction.RIGHT, isInput: false }];

    case GateType.LED:
      return [{ direction: Direction.LEFT, isInput: true }];

    default:
      return [];
  }
}

/**
 * Checks if a gate type is a passive conductor (wire, corner, split).
 * Conductors transmit signal bi-directionally along their connected arms.
 */
export function isConductor(type: GateType): boolean {
  return (
    type === GateType.WIRE ||
    type === GateType.WIRE_CORNER ||
    type === GateType.SPLIT
  );
}

/**
 * Rotate a direction by N * 90 degrees clockwise.
 */
export function rotateDirection(dir: Direction, rotation: number): Direction {
  return ((dir + (rotation % 4) + 4) % 4) as Direction;
}

/**
 * Get opposite direction.
 */
export function oppositeDirection(dir: Direction): Direction {
  return ((dir + 2) % 4) as Direction;
}

/**
 * Get all connected directions for a cell after rotation.
 */
export function getConnectedDirections(type: GateType, rotation: number): Direction[] {
  switch (type) {
    case GateType.WIRE:
      // Rotation 0 or 2: Horizontal (LEFT, RIGHT)
      // Rotation 1 or 3: Vertical (UP, DOWN)
      if (rotation % 2 === 0) {
        return [Direction.LEFT, Direction.RIGHT];
      } else {
        return [Direction.UP, Direction.DOWN];
      }

    case GateType.WIRE_CORNER:
      // Rotation 0: LEFT & DOWN
      // Rotation 1: DOWN & RIGHT
      // Rotation 2: RIGHT & UP
      // Rotation 3: UP & LEFT
      return [
        rotateDirection(Direction.LEFT, rotation),
        rotateDirection(Direction.DOWN, rotation),
      ];

    case GateType.SPLIT:
      // Rotation 0: LEFT, RIGHT, DOWN
      return [
        rotateDirection(Direction.LEFT, rotation),
        rotateDirection(Direction.RIGHT, rotation),
        rotateDirection(Direction.DOWN, rotation),
      ];

    case GateType.NOT:
      return [
        rotateDirection(Direction.LEFT, rotation),
        rotateDirection(Direction.RIGHT, rotation),
      ];

    case GateType.AND:
    case GateType.OR:
    case GateType.XOR:
      return [
        rotateDirection(Direction.UP, rotation),
        rotateDirection(Direction.DOWN, rotation),
        rotateDirection(Direction.RIGHT, rotation),
      ];

    case GateType.SOURCE:
      return [rotateDirection(Direction.RIGHT, rotation)];

    case GateType.LED:
      return [rotateDirection(Direction.LEFT, rotation)];

    default:
      return [];
  }
}

/**
 * Get rotated ports of a gate definition.
 */
export function getRotatedPorts(type: GateType, rotation: number, customPorts?: Port[]): Port[] {
  const basePorts = customPorts || getDefaultPorts(type);
  return basePorts.map((port) => ({
    ...port,
    direction: rotateDirection(port.direction, rotation),
  }));
}

/**
 * Evaluate logic operation on inputs.
 */
export function evaluateGate(type: GateType, inputs: number[]): number {
  if (inputs.length === 0) return 0;

  switch (type) {
    case GateType.AND:
      if (inputs.length < 2) return 0; // Both inputs required
      return inputs[0] === 1 && inputs[1] === 1 ? 1 : 0;

    case GateType.OR:
      // OR gate outputs 1 if AT LEAST ONE input is 1
      return inputs.some((val) => val === 1) ? 1 : 0;

    case GateType.XOR:
      if (inputs.length < 2) return 0;
      return inputs[0] !== inputs[1] ? 1 : 0;

    case GateType.NOT:
      return inputs[0] === 0 ? 1 : 0;

    case GateType.WIRE:
    case GateType.WIRE_CORNER:
    case GateType.SPLIT:
      // Conductor carries maximum signal present
      return Math.max(...inputs);

    default:
      return inputs[0] ?? 0;
  }
}

/**
 * Human-readable truth tables for Cheat Sheet UI
 */
export function getTruthTable(type: GateType): string {
  switch (type) {
    case GateType.AND:
      return 'CỔNG AND (&)\n───────────────\nA  B │ RA\n0  0 │  0\n0  1 │  0\n1  0 │  0\n1  1 │  1  ★\n\nQuy tắc: Cả 2 đầu vào\nphải là 1 mới ra 1.';

    case GateType.OR:
      return 'CỔNG OR (≥1)\n───────────────\nA  B │ RA\n0  0 │  0\n0  1 │  1  ★\n1  0 │  1  ★\n1  1 │  1  ★\n\nQuy tắc: Có ít nhất một\nsố 1 là đầu ra thành 1.';

    case GateType.XOR:
      return 'CỔNG XOR (=1)\n───────────────\nA  B │ RA\n0  0 │  0\n0  1 │  1  ★\n1  0 │  1  ★\n1  1 │  0\n\nQuy tắc: 2 đầu vào\nKHÁC NHAU mới ra 1.';

    case GateType.NOT:
      return 'CỔNG NOT (▷○)\n───────────────\nVÀO  │ RA\n 0   │  1  ★\n 1   │  0\n\nQuy tắc: Đảo ngược\ntín hiệu số (0 ⇄ 1).';

    case GateType.WIRE:
    case GateType.WIRE_CORNER:
      return 'DÂY DẪN ĐIỆN\n───────────────\nTruyền tín hiệu\nđi qua thông mạch.';

    case GateType.SPLIT:
      return 'BỘ PHÂN NHÁNH (T)\n───────────────\nNhận 1 dòng điện và\nchia đều ra 2 nhánh.';

    default:
      return '';
  }
}
