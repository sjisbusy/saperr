import { expect, test } from 'vitest';
import {
  createBoardModel,
  generateMinesModel,
  countNeighborMinesModel,
  checkWinModel,
  isValidGameState,
  MINE_COUNT,
  openCellModel,
} from './game-logic.js';

test('тест 1: создание поля размером 9 на 9', function () {
  let testBoard = createBoardModel();

  expect(testBoard.length).toBe(9);
  expect(testBoard[0].length).toBe(9);
  expect(testBoard[0][0].isMine).toBe(false);
  expect(testBoard[0][0].isOpened).toBe(false);
});

test('тест 2: генерация мин в соответствии с константой MINE_COUNT', function () {
  let testBoard = createBoardModel();
  generateMinesModel(testBoard, 0, 0);

  let minesCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (testBoard[r][c].isMine === true) {
        minesCount++;
      }
    }
  }
  expect(minesCount).toBe(MINE_COUNT);
});

test('тест 3: проверка сейв-зоны (3х3) вокруг первого клика', function () {
  let testBoard = createBoardModel();
  generateMinesModel(testBoard, 4, 4);

  for (let r = 3; r <= 5; r++) {
    for (let c = 3; c <= 5; c++) {
      expect(testBoard[r][c].isMine).toBe(false);
    }
  }
});

test('тест 4: подсчёт количества мин вокруг клетки', function () {
  let testBoard = createBoardModel();
  testBoard[0][0].isMine = true;
  testBoard[0][1].isMine = true;

  countNeighborMinesModel(testBoard);

  expect(testBoard[1][1].neighborMines).toBe(2);
  expect(testBoard[5][5].neighborMines).toBe(0);
});

test('тест 5: проверка условия победы', function () {
  let testBoard = createBoardModel();
  testBoard[0][0].isMine = true;

  expect(checkWinModel(testBoard)).toBe(false);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!testBoard[r][c].isMine) {
        testBoard[r][c].isOpened = true;
      }
    }
  }

  expect(checkWinModel(testBoard)).toBe(true);
});

test('тест 6: проверка данных сохранения', function () {
  let validBoard = createBoardModel();
  let validState = {
    board: validBoard,
    firstClick: false,
    gameOver: false,
  };

  expect(isValidGameState(validState)).toBe(true);
  expect(isValidGameState(null)).toBe(false);
  expect(
    isValidGameState({ board: [], firstClick: false, gameOver: false }),
  ).toBe(false);

  let conflictBoard = createBoardModel();
  conflictBoard[0][0].isOpened = true;
  conflictBoard[0][0].isFlagged = true;
  expect(
    isValidGameState({
      board: conflictBoard,
      firstClick: false,
      gameOver: false,
    }),
  ).toBe(false);

  expect(
    isValidGameState({
      board: validBoard,
      firstClick: false,
      gameOver: true,
    }),
  ).toBe(false);
});

test('тест 7: рекурсивное открытие пустых клеток', function () {
  let testBoard = createBoardModel();
  testBoard[0][0].isMine = true;
  countNeighborMinesModel(testBoard);

  openCellModel(testBoard, 8, 8);

  expect(testBoard[8][8].isOpened).toBe(true);
  expect(testBoard[5][5].isOpened).toBe(true);
  expect(testBoard[0][0].isOpened).toBe(false);
});
