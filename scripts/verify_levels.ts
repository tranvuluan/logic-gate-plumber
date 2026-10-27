import { getLevels } from '../src/logic/LevelGenerator';
import { SignalEngine } from '../src/logic/SignalEngine';

const levels = getLevels();
console.log('Total levels in LevelGenerator:', levels.length);

let passedCount = 0;
let shortCircuits = 0;
const chapterCounts: { [chap: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

for (const lvl of levels) {
  const grid = lvl.cells.map(row => row.map(cell => cell ? { ...cell, rotation: cell.correctRotation } : null));
  const engine = new SignalEngine(grid, lvl.gridHeight, lvl.gridWidth);

  let passed = false;
  if (lvl.testCases && lvl.testCases.length > 0) {
    passed = engine.evaluateAllTestCases(lvl.testCases).allPassed;
  } else {
    engine.propagate(lvl.sources);
    passed = engine.checkWin(lvl.leds);
  }

  const hasShort = engine.hasShortCircuit();
  if (hasShort) {
    shortCircuits++;
    console.error(`Level ${lvl.id} has short circuit!`);
  }

  if (passed && !hasShort) {
    passedCount++;
    chapterCounts[lvl.chapter] = (chapterCounts[lvl.chapter] || 0) + 1;
  } else {
    console.error(`Level ${lvl.id} (${lvl.name}) FAILED verification!`);
  }
}

console.log('----------------------------------------------------');
console.log(`TOTAL LEVELS VERIFIED: ${passedCount} / ${levels.length}`);
console.log(`SHORT CIRCUITS: ${shortCircuits}`);
console.log('Breakdown by Chapter:');
for (let c = 1; c <= 5; c++) {
  console.log(`  Chapter ${c}: ${chapterCounts[c]} levels passed`);
}
console.log('----------------------------------------------------');

if (passedCount === 100 && shortCircuits === 0) {
  console.log('🎉 100% OF ALL 100 LEVELS ARE MATHEMATICALLY VERIFIED AND SOLVABLE!');
} else {
  process.exit(1);
}
