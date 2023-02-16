// game board module
const GameBoard = (function () {
   const state = new Array(9);

   function updateGameState(index) {
      let player = players.find((player) => player.turn === true);
      state[index] = player.symbol;
   }

   return { state, updateGameState };
})();

// display controller
const displayController = (function () {
   const board = document.getElementById('board');
   for (let i = 0; i < GameBoard.state.length; i++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.dataset.index = i;
      // square.innerText = GameBoard.state[i];
      board.appendChild(square);
   }

   function handleSquareClick(event) {
      if (!event.target.classList.contains('square')) return;
      const targetIndex = event.target.dataset.index;
      GameBoard.updateGameState(targetIndex);
      event.target.innerText = GameBoard.state[targetIndex];
      gameEngin.alternateTurn();
      console.log(players, GameBoard);
   }

   board.addEventListener('click', handleSquareClick);

   // function updateDisplay(e) {
   //    e.target.innerText = GameBoard.state[square];
   // }
})();

// player factory
const createPlayer = (name, symbol, turn) => {
   const play = () => GameBoard.updateGameBoard(symbol);
   return { name, symbol, turn, play };
};

const player01 = createPlayer('amine', 'x', true);
const player02 = createPlayer('bot', 'o', false);

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

const gameSettings = document.getElementById('game-settings');

gameSettings.showModal();

const gameModeBtns = document.querySelectorAll('input[name="game-mode"]');
const gameLevel = document.getElementById('game-level');
const playe02Name = document.querySelector('input[name="player02-name"]');

gameModeBtns.forEach((btn) => {
   btn.addEventListener('change', (event) => {
      const mode = event.target.value;
      if (mode === 'PvP') {
         gameLevel.style.visibility = 'hidden';
      } else if (mode === 'PvE') {
         gameLevel.style.visibility = 'visible';
         playe02Name.value = 'Computer';
      }
   });
});
