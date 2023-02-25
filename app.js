const X_SYMBOL = 'x';
const O_SYMBOL = 'o';

// pubsub module ======================================================================

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

// player factory ======================================================================
const createPlayer = (name, symbol) => ({ name, symbol });
// game logic  ======================================================================

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

   let player01;
   let player02;
   let players;
   let currentPlayer;

   pubsub.subscribe('stateUpdated', checkForEnd);
   pubsub.subscribe('newSettings', setupNewGame);

   function setupNewGame(formData) {
      player01 = createPlayer(formData.pl01Name, formData.pl01Symbol);
      player02 = createPlayer(formData.pl02Name, formData.pl02Symbol);
      players = [player01, player02];
      currentPlayer = players.find((player) => player.symbol === X_SYMBOL);
   }

   function checkForEnd([state, index]) {
      const winCombination = findWinCombination(state, index);
      if (winCombination) {
         pubsub.publish('gameEnded', [currentPlayer, winCombination]);
         console.log(currentPlayer.name);
      } else if (isDrawEnd(state)) {
         pubsub.publish('gameEnded', ['draw']);
         console.log('draw');
      } else {
         alternateTurn();
      }
   }

   function alternateTurn() {
      currentPlayer = players.find((player) => player !== currentPlayer);
   }

   function getCurrentPlayer() {
      return currentPlayer;
   }

   function findWinCombination(state, index) {
      const possibleWins = WINNING_COMBINATIONS.filter((combination) =>
         combination.includes(Number(index))
      );

      return possibleWins.find((combination) =>
         combination.every((i) => state[i] === currentPlayer.symbol)
      );
   }

   function isDrawEnd(state) {
      return Object.values(state).length === state.length;
   }

   return { getCurrentPlayer };
})();

// game board module ======================================================================

const GameBoard = (function () {
   const state = new Array(9);

   pubsub.subscribe('cellClicked', updateBoardState);

   function updateBoardState(index) {
      const currentPlayer = gameEngin.getCurrentPlayer();
      if (!state[index]) {
         state[index] = currentPlayer.symbol;
         pubsub.publish('stateUpdated', [state, index]);
      }

      console.log(state);
   }
})();

// display controller ======================================================================

const displayController = (function () {
   const board = document.getElementById('board');

   pubsub.subscribe('stateUpdated', updateCell);

   function updateCell([state, index]) {
      const cell = document.querySelector(`[data-index="${index}"]`);
      cell.classList.add(state[index]);
      setBoardHoverClass(gameEngin.getCurrentPlayer());
   }

   board.addEventListener('click', (event) => {
      if (!event.target.classList.contains('cell')) return;
      const cellIndex = event.target.dataset.index;
      pubsub.publish('cellClicked', cellIndex);
   });

   function setBoardHoverClass(player) {
      board.classList.remove('x');
      board.classList.remove('o');
      board.classList.add(player.symbol);
   }

   const settingsModal = document.getElementById('settings-modal');
   settingsModal.addEventListener('cancel', (event) => {
      event.preventDefault();
   });

   const gameModeBtns = document.querySelectorAll('input[name="game-mode"]');
   const gameLevel = document.getElementById('game-level');
   const player02input = document.getElementById('player-two');
   settingsModal.showModal();
   gameModeBtns.forEach((btn) => {
      btn.addEventListener('change', (event) => {
         const mode = event.target.value;
         if (mode === 'PvP') {
            gameLevel.style.display = 'none';
            player02input.style.display = 'block';
            document
               .getElementById('player02Name')
               .setAttribute('required', true);
         } else if (mode === 'PvE') {
            gameLevel.style.display = 'block';
            player02input.style.display = 'none';
            document.getElementById('player02Name').removeAttribute('required');
         }
      });
   });

   const settingsForm = document.getElementById('settings-form');
   const pl01InfoHeader = document.getElementById('pl01-info-header');
   const pl01InfoName = document.getElementById('pl01-info-name');
   const pl02InfoHeader = document.getElementById('pl02-info-header');
   const pl02InfoName = document.getElementById('pl02-info-name');
   const pl01InfoSymbol = document.getElementById('pl01-info-symbol');
   const pl02InfoSymbol = document.getElementById('pl02-info-symbol');

   function getGameSettings() {
      const gameMode = document.querySelector(
         'input[name="game-mode"]:checked'
      ).value;
      let formData = {};
      function getSymbol(elm) {
         if (elm.classList.contains(X_SYMBOL)) return X_SYMBOL;
         if (elm.classList.contains(O_SYMBOL)) return O_SYMBOL;
      }
      const pl01Symbol = document.getElementById('pl01-symbol');
      const pl02Symbol = document.getElementById('pl02-symbol');
      if (gameMode === 'PvP') {
         formData = {
            mode: gameMode,
            pl01Name: settingsForm.elements.player01Name.value,
            pl02Name: settingsForm.elements.player02Name.value,
            pl01Symbol: getSymbol(pl01Symbol),
            pl02Symbol: getSymbol(pl02Symbol),
            pl01Header: 'PLAYER-01',
            pl02Header: 'PLAYER-02',
         };
      } else if (gameMode === 'PvE') {
         const aiDifficulty = document.querySelector(
            'input[name="game-level"]:checked'
         ).value;
         formData = {
            mode: gameMode,
            pl01Name: settingsForm.elements.player01Name.value,
            pl02Name: `MINIMAX AI`,
            pl01Symbol: getSymbol(pl01Symbol),
            pl02Symbol: getSymbol(pl02Symbol),
            pl01Header: 'PLAYER',
            pl02Header: 'COMPUTER',
            difficulty: aiDifficulty,
         };
      }

      return formData;
   }

   settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let formData = getGameSettings();

      pl01InfoName.innerText = formData.pl01Name.toUpperCase();
      pl02InfoName.innerText = formData.pl02Name.toUpperCase();
      pl01InfoHeader.innerText = formData.pl01Header;
      pl02InfoHeader.innerText = formData.pl02Header;
      pl01InfoSymbol.classList.add(formData.pl01Symbol);
      pl02InfoSymbol.classList.add(formData.pl02Symbol);

      pubsub.publish('newSettings', formData);

      setBoardHoverClass(gameEngin.getCurrentPlayer());

      settingsModal.close();
      console.log(formData);
   });

   pubsub.subscribe('gameEnded', endGame);
   function endGame([winner, winCombination]) {
      const message = document.getElementById('message');
      const boardBackground = document.querySelectorAll(
         '.board :not(#message)'
      );
      if (winner !== 'draw') {
         message.innerText = `${winner.name.toUpperCase()} Won!`;
         winCombination.forEach((index) => {
            const cell = document.querySelector(`[data-index="${index}"]`);
            if (winner.symbol === X_SYMBOL) {
               cell.style.backgroundColor = 'var(--dark-red)';
               message.style.backgroundColor = 'var(--red)';
            } else {
               cell.style.backgroundColor = 'var(--dark-blue)';
               message.style.backgroundColor = 'var(--blue)';
            }
         });
      }

      message.style.display = 'block';
      boardBackground.forEach((elm) => {
         elm.style.filter = 'opacity(0.5)';
      });
   }
})();

// ======================================================================
