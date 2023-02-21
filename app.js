// pubsub module

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

// game board module
const GameBoard = (function () {
   const state = new Array(9);

   pubsub.subscribe('cellClicked', updateGameState);

   function updateGameState(index) {
      let currentPlayer = players.find((player) => player.turn === true);
      state[index] = currentPlayer.symbol;
      pubsub.publish('stateUpdated', [state, index, currentPlayer]);
   }

   return { state };
})();

// display controller
const displayController = (function () {
   const board = document.getElementById('board');
   pubsub.subscribe('stateUpdated', updateCell);

   function updateCell([state, index]) {
      const cell = document.querySelector(`[data-index="${index}"]`);
      cell.innerText = state[index];
   }

   board.addEventListener('click', (event) => {
      if (!event.target.classList.contains('cell')) return;
      const targetIndex = event.target.dataset.index;
      pubsub.publish('cellClicked', targetIndex);
   });
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

   const stateSubscription = pubsub.subscribe('stateUpdated', checkForEnd);

   function checkForEnd([state, index, currentPlayer]) {
      if (isWinningMove(state, index, currentPlayer)) {
         pubsub.publish('winner', currentPlayer);
         console.log(currentPlayer.name);
      } else if (isDrawEnd(state)) {
         pubsub.publish('draw');
         console.log('draw');
      } else {
         alternateTurn();
      }
   }

   function alternateTurn() {
      players.forEach((player) => {
         player.turn = !player.turn;
      });
   }

   function isWinningMove(state, index, currentPlayer) {
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
})();

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
