import { getLevels } from '../src/logic/LevelGenerator';
import { GateType } from '../src/utils/Constants';

const levels = getLevels();
console.log('Total levels:', levels.length);

for (let i = 0; i < 20; i++) {
  const lvl = levels[i];
  let minMoves = 0;
  for (let r = 0; r < lvl.gridHeight; r++) {
    for (let c = 0; c < lvl.gridWidth; c++) {
      const cell = lvl.cells[r][c];
      if (cell && !cell.fixed && cell.type !== GateType.SOURCE && cell.type !== GateType.LED) {
        if (cell.type === GateType.WIRE) {
          if (cell.rotation % 2 !== cell.correctRotation % 2) {
            minMoves += 1;
          }
        } else {
          const diffClockwise = (cell.correctRotation - cell.rotation + 4) % 4;
          const diffCounter = (cell.rotation - cell.correctRotation + 4) % 4;
          minMoves += Math.min(diffClockwise, diffCounter);
        }
      }
    }
  }
  console.log(`Level ${lvl.id}: stored parMoves=${lvl.parMoves}, actual minMoves(bidirectional)=${minMoves}`);
}
