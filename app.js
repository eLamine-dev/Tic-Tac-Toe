// game board module
let gameBoard = (function () {
   const state = [];
   state.length = 9;

   function updateGameState(index) {
      let player = players.find((player) => player.turn === true);
      state[index] = player.symbol;
   }

   return { state, updateGameState };
})();

// display controller
const displayController = (function () {
   const board = document.getElementById('board');
   for (let i = 0; i < gameBoard.state.length; i++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.dataset.index = i;
      square.innerText = gameBoard.state[i];
      board.appendChild(square);
   }

   function getMoveInfo(e) {
      const targetSquare = e.target.dataset.index;
      gameBoard.updateGameState(targetSquare);
      e.target.innerText = gameBoard.state[targetSquare];
      gameEngin.alternateTurn();
      console.log(players, gameBoard);
   }

   board.addEventListener('click', getMoveInfo);

   // function updateDisplay(e) {
   //    e.target.innerText = gameBoard.state[targetSquare];
   // }
})();

// player factory
const playerFactory = (name, symbol, turn) => {
   const play = () => gameBoard.updateGameBoard(symbol);
   return { name, symbol, turn, play };
};

const player01 = playerFactory('amine', 'x', true);
const player02 = playerFactory('bot', 'o', false);

const players = [player01, player02];

// game logic

let gameEngin = (function () {
   function alternateTurn() {
      players.forEach((player) => {
         player.turn = !player.turn;
      });
   }

   function checkForWinningMove() {}

   return { alternateTurn };
})();
