const board = new Board("board");
board.render();

const dice = new Dice();

// Create players (two-player game: red and blue)
const player1 = new Player("red", 0);
const player2 = new Player("blue", 13);
const players = [player1, player2];

// Ludo path configuration (logical, visual mapping uses board.cells indices)
const PATH_LEN = 52;
// Map path indices 0..51 to the first 52 board cells for visualization
function pathToCellIndex(pathIdx) {
  return pathIdx % PATH_LEN; // maps 0..51 -> board.cells[0..51]
}

// Home columns mapped to board cells after the main path
const homeCellsByColor = {
  red: [52,53,54,55,56,57],
  blue: [58,59,60,61,62,63]
};

// Initial home slots (where pawns sit before entering the board)
const homeSlotsByColor = {
  red: [200,201,202,203],
  blue: [204,205,206,207]
};

// Starting path index for each player and their home entrance (square before start)
const startIndexByColor = { red: 0, blue: 13 };
function homeEntranceFor(startIdx) {
  return (startIdx + PATH_LEN - 1) % PATH_LEN;
}

// Safe squares (no capture). At minimum include all player start squares.
const safeSquares = new Set([ startIndexByColor.red, startIndexByColor.blue, 26, 39 ]);

// Initialize pawn logical state and render initial home positions
players.forEach(player => {
  const start = startIndexByColor[player.color];
  player.startPath = start;
  player.homeEntrance = homeEntranceFor(start);
  player.homeCells = homeCellsByColor[player.color];
  player.homeSlots = homeSlotsByColor[player.color];

  player.pawns.forEach((pawn, i) => {
    pawn.state = 'home'; // 'home', 'path', 'homeColumn', 'finished'
    pawn.pathIndex = null;
    pawn.homeStep = null;
    pawn.finished = false;

    // place pawn in its home slot visually
    const slot = player.homeSlots[i] || player.homeSlots[0];
    if (board.cells[slot]) board.cells[slot].appendChild(pawn.element);

    // clicking a pawn selects it when it's the current player's pawn
    pawn.element.addEventListener('click', () => handlePawnClick(pawn));
  });
});

let currentPlayerIndex = 0;
let waitingForSelection = false;
let validMoves = [];
let selectedPawn = null;

function updateCurrentPlayerUI(text) {
  const el = document.getElementById("currentPlayer");
  const player = players[currentPlayerIndex];
  if (text) {
    el.textContent = text;
    return;
  }
  const color = player.color;
  el.textContent = `Current: ${color}`;
  el.className = `text-lg font-semibold ${color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : 'text-gray-700'}`;
}

updateCurrentPlayerUI();

// Utility: clear visual highlights from all pawns
function clearHighlights() {
  players.forEach(p => p.pawns.forEach(pawn => pawn.element.style.outline = ''));
}

function getValidMovesForPlayer(player, roll) {
  const moves = [];
  player.pawns.forEach(pawn => {
    if (pawn.finished) return;
    if (pawn.state === 'home') {
      if (roll === 6) moves.push(pawn);
      return;
    }

    if (pawn.state === 'path') {
      // steps to home entrance
      let stepsToEntrance = (player.homeEntrance - pawn.pathIndex + PATH_LEN) % PATH_LEN;
      if (roll <= stepsToEntrance) {
        moves.push(pawn); // stays on main path
      } else {
        // would enter home column: calculate home step index
        const intoHome = roll - stepsToEntrance - 1; // 0-based step into home column
        if (intoHome <= 5) moves.push(pawn);
      }
      return;
    }

    if (pawn.state === 'homeColumn') {
      if (pawn.homeStep + roll <= 5) moves.push(pawn);
      return;
    }
  });
  return moves;
}

function handlePawnClick(pawn) {
  const player = players[currentPlayerIndex];
  if (!waitingForSelection) return; // clicks only matter while selecting
  // only allow selecting your own pawn
  if (!player.pawns.includes(pawn)) return;
  // is pawn in validMoves?
  if (!validMoves.includes(pawn)) return;
  // perform the move using the previously rolled value stored in lastRoll
  if (typeof lastRoll === 'number') {
    executeMove(pawn, lastRoll, player);
  }
}

let lastRoll = null;

function performRoll() {
  clearHighlights();
  waitingForSelection = false;
  selectedPawn = null;

  const roll = dice.roll();
  lastRoll = roll;
  document.getElementById('diceValue').textContent = roll;

  const player = players[currentPlayerIndex];
  validMoves = getValidMovesForPlayer(player, roll);

  if (validMoves.length === 0) {
    // no move possible
    if (roll !== 6) {
      currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
    updateCurrentPlayerUI();
    return;
  }

  if (validMoves.length === 1) {
    executeMove(validMoves[0], roll, player);
    return;
  }

  // multiple valid moves: prompt user to select a pawn
  waitingForSelection = true;
  updateCurrentPlayerUI('Select a pawn to move');
  validMoves.forEach(p => {
    p.element.style.outline = '3px solid rgba(59,130,246,0.8)';
  });
}

function executeMove(pawn, roll, player) {
  waitingForSelection = false;
  clearHighlights();

  // Movement logic
  if (pawn.state === 'home') {
    // leave home only on a 6
    if (roll !== 6) return; // invalid
    const target = player.startPath;
    pawn.state = 'path';
    pawn.pathIndex = target;
    board.cells[pathToCellIndex(target)]?.appendChild(pawn.element);
    // handle capture at landing
    handleCaptureAtPath(pawn, player);
  } else if (pawn.state === 'path') {
    const stepsToEntrance = (player.homeEntrance - pawn.pathIndex + PATH_LEN) % PATH_LEN;
    if (roll <= stepsToEntrance) {
      pawn.pathIndex = (pawn.pathIndex + roll) % PATH_LEN;
      board.cells[pathToCellIndex(pawn.pathIndex)]?.appendChild(pawn.element);
      handleCaptureAtPath(pawn, player);
    } else {
      // enter home column
      const intoHome = roll - stepsToEntrance - 1; // 0-based
      if (intoHome <= 5) {
        pawn.state = 'homeColumn';
        pawn.homeStep = intoHome;
        const cellIdx = player.homeCells[ pawn.homeStep ];
        board.cells[cellIdx]?.appendChild(pawn.element);
        if (pawn.homeStep === 5) {
          pawn.finished = true;
          pawn.state = 'finished';
        }
      }
    }
  } else if (pawn.state === 'homeColumn') {
    const newStep = pawn.homeStep + roll;
    if (newStep <= 5) {
      pawn.homeStep = newStep;
      const cellIdx = player.homeCells[pawn.homeStep];
      board.cells[cellIdx]?.appendChild(pawn.element);
      if (pawn.homeStep === 5) {
        pawn.finished = true;
        pawn.state = 'finished';
      }
    }
  }

  // After move, check for win
  if (player.pawns.every(p => p.finished)) {
    updateCurrentPlayerUI(`Winner: ${player.color}`);
    document.getElementById('diceValue').textContent = '-';
    // disable roll button
    document.getElementById('rollDice').disabled = true;
    return;
  }

  // If roll was 6, player rolls again; otherwise switch
  if (roll !== 6) {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  }

  updateCurrentPlayerUI();
  // reset lastRoll and validMoves
  lastRoll = null;
  validMoves = [];
}

function handleCaptureAtPath(movedPawn, ownerPlayer) {
  const landing = movedPawn.pathIndex;
  if (safeSquares.has(landing)) return; // no capture on safe squares

  players.forEach(player => {
    if (player === ownerPlayer) return;
    player.pawns.forEach(opPawn => {
      if (opPawn.state === 'path' && opPawn.pathIndex === landing) {
        // capture: send opponent pawn back to its home slot
        opPawn.state = 'home';
        opPawn.pathIndex = null;
        opPawn.homeStep = null;
        opPawn.finished = false;
        // place in first available home slot
        const slot = findFirstFreeSlot(player);
        board.cells[slot]?.appendChild(opPawn.element);
      }
    });
  });
}

function findFirstFreeSlot(player) {
  for (let i = 0; i < player.homeSlots.length; i++) {
    const idx = player.homeSlots[i];
    const cell = board.cells[idx];
    if (!cell || cell.children.length === 0) return idx;
  }
  // fallback to first slot
  return player.homeSlots[0];
}

// Wire roll button
document.getElementById('rollDice').addEventListener('click', () => {
  performRoll();
});

// initial UI update
updateCurrentPlayerUI();

