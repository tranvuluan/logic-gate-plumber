
function serializeLevel(lvl: LevelDefinition): string {
  const placements: any[] = [];
  for (let r = 0; r < lvl.gridHeight; r++) {
    for (let c = 0; c < lvl.gridWidth; c++) {
      const cell = lvl.cells[r][c];
      if (cell) {
        placements.push({
          r,
          c,
          type: `GateType.${cell.type}`,
          rotation: cell.rotation,
          correctRotation: cell.correctRotation,
          fixed: cell.fixed,
        });
      }
    }
  }

  const placementsLines = placements.map(
    p => `      { r: ${p.r}, c: ${p.c}, type: ${p.type}, rotation: ${p.rotation}, correctRotation: ${p.correctRotation}, fixed: ${p.fixed} },`
  ).join('\n');

  let testCasesStr = '';
  if (lvl.testCases && lvl.testCases.length > 0) {
    testCasesStr = `\n    testCases: ${JSON.stringify(lvl.testCases)},`;
  }

  return `  {
    id: ${lvl.id},
    chapter: ${lvl.chapter},
    name: ${JSON.stringify(lvl.name)},
    subtitle: ${JSON.stringify(lvl.subtitle)},
    gridWidth: ${lvl.gridWidth},
    gridHeight: ${lvl.gridHeight},
    timeLimit: ${lvl.timeLimit},
    parMoves: ${lvl.parMoves},
    tutorialText: ${JSON.stringify(lvl.tutorialText)},
    sources: ${JSON.stringify(lvl.sources)},
    leds: ${JSON.stringify(lvl.leds)},${testCasesStr}
    cells: createGrid(${lvl.gridHeight}, ${lvl.gridWidth}, [
${placementsLines}
    ]),
  },`;
}
