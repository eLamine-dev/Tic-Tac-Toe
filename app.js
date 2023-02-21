// pubsub module

const pubsub = (() => {
   const events = {};
   let subscriptionsId = -1;

   function publish(event, data) {
      if (!events[event]) {
         return false;
      }

      events[event].forEach((subscription) => {
         subscription.func(event, data);
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

   function updateGameState(event, index) {
      let player = players.find((player) => player.turn === true);
      state[index] = player.symbol;
      pubsub.publish('stateUpdated', [state, index]);
      console.log(state, index);
   }

   // return { state, updateGameState };
})();

// display controller
const displayController = (function () {
   const board = document.getElementById('board');
   pubsub.subscribe('stateUpdated', updateCell);

   function updateCell(event, [state, index]) {
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
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
      [1, 5, 9],
      [3, 5, 7],
   ];

   const stateSubscription = pubsub.subscribe(
      'stateUpdated',
      checkForWinningMove
   );
   function alternateTurn() {
      players.forEach((player) => {
         player.turn = !player.turn;
      });
   }

   function checkForWinningMove(event, state, index) {
      alternateTurn();
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
