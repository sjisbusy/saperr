export const BOARD_SIZE = 9;
export const MINE_COUNT = 10;

export function createBoardModel() {
  let board = [];
  for (let rw = 0; rw < BOARD_SIZE; rw++) {
    let row = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      let klet = {
        isMine: false,
        isOpened: false,
        isFlagged: false,
        neighborMines: 0,
      };
      row.push(klet);
    }
    board.push(row);
  }
  return board;
}

export function generateMinesModel(board, firstRow, firstCol) {
  let placedMines = 0;
  while (placedMines < MINE_COUNT) {
    let r = Math.floor(Math.random() * BOARD_SIZE);
    let c = Math.floor(Math.random() * BOARD_SIZE);
    let isSafeZone = Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1;
    if (!isSafeZone && !board[r][c].isMine) {
      board[r][c].isMine = true;
      placedMines++;
    }
  }
  countNeighborMinesModel(board);
}

export function countNeighborMinesModel(board) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].isMine) continue;
      let minesFound = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          let neighborRow = r + i;
          let neighborCol = c + j;
          if (
            neighborRow >= 0 &&
            neighborRow < BOARD_SIZE &&
            neighborCol >= 0 &&
            neighborCol < BOARD_SIZE
          ) {
            if (board[neighborRow][neighborCol].isMine) {
              minesFound++;
            }
          }
        }
      }
      board[r][c].neighborMines = minesFound;
    }
  }
}

export function openCellModel(board, r, c) {
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return;
  if (board[r][c].isOpened || board[r][c].isFlagged) return;

  board[r][c].isOpened = true;

  if (!board[r][c].isMine && board[r][c].neighborMines === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        openCellModel(board, r + i, c + j);
      }
    }
  }
}

export function countFlagsModel(board) {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].isFlagged) {
        count++;
      }
    }
  }
  return count;
}

export function toggleFlagModel(board, r, c) {
  if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) return false;
  if (board[r][c].isOpened) return false;

  if (!board[r][c].isFlagged) {
    if (countFlagsModel(board) >= MINE_COUNT) {
      return false;
    }
  }

  board[r][c].isFlagged = !board[r][c].isFlagged;
  return true;
}

export function checkWinModel(board) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c].isMine && !board[r][c].isOpened) {
        return false;
      }
    }
  }
  return true;
}

export function isValidGameState(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return false;
  }

  if (Object.getPrototypeOf(state) !== Object.prototype) {
    return false;
  }

  const stateKeys = Object.keys(state);
  if (stateKeys.length !== 3) {
    return false;
  }

  if (
    typeof state.firstClick !== 'boolean' ||
    typeof state.gameOver !== 'boolean'
  ) {
    return false;
  }

  if (!state.firstClick && state.gameOver) {
    return false;
  }

  if (!Array.isArray(state.board) || state.board.length !== BOARD_SIZE) {
    return false;
  }

  let minesCount = 0;
  let flagsCount = 0;
  let openedCount = 0;
  let explodedMinesCount = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (
      !Array.isArray(state.board[r]) ||
      state.board[r].length !== BOARD_SIZE
    ) {
      return false;
    }

    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = state.board[r][c];
      if (!cell || typeof cell !== 'object' || Array.isArray(cell)) {
        return false;
      }

      if (Object.getPrototypeOf(cell) !== Object.prototype) {
        return false;
      }

      const cellKeys = Object.keys(cell);
      if (cellKeys.length !== 4) {
        return false;
      }

      const validBooleans =
        typeof cell.isMine === 'boolean' &&
        typeof cell.isOpened === 'boolean' &&
        typeof cell.isFlagged === 'boolean';

      const validNeighborCount =
        typeof cell.neighborMines === 'number' &&
        Number.isInteger(cell.neighborMines) &&
        cell.neighborMines >= 0 &&
        cell.neighborMines <= 8;

      if (!validBooleans || !validNeighborCount) {
        return false;
      }

      if (cell.isOpened && cell.isFlagged) {
        return false;
      }
      if (cell.isMine && cell.isOpened && !state.gameOver) {
        return false;
      }
      if (cell.isMine && cell.neighborMines !== 0) {
        return false;
      }

      if (cell.isMine) {
        minesCount++;
        if (cell.isOpened) explodedMinesCount++;
      }
      if (cell.isFlagged) flagsCount++;

      if (cell.isOpened) {
        openedCount++;
      }
    }
  }

  if (minesCount > MINE_COUNT || flagsCount > MINE_COUNT) {
    return false;
  }

  if (explodedMinesCount > 1) {
    return false;
  }

  if (state.firstClick && minesCount !== MINE_COUNT) {
    return false;
  }

  if (state.firstClick && openedCount === 0) {
    return false;
  }

  if (!state.firstClick && minesCount !== 0) {
    return false;
  }

  if (state.firstClick) {
    let hasSafeZone = false;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (state.board[r][c].isOpened && !state.board[r][c].isMine) {
          let minesAround = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const nr = r + i;
              const nc = c + j;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                if (state.board[nr][nc].isMine) minesAround++;
              }
            }
          }
          if (minesAround === 0) {
            hasSafeZone = true;
            break;
          }
        }
      }
      if (hasSafeZone) break;
    }
  }

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = state.board[r][c];
      if (!cell.isMine) {
        let actualMines = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const nr = r + i;
            const nc = c + j;
            if (
              nr >= 0 &&
              nr < BOARD_SIZE &&
              nc >= 0 &&
              nc < BOARD_SIZE &&
              state.board[nr][nc].isMine
            ) {
              actualMines++;
            }
          }
        }

        if (cell.neighborMines !== actualMines) {
          return false;
        }

        if (cell.isOpened && !cell.isMine && cell.neighborMines === 0) {
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const nr = r + i;
              const nc = c + j;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                const neighbor = state.board[nr][nc];
                if (
                  !neighbor.isOpened &&
                  !neighbor.isFlagged &&
                  !neighbor.isMine
                ) {
                  return false;
                }
              }
            }
          }
        }
      }
    }
  }

  const isWin = checkWinModel(state.board);
  if (!state.gameOver && isWin) {
    return false;
  }

  if (state.gameOver && explodedMinesCount === 0 && !isWin) {
    return false;
  }

  return true;
}
