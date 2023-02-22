const X_SYMBOL = 'x';
const O_SYMBOL = 'o';

// pubsub module ==========================================================================

const pubsub = (() => {
   const events = {};
   let subscriptionsId = -1;

   function publish(event, data) {
      if (!events[event]) {
         return false;
      }

      events[event].forEach((subscription) => {
         subscription.func(data);
      });
      return true;
   }

   function subscribe(event, func) {
      if (!events[event]) {
         events[event] = [];
      }

      subscriptionsId += 1;
      const token = subscriptionsId.toString();
      events[event].push({
         token,
         func,
      });
      return token;
   }

   function unsubscribe(token) {
      const found = Object.keys(events).some((event) =>
         events[event].some((subscription, index) => {
            const areEqual = subscription.token === token.toString();
            if (areEqual) {
               events[event].splice(index, 1);
            }
            return areEqual;
         })
      );

      return found ? token : null;
   }

   return {
      publish,
      subscribe,
      unsubscribe,
   };
})();

// player factory =================================================================================================
const createPlayer = (name, symbol) => ({ name, symbol });
// game logic  ====================================================================================================

let gameEngin = (function () {
   const WINNING_COMBINATIONS = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
   ];

   const player01 = createPlayer('amine', X_SYMBOL);
   const player02 = createPlayer('bot', O_SYMBOL);
   const players = [player01, player02];

   let currentPlayer = player01;

   pubsub.subscribe('stateUpdated', checkForEnd);

   function checkForEnd([state, index]) {
      if (isWinningMove(state, index)) {
         pubsub.publish('winner', currentPlayer);
         console.log(currentPlayer.name);
      } else if (isDrawEnd(state)) {
         pubsub.publish('draw');
         console.log('draw');
      } else {
         alternateTurn();
         pubsub.publish('currentPlayer', currentPlayer);
      }
   }

   function alternateTurn() {
      currentPlayer = players.find((player) => player !== currentPlayer);
   }

   function getCurrentPlayer() {
      return currentPlayer;
   }

   function isWinningMove(state, index) {
      const possibleWins = WINNING_COMBINATIONS.filter((combination) =>
         combination.includes(Number(index))
      );

      return possibleWins.some((combination) =>
         combination.every((i) => state[i] === currentPlayer.symbol)
      );
   }

   function isDrawEnd(state) {
      return Object.values(state).length === state.length;
   }

   return { getCurrentPlayer };
})();

// game board module ========================================================================================

const GameBoard = (function () {
   const state = new Array(9);

   pubsub.subscribe('cellClicked', updateGameState);

   function updateGameState(index) {
      const currentPlayer = gameEngin.getCurrentPlayer();
      if (!state[index]) {
         state[index] = currentPlayer.symbol;
         pubsub.publish('stateUpdated', [state, index]);
      }

      console.log(state);
   }
})();

// display controller ==========================================================================================
const displayController = (function () {
   const board = document.getElementById('board');
   pubsub.subscribe('stateUpdated', updateCell);

   function updateCell([state, index]) {
      const cell = document.querySelector(`[data-index="${index}"]`);
      cell.classList.add(state[index]);
      const currentPlayer = gameEngin.getCurrentPlayer();
      setBoardHoverClass(currentPlayer);
   }

   board.addEventListener('click', (event) => {
      if (!event.target.classList.contains('cell')) return;
      const targetIndex = event.target.dataset.index;
      pubsub.publish('cellClicked', targetIndex);
   });

   function setBoardHoverClass(player) {
      board.classList.remove('x');
      board.classList.remove('o');
      board.classList.add(player.symbol);
   }
   setBoardHoverClass(gameEngin.getCurrentPlayer());
})();

// =================================================================================================

const gameSettings = document.getElementById('settings-modal');
gameSettings.showModal();
const gameModeBtns = document.querySelectorAll('input[name="game-mode"]');
const gameLevel = document.getElementById('game-level');
const player02Name = document.getElementById('player-two');

gameModeBtns.forEach((btn) => {
   btn.addEventListener('change', (event) => {
      const mode = event.target.value;
      if (mode === 'PvP') {
         gameLevel.style.display = 'none';
         player02Name.style.display = 'block';
      } else if (mode === 'PvE') {
         gameLevel.style.display = 'block';
         player02Name.style.display = 'none';
      }
   });
});
