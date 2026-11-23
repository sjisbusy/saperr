import confetti from 'canvas-confetti';
import {
  BOARD_SIZE,
  MINE_COUNT,
  createBoardModel,
  generateMinesModel,
  countNeighborMinesModel,
  openCellModel,
  countFlagsModel,
  toggleFlagModel,
  checkWinModel,
  isValidGameState,
} from './game-logic.js';

import {
  playClickSound,
  playFlagSound,
  playExplosionSound,
  playWinSound,
  toggleMute,
  getMuted,
  playRevealAreaSound,
  playButtonSound,
  playConfirmLossSound,
} from './sound.js';

let board = [];
let firstClick = false;
let gameOver = false;

const maxMinesEl = document.getElementById('max-mines');
if (maxMinesEl) {
  maxMinesEl.innerText = MINE_COUNT;
}

function createBoard() {
  board = createBoardModel();
}

function renderBoard(isReset = false) {
  const boardContainer = document.getElementById('game-board');
  boardContainer.innerHTML = '';
  for (let rw = 0; rw < BOARD_SIZE; rw++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const kletDiv = document.createElement('div');
      kletDiv.classList.add('klet');
      kletDiv.dataset.row = rw;
      kletDiv.dataset.col = col;

      const cell = board[rw][col];

      if (cell.isOpened) {
        kletDiv.classList.add('opened');
        if (cell.isMine) {
          kletDiv.innerText = '💣';
          kletDiv.style.backgroundColor = '#e74c3c';
        } else if (cell.neighborMines > 0) {
          kletDiv.innerText = cell.neighborMines;
          kletDiv.dataset.mines = cell.neighborMines;
        }
      } else if (cell.isFlagged) {
        kletDiv.innerText = '🚩';
      }

      boardContainer.appendChild(kletDiv);
    }
  }

  document.body.classList.remove('game-over-effect', 'game-win-effect');
  if (gameOver) {
    const hitMine = board.some((row) =>
      row.some((cell) => cell.isMine && cell.isOpened),
    );
    if (hitMine) {
      document.body.classList.add('game-over-effect');
    } else {
      document.body.classList.add('game-win-effect');
    }
  }

  if (isReset) {
    document.body.classList.add('reset-flash-effect');
    setTimeout(() => {
      document.body.classList.remove('reset-flash-effect');
    }, 200);
  }

  updateMinesCounter();
}

function handleLeftClick(evnt) {
  if (gameOver) return;

  const target = evnt.target;
  if (!target.classList.contains('klet')) return;

  const rw = parseInt(target.dataset.row, 10);
  const col = parseInt(target.dataset.col, 10);
  if (Number.isNaN(rw) || Number.isNaN(col)) return;

  if (board[rw][col].isOpened || board[rw][col].isFlagged) return;

  if (!firstClick) {
    firstClick = true;
    generateMinesModel(board, rw, col);
  }

  openCellModel(board, rw, col);

  if (board[rw][col].isMine) {
    gameOver = true;
    playExplosionSound();
    renderBoard();
    setTimeout(() => {
      alert('💣💣💣! ВЫ ПРОИГРАЛИ !💣💣💣');
      playConfirmLossSound();
    }, 150);
  } else {
    if (board[rw][col].neighborMines === 0) {
      playRevealAreaSound();
    } else {
      playClickSound();
    }
    checkWin();
    renderBoard();
  }

  saveGame();
}

function resetGame() {
  playButtonSound();

  firstClick = false;
  gameOver = false;

  createBoard();
  renderBoard(true);

  try {
    localStorage.removeItem('minesweeper_save');
  } catch (error) {
    console.warn('не удалось очистить сохранение:', error);
  }
}

function handleRightClick(evnt) {
  evnt.preventDefault();

  if (gameOver) return;

  const target = evnt.target;
  if (!target.classList.contains('klet')) return;

  const rw = parseInt(target.dataset.row, 10);
  const col = parseInt(target.dataset.col, 10);
  if (Number.isNaN(rw) || Number.isNaN(col)) return;

  const changed = toggleFlagModel(board, rw, col);
  if (!changed) return;

  playFlagSound();
  renderBoard();
  saveGame();
}

function updateSoundIcon() {
  const soundBtn = document.getElementById('sound-btn');
  if (soundBtn) {
    soundBtn.innerText = getMuted() ? '🔇' : '🔊';
  }
}

function handleSoundToggle() {
  const muted = toggleMute();
  if (!muted) {
    playButtonSound();
  }
  updateSoundIcon();
}

function checkWin() {
  const isWin = checkWinModel(board);
  if (!isWin) return;

  gameOver = true;

  confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  playWinSound();

  setTimeout(() => {
    alert('🎉🎉🎉! ВЫ ПОБЕДИЛИ !🎉🎉🎉');
  }, 500);
}

function updateMinesCounter() {
  const flaggedCount = countFlagsModel(board);
  const counterVal = document.getElementById('counter-val');
  if (counterVal) {
    counterVal.innerText = flaggedCount;
  }
}

function saveGame() {
  try {
    const gameState = {
      board: board,
      firstClick: firstClick,
      gameOver: gameOver,
    };
    localStorage.setItem('minesweeper_save', JSON.stringify(gameState));
  } catch (error) {
    console.warn('не удалось сохранить игру:', error);
  }
}

function loadGame() {
  try {
    const savedData = localStorage.getItem('minesweeper_save');

    if (!savedData) {
      createBoard();
      renderBoard();
      return;
    }

    const gameState = JSON.parse(savedData);
    if (!isValidGameState(gameState)) {
      throw new Error('Invalid save state');
    }
    board = gameState.board;
    countNeighborMinesModel(board);
    firstClick = gameState.firstClick;
    gameOver = gameState.gameOver;

    renderBoard();
  } catch (error) {
    console.warn('!сохранение было повреждено! запускаем новую игру..', error);
    try {
      localStorage.removeItem('minesweeper_save');
    } catch (removeError) {
      console.warn('не удалось удалить повреждённое сохранение:', removeError);
    }
    createBoard();
    renderBoard();
  }
}

const nameInput = document.getElementById('player-name');
const PLAYER_NAME_KEY = 'minesweeper_player_name';

if (nameInput) {
  try {
    const savedName = localStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) {
      nameInput.value = savedName;
    }
  } catch (e) {
    console.warn('Не удалось загрузить имя', e);
  }

  nameInput.addEventListener('input', (e) => {
    try {
      const cleanName = e.target.value.trim().substring(0, 15);
      if (cleanName) {
        localStorage.setItem(PLAYER_NAME_KEY, cleanName);
      } else {
        localStorage.removeItem(PLAYER_NAME_KEY);
      }
    } catch (err) {
      console.warn('Не удалось сохранить имя', err);
    }
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      nameInput.blur();
    }
  });
}

loadGame();
updateSoundIcon();
document
  .getElementById('game-board')
  .addEventListener('click', handleLeftClick);
document.getElementById('reset-btn').addEventListener('click', resetGame);
document
  .getElementById('game-board')
  .addEventListener('contextmenu', handleRightClick);
const soundBtn = document.getElementById('sound-btn');
if (soundBtn) {
  soundBtn.addEventListener('click', handleSoundToggle);
}
