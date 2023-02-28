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
const createPlayer = (name, symbol, type) => ({ name, symbol, type });
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
   let gameMode;
   let aiDifficulty;

   pubsub.subscribe('newSettings', setupNewGame);

   function setupNewGame(formData) {
      player01 = createPlayer(
         formData.pl01Name,
         formData.pl01Symbol,
         formData.pl01Type
      );
      player02 = createPlayer(
         formData.pl02Name,
         formData.pl02Symbol,
         formData.pl02Type
      );
      players = [player01, player02];
      currentPlayer = players.find((player) => player.symbol === X_SYMBOL);
      gameMode = formData.mode;
      aiDifficulty = formData.difficultyChoice;
      console.log(aiDifficulty);
   }

   pubsub.subscribe('stateUpdated', checkForEnd);
   function checkForEnd([state, index]) {
      if (aWinExists(state, currentPlayer)) {
         const winCombination = getWinCombination(state, index);
         pubsub.publish('gameEnded', [currentPlayer, winCombination]);
      } else if (isDrawEnd(state)) {
         pubsub.publish('gameEnded', ['draw']);
      } else {
         alternateTurn();
         if (currentPlayer === player02 && gameMode === 'PvE')
            playAiMove(state, player02);
      }
   }

   function alternateTurn() {
      currentPlayer = players.find((player) => player !== currentPlayer);
   }

   function getCurrentPlayer() {
      return currentPlayer;
   }

   function aWinExists(state, player) {
      return WINNING_COMBINATIONS.some((combination) =>
         combination.every((i) => state[i] === player.symbol)
      );
   }

   function getWinCombination(state, index) {
      const possibleWins = WINNING_COMBINATIONS.filter((combination) =>
         combination.includes(Number(index))
      );
      return possibleWins.find((combination) =>
         combination.every((i) => state[i] === currentPlayer.symbol)
      );
   }

   function isDrawEnd(state) {
      return !state.includes(undefined);
   }

   function minimax(state, player, depth, maxDepth) {
      let bestMove;
      let bestScore;

      if (aWinExists(state, player02)) {
         return 10 - depth;
      }
      if (aWinExists(state, player01)) {
         return depth - 10;
      }
      if (isDrawEnd(state) || depth === maxDepth) {
         return 0;
      }

      if (player === player02) {
         bestScore = -Infinity;
         for (let i = 0; i < state.length; i++) {
            if (state[i] === undefined) {
               state[i] = player.symbol;
               let score = minimax(state, player01, depth + 1, maxDepth);
               if (score > bestScore) {
                  bestScore = score;
                  bestMove = i;
               }
               state[i] = undefined;
            }
         }
      } else {
         bestScore = Infinity;
         for (let i = 0; i < state.length; i++) {
            if (state[i] === undefined) {
               state[i] = player.symbol;
               let score = minimax(state, player02, depth + 1, maxDepth);
               if (score < bestScore) {
                  bestScore = score;
                  bestMove = i;
               }
               state[i] = undefined;
            }
         }
      }

      if (depth === 0) {
         return bestMove;
      }
      return bestScore + (player === player02 ? depth : -depth);
   }

   pubsub.subscribe('stateReset', playAiOnReset);
   function playAiOnReset() {
      if (currentPlayer === player02) playAiMove(new Array(9), player02);
   }

   function playAiMove(state, player) {
      const maxDepth = setMaxDepth();
      function setMaxDepth() {
         if (aiDifficulty === 'easy') return 1;
         if (aiDifficulty === 'medium') return 4;
         if (aiDifficulty === 'hard') return 8;
      }
      const aiMove = minimax(state, player, 0, maxDepth);
      setTimeout(publishMove, 700);
      function publishMove() {
         pubsub.publish('aiMove', aiMove);
      }
   }

   return { getCurrentPlayer };
})();

// game board module ======================================================================

const GameBoard = (function () {
   let state = new Array(9);

   pubsub.subscribe('cellClicked', updateBoardState);

   pubsub.subscribe('reset', resetState);

   pubsub.subscribe('aiMove', updateBoardState);

   function updateBoardState(index) {
      const currentPlayer = gameEngin.getCurrentPlayer();
      if (!state[index]) {
         state[index] = currentPlayer.symbol;
         pubsub.publish('stateUpdated', [state, index]);
         console.log(state);
      }
   }

   function resetState() {
      state = new Array(9);
      pubsub.publish('stateReset');
   }
})();

// display controller ======================================================================

const displayController = (function () {
   const board = document.getElementById('board');
   const settingsForm = document.getElementById('settings-form');
   const pl01InfoHeader = document.getElementById('pl01-info-header');
   const pl01InfoName = document.getElementById('pl01-info-name');
   const pl02InfoHeader = document.getElementById('pl02-info-header');
   const pl02InfoName = document.getElementById('pl02-info-name');
   const pl01InfoSymbol = document.getElementById('pl01-info-symbol');
   const pl02InfoSymbol = document.getElementById('pl02-info-symbol');
   const pl01SymbolChoice = document.getElementById('pl01-symbol-choice');
   const pl02SymbolChoice = document.getElementById('pl02-symbol-choice');
   const flipSymbolsBtn = document.getElementById('flip-symbols-btn');
   const message = document.getElementById('message');
   const boardCells = document.querySelectorAll('.board :not(#message)');
   const gameModeBtns = document.querySelectorAll('input[name="game-mode"]');
   const gameLevel = document.getElementById('game-level');
   const player02Div = document.getElementById('player-two');
   const settingsModal = document.getElementById('settings-modal');
   const resetBtn = document.getElementById('reset-btn');
   const settingsBtn = document.getElementById('settings-btn');
   const cancelSettings = document.getElementById('cancel-settings');

   pubsub.subscribe('stateUpdated', updateCells);

   function updateCells([state, index]) {
      const cell = document.querySelector(`[data-index="${index}"]`);
      cell.classList.add(state[index]);
      const currentPlayer = gameEngin.getCurrentPlayer();
      setBoardHoverClass(currentPlayer);
      lightCurrentSymbol(currentPlayer);
   }

   board.addEventListener('click', publishCellEvent);

   function publishCellEvent(event) {
      if (event.target.classList.contains('cell')) {
         const cellIndex = event.target.dataset.index;
         pubsub.publish('cellClicked', cellIndex);
      }
   }

   function setBoardHoverClass(player) {
      if (!player) return;
      board.classList.remove('x');
      board.classList.remove('o');
      board.classList.add(player.symbol);
   }

   function lightCurrentSymbol(player) {
      const playersSymbols = document.querySelectorAll('.player-symbol');
      playersSymbols.forEach((symbol) => {
         if (symbol.classList.contains(player.symbol)) {
            symbol.classList.add('light');
         } else {
            symbol.classList.remove('light');
         }
      });
   }

   settingsModal.addEventListener('cancel', (event) => {
      event.preventDefault();
   });

   settingsModal.showModal();
   gameModeBtns.forEach((btn) => {
      btn.addEventListener('change', (event) => {
         const mode = event.target.value;
         if (mode === 'PvP') {
            gameLevel.style.display = 'none';
            player02Div.style.display = 'block';
            document
               .getElementById('player02Name')
               .setAttribute('required', true);
         } else if (mode === 'PvE') {
            gameLevel.style.display = 'block';
            player02Div.style.display = 'none';
            document.getElementById('player02Name').removeAttribute('required');
         }
      });
   });

   flipSymbolsBtn.addEventListener('click', flipSymbols);
   function flipSymbols(e) {
      e.preventDefault();
      [pl01SymbolChoice, pl02SymbolChoice].forEach((symbol) => {
         symbol.classList.toggle(X_SYMBOL);
         symbol.classList.toggle(O_SYMBOL);
      });
   }
   function getGameSettings() {
      const gameMode = document.querySelector(
         'input[name="game-mode"]:checked'
      ).value;
      let formData = {};
      function getSymbol(elm) {
         if (elm.classList.contains(X_SYMBOL)) return X_SYMBOL;
         if (elm.classList.contains(O_SYMBOL)) return O_SYMBOL;
      }

      if (gameMode === 'PvP') {
         formData = {
            mode: gameMode,
            pl01Name: settingsForm.elements.player01Name.value,
            pl02Name: settingsForm.elements.player02Name.value,
            pl01Symbol: getSymbol(pl01SymbolChoice),
            pl02Symbol: getSymbol(pl02SymbolChoice),
            pl01Type: 'PLAYER-01',
            pl02Type: 'PLAYER-02',
         };
      } else if (gameMode === 'PvE') {
         const difficultyChoice = document.querySelector(
            'input[name="game-level"]:checked'
         ).value;
         formData = {
            mode: gameMode,
            pl01Name: settingsForm.elements.player01Name.value,
            pl02Name: `${difficultyChoice.toUpperCase()} AI`,
            pl01Symbol: getSymbol(pl01SymbolChoice),
            pl02Symbol: getSymbol(pl02SymbolChoice),
            pl01Type: 'PLAYER',
            pl02Type: 'COMPUTER',
            difficultyChoice,
         };
      }

      return formData;
   }

   settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let formData = getGameSettings();
      [pl01InfoSymbol, pl02InfoSymbol].forEach((symbol) => {
         symbol.classList.remove(X_SYMBOL);
         symbol.classList.remove(O_SYMBOL);
      });

      pl01InfoName.innerText = formData.pl01Name.toUpperCase();
      pl02InfoName.innerText = formData.pl02Name.toUpperCase();
      pl01InfoHeader.innerText = formData.pl01Type;
      pl02InfoHeader.innerText = formData.pl02Type;
      pl01InfoSymbol.classList.add(formData.pl01Symbol);
      pl02InfoSymbol.classList.add(formData.pl02Symbol);

      pubsub.publish('newSettings', formData);
      resetBoard();

      let currentPlayer = gameEngin.getCurrentPlayer();
      setBoardHoverClass(currentPlayer);
      lightCurrentSymbol(currentPlayer);

      settingsModal.close();
   });

   pubsub.subscribe('gameEnded', endGame);

   function endGame([winner, winCombination]) {
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
         board.removeEventListener('click', publishCellEvent);
      } else {
         message.style.backgroundColor = 'var(--theme-medium)';
         message.innerText = 'Tie Game';
      }

      message.style.display = 'block';
      boardCells.forEach((cell) => {
         cell.classList.add('dimmed');
      });
   }

   resetBtn.addEventListener('click', resetBoard);

   function resetBoard() {
      message.style.display = 'none';
      boardCells.forEach((cell) => {
         cell.style.backgroundColor = 'var(--theme-dark)';
         cell.classList.remove('dimmed');
         if (cell.classList.contains(O_SYMBOL)) cell.classList.toggle(O_SYMBOL);
         if (cell.classList.contains(X_SYMBOL)) cell.classList.toggle(X_SYMBOL);
      });

      board.addEventListener('click', publishCellEvent);
      pubsub.publish('reset');
   }

   settingsBtn.addEventListener('click', showSettings);
   function showSettings() {
      cancelSettings.style.display = 'block';
      settingsModal.showModal();
   }

   cancelSettings.addEventListener('click', (e) => {
      e.preventDefault();
      settingsModal.close();
   });
})();
