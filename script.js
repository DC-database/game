// Game state
let gameState = {
    players: [],
    deck: [],
    hands: {},
    currentPlayer: 0,
    direction: 1, // 1 = clockwise, -1 = counter-clockwise
    selectedCard: null
};

// DOM elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const playerInputs = document.getElementById('player-inputs');
const addPlayerBtn = document.getElementById('add-player');
const startGameBtn = document.getElementById('start-game');
const playerAreas = document.getElementById('player-areas');
const currentPlayerSpan = document.querySelector('#current-player span');
const nextTurnBtn = document.getElementById('next-turn');
const gameMessage = document.getElementById('game-message');

// Initialize game
function initGame() {
    // Create deck
    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    gameState.deck = [];
    
    for (const suit of suits) {
        for (const rank of ranks) {
            gameState.deck.push({ suit, rank });
        }
    }
    
    // Shuffle deck
    shuffleDeck(gameState.deck);
    
    // Deal cards
    const playerCount = gameState.players.length;
    const cardsPerPlayer = Math.floor(52 / playerCount);
    
    gameState.hands = {};
    gameState.players.forEach(player => {
        gameState.hands[player] = gameState.deck.splice(0, cardsPerPlayer);
    });
    
    // Start with first player
    gameState.currentPlayer = 0;
    gameState.selectedCard = null;
    
    renderGame();
}

// Shuffle deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Render game UI
function renderGame() {
    playerAreas.innerHTML = '';
    
    gameState.players.forEach((player, index) => {
        const playerArea = document.createElement('div');
        playerArea.className = 'player-area';
        playerArea.innerHTML = `
            <h3>${player} ${index === gameState.currentPlayer ? '👑' : ''}</h3>
            <div class="player-cards" id="cards-${index}"></div>
            <p>Cards: ${gameState.hands[player].length}</p>
        `;
        playerAreas.appendChild(playerArea);
        
        // Render cards for current player
        if (index === gameState.currentPlayer) {
            const cardsContainer = document.getElementById(`cards-${index}`);
            gameState.hands[player].forEach((card, cardIndex) => {
                const cardElement = document.createElement('div');
                cardElement.className = `card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}`;
                cardElement.textContent = `${card.rank}${card.suit}`;
                cardElement.addEventListener('click', () => selectCard(cardIndex));
                cardsContainer.appendChild(cardElement);
            });
        } else {
            // Show card backs for other players
            const cardsContainer = document.getElementById(`cards-${index}`);
            for (let i = 0; i < gameState.hands[player].length; i++) {
                const cardBack = document.createElement('div');
                cardBack.className = 'card';
                cardBack.style.backgroundColor = '#333';
                cardsContainer.appendChild(cardBack);
            }
        }
    });
    
    currentPlayerSpan.textContent = gameState.players[gameState.currentPlayer];
    gameMessage.textContent = `${gameState.players[gameState.currentPlayer]}, select a card to pass`;
}

// Select a card
function selectCard(cardIndex) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.classList.remove('selected'));
    
    const selectedCard = document.querySelector(`#cards-${gameState.currentPlayer} .card:nth-child(${cardIndex + 1})`);
    selectedCard.classList.add('selected');
    
    gameState.selectedCard = cardIndex;
    nextTurnBtn.disabled = false;
}

// Pass card to next player
function nextTurn() {
    if (gameState.selectedCard === null) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const nextPlayerIndex = (gameState.currentPlayer + gameState.direction) % gameState.players.length;
    if (nextPlayerIndex < 0) nextPlayerIndex = gameState.players.length - 1;
    const nextPlayer = gameState.players[nextPlayerIndex];
    
    // Move card
    const card = gameState.hands[currentPlayer][gameState.selectedCard];
    gameState.hands[currentPlayer].splice(gameState.selectedCard, 1);
    gameState.hands[nextPlayer].push(card);
    
    // Check for matches
    checkForMatches(nextPlayer);
    
    // Move to next player
    gameState.currentPlayer = nextPlayerIndex;
    gameState.selectedCard = null;
    nextTurnBtn.disabled = true;
    
    // Check for winner
    if (checkForWinner()) {
        gameMessage.textContent = `${currentPlayer} has no cards left!`;
        setTimeout(() => {
            alert(`${currentPlayer} wins!`);
            resetGame();
        }, 1000);
        return;
    }
    
    renderGame();
}

// Check for matching cards
function checkForMatches(player) {
    const hand = gameState.hands[player];
    const rankCount = {};
    
    hand.forEach(card => {
        rankCount[card.rank] = (rankCount[card.rank] || 0) + 1;
    });
    
    // Remove pairs
    Object.keys(rankCount).forEach(rank => {
        if (rankCount[rank] >= 2) {
            gameState.hands[player] = hand.filter(card => card.rank !== rank);
            gameMessage.textContent = `${player} eliminated a pair of ${rank}s!`;
        }
    });
}

// Check for winner
function checkForWinner() {
    return gameState.players.some(player => gameState.hands[player].length === 0);
}

// Reset game
function resetGame() {
    setupScreen.style.display = 'block';
    gameScreen.style.display = 'none';
}

// Event listeners
addPlayerBtn.addEventListener('click', () => {
    if (playerInputs.children.length >= 4) return;
    
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'player-name';
    newInput.placeholder = `Player ${playerInputs.children.length + 1}`;
    playerInputs.appendChild(newInput);
});

startGameBtn.addEventListener('click', () => {
    const players = [];
    document.querySelectorAll('.player-name').forEach(input => {
        if (input.value.trim()) {
            players.push(input.value.trim() || input.placeholder);
        }
    });
    
    if (players.length < 2) {
        alert('You need at least 2 players!');
        return;
    }
    
    gameState.players = players;
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    initGame();
});

nextTurnBtn.addEventListener('click', nextTurn);