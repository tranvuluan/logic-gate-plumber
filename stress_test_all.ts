import { getLevels, generateEndlessLevel } from './src/logic/LevelGenerator';
import { SignalEngine } from './src/logic/SignalEngine';

console.log('====================================================');
console.log('🚀 RUNNING COMPREHENSIVE STRESS TEST ON ALL LEVELS...');
console.log('====================================================');

let storyPassed = 0;
let storyFailed = 0;

const levels = getLevels();
console.log(`\n[PHASE 1] Testing all ${levels.length} Story Levels (Chapters 1 - 5)...`);

for (const lvl of levels) {
  // Test solved configuration
  const grid = lvl.cells.map((row) =>
    row.map((cell) => (cell ? { ...cell, rotation: cell.correctRotation } : null))
  );
  const engine = new SignalEngine(grid, lvl.gridHeight, lvl.gridWidth);

  let passed = false;
  if (lvl.testCases && lvl.testCases.length > 0) {
    passed = engine.evaluateAllTestCases(lvl.testCases).allPassed;
  } else {
    engine.propagate(lvl.sources);
    passed = engine.checkWin(lvl.leds);
  }

  const hasShort = engine.hasShortCircuit();

  if (passed && !hasShort) {
    storyPassed++;
  } else {
    storyFailed++;
    console.error(
      `❌ STORY LEVEL ${lvl.id} FAILED! Name: "${lvl.name}", Passed: ${passed}, ShortCircuit: ${hasShort}`
    );
  }
}

console.log(
  `[PHASE 1 RESULT] Story Levels: ${storyPassed}/${levels.length} PASSED (Failures: ${storyFailed})`
);

// Phase 2: Endless Mode Stress Test (Levels 101 to 200)
console.log(`\n[PHASE 2] Stress Testing 100 Endless Mode Levels (101 - 200)...`);
let endlessPassed = 0;
let endlessFailed = 0;

for (let id = 101; id <= 200; id++) {
  try {
    const lvl = generateEndlessLevel(id);
    const grid = lvl.cells.map((row) =>
      row.map((cell) => (cell ? { ...cell, rotation: cell.correctRotation } : null))
    );
    const engine = new SignalEngine(grid, lvl.gridHeight, lvl.gridWidth);
    engine.propagate(lvl.sources);
    const won = engine.checkWin(lvl.leds);
    const hasShort = engine.hasShortCircuit();

    if (won && !hasShort) {
      endlessPassed++;
    } else {
      endlessFailed++;
      console.error(`❌ ENDLESS LEVEL ${id} FAILED! Won: ${won}, ShortCircuit: ${hasShort}`);
    }
  } catch (err) {
    endlessFailed++;
    console.error(`❌ ENDLESS LEVEL ${id} CRASHED:`, err);
  }
}

console.log(
  `[PHASE 2 RESULT] Endless Levels: ${endlessPassed}/100 PASSED (Failures: ${endlessFailed})`
);

console.log('\n====================================================');
if (storyFailed === 0 && endlessFailed === 0) {
  console.log(`🏆 STRESS TEST SUCCESS: 200/200 LEVELS (100 STORY + 100 ENDLESS) ARE 100% SOLVABLE & VERIFIED!`);
} else {
  console.error(`💥 STRESS TEST FAILED! Total Failures: ${storyFailed + endlessFailed}`);
  process.exit(1);
}
console.log('====================================================');
