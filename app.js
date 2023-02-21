// pubsub module

const pubsub = (() => {
   const events = {};
   let subscribersId = -1;

   function publish(event, data) {
      if (!events[event]) {
         return false;
      }

      const subscribers = events[event];
      subscribers.forEach((subscriber) => {
         subscriber.func(event, data);
      });
      return true;
   }

   function subscribe(event, func) {
      if (!events[event]) {
         events[event] = [];
      }

      subscribersId += 1;
      const token = subscribersId.toString();
      events[event].push({
         token,
         func,
      });
      return token;
   }

   function unsubscribe(token) {
      const found = Object.keys(events).some((event) =>
         events[event].some((subscriber, index) => {
            const areEqual = subscriber.token === token.toString();
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

   pubsub.subscribe('movePlayed', updateGameState);

   function updateGameState(event, index) {
      let player = players.find((player) => player.turn === true);
      state[index] = player.symbol;
      console.log(state);
   }

   return { state, updateGameState };
})();

// display controller
const displayController = (function () {
   const board = document.getElementById('board');
   for (let i = 0; i < GameBoard.state.length; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.index = i;
      // cell.innerText = GameBoard.state[i];
      board.appendChild(cell);
   }

   // function handleSquareClick(event) {
   //    const targetIndex = event.target.dataset.index;
   //    GameBoard.updateGameState(targetIndex);
   //    event.target.innerText = GameBoard.state[targetIndex];
   //    gameEngin.alternateTurn();
   //    console.log(players, GameBoard);
   // }

   board.addEventListener('click', (event) => {
      if (!event.target.classList.contains('cell')) return;
      const targetIndex = event.target.dataset.index;
      pubsub.publish('movePlayed', targetIndex);
      console.log(targetIndex);
   });

   // function updateDisplay(e) {
   //    e.target.innerText = GameBoard.state[cell];
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
