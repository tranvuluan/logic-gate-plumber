import { getLevels, generateEndlessLevel } from '../src/logic/LevelGenerator';
import { GateType, LevelDefinition } from '../src/utils/Constants';

function computeExactPar(level: LevelDefinition): number {
  let minMoves = 0;
  for (let r = 0; r < level.gridHeight; r++) {
    for (let c = 0; c < level.gridWidth; c++) {
      const cell = level.cells[r]?.[c];
      if (cell && !cell.fixed && !cell.locked && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
        if (cell.type === GateType.WIRE || cell.type === GateType.CROSSOVER) {
          if (cell.rotation % 2 !== cell.correctRotation % 2) {
            minMoves += 1;
          }
        } else {
          const diffCw = (cell.correctRotation - cell.rotation + 4) % 4;
          const diffCcw = (cell.rotation - cell.correctRotation + 4) % 4;
          minMoves += Math.min(diffCw, diffCcw);
        }
      }
    }
  }
  return Math.max(minMoves, 1);
}

const levels = getLevels();
console.log('Sample of 20 levels with true Par and tight Max:');
for (let i = 0; i < 20; i++) {
  const lvl = levels[i];
  const truePar = computeExactPar(lvl);
  const allowance = truePar <= 3 ? 2 : truePar <= 7 ? 3 : 4;
  const tightMax = truePar + allowance;
  console.log(`Level ${lvl.id} (${lvl.name}): parMoves=${truePar}, maxMoves=${tightMax}`);
}
