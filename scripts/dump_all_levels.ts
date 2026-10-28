import * as fs from 'fs';
import { getLevels, generateEndlessLevel } from '../src/logic/LevelGenerator';
import { SignalEngine } from '../src/logic/SignalEngine';

const levels = getLevels();
const allData = [];

// Levels 1 to 100
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

  const states = engine.getCellStates();
  const hasShort = engine.hasShortCircuit();

  allData.push({
    id: lvl.id,
    chapter: lvl.chapter,
    name: lvl.name,
    subtitle: lvl.subtitle,
    gridWidth: lvl.gridWidth,
    gridHeight: lvl.gridHeight,
    parMoves: lvl.parMoves,
    maxMoves: lvl.maxMoves,
    sources: lvl.sources,
    leds: lvl.leds,
    cells: lvl.cells,
    solvedStates: states,
    passed,
    hasShort,
  });
}

// Add Level 101 (Endless Mode)
const endless101 = generateEndlessLevel(101);
const endlessGrid = endless101.cells.map(row => row.map(cell => cell ? { ...cell, rotation: cell.correctRotation } : null));
const endlessEngine = new SignalEngine(endlessGrid, endless101.gridHeight, endless101.gridWidth);
endlessEngine.propagate(endless101.sources);
const endlessPassed = endlessEngine.checkWin(endless101.leds);
const endlessStates = endlessEngine.getCellStates();

allData.push({
  id: endless101.id,
  chapter: 6,
  name: endless101.name,
  subtitle: endless101.subtitle,
  gridWidth: endless101.gridWidth,
  gridHeight: endless101.gridHeight,
  parMoves: endless101.parMoves,
  maxMoves: endless101.maxMoves,
  sources: endless101.sources,
  leds: endless101.leds,
  cells: endless101.cells,
  solvedStates: endlessStates,
  passed: endlessPassed,
  hasShort: endlessEngine.hasShortCircuit(),
});

fs.writeFileSync('levels_dump.json', JSON.stringify(allData, null, 2), 'utf8');
console.log('✅ Successfully exported', allData.length, 'levels to levels_dump.json');
