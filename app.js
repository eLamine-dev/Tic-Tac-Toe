// game board module
let gameBoard = (function () {
   const state = [1, 2, 3, 4, 5, 6, 7, 8, 9];
   // gameBoard.length = 9;

   function updateGameBoard(symbol) {
      gameBoard[index] = symbol;
   }

   return { state };
})();

// display controller
const displayController = (function () {
   const board = document.getElementById('board');
   for (let i = 0; i < gameBoard.state.length; i++) {
      const square = document.createElement('div');
      square.innerText = gameBoard.state[i];
      board.appendChild(square);
   }
})();

// game logic
let gameEngin = (function () {
   function alternateTurn() {}

   function checkForWinningMove() {}
})();

// player factory
const playerFactory = (name, symbol) => {
   const play = (symbol) => gameBoard.updateGameBoard(symbol);
   return { name, symbol, play };
};
