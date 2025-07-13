// Game state
let peer, conn;
let gameState = {
    players: [],       // List of players
    currentPlayer: 0,  // Whose turn it is
    deck: [],          // Full deck of cards
    hands: {},         // Each player's cards
    direction: 1       // 1 = clockwise, -1 = counter-clockwise
};

// DOM Elements
const hostBtn = document.getElementById('host-game');
const joinSection = document.getElementById('join-section');
const joinBtn = document.getElementById('join-game');
const peerIdInput = document.getElementById('peer-id');
const gameIdDisplay = document.getElementById('game-id-display');
const yourIdSpan = document.getElementById('your-id');
const lobbyDiv = document.getElementById('lobby');
const gameDiv = document.getElementById('game');
const playersDiv = document.getElementById('players');
const yourCardsDiv = document.getElementById('your-cards');
const gameStatusDiv = document.getElementById('game-status');

// Initialize PeerJS
function initPeer() {
    peer = new Peer();
    
    peer.on('open', (id) => {
        console.log("Your Peer ID:", id);
        yourIdSpan.textContent = id;
    });

    peer.on('connection', (connection) => {
        conn = connection;
        conn.on('data', handleGameData);
    });
}

// Host a new game
hostBtn.addEventListener('click', () => {
    initPeer();
    hostBtn.disabled = true;
    joinSection.style.display = 'block';
    gameIdDisplay.style.display = 'block';
    
    // Initialize game
    gameState.players.push(peer.id);
    broadcastGameState();
});

// Join an existing game
joinBtn.addEventListener('click', () => {
    const hostId = peerIdInput.value.trim();
    if (!hostId) return;
    
    initPeer();
    conn = peer.connect(hostId);
    conn.on('data', handleGameData);
    
    lobbyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
});

// Handle incoming game data
function handleGameData(data) {
    if (data.type === 'gameState') {
        gameState = data.state;
        renderGame();
    }
}

// Broadcast game state to all players
function broadcastGameState() {
    if (conn) {
        conn.send({ type: 'gameState', state: gameState });
    }
}

// Render the game UI
function renderGame() {
    playersDiv.innerHTML = '';
    yourCardsDiv.innerHTML = '';
    
    // Show players
    gameState.players.forEach((playerId, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.textContent = `Player ${index + 1}`;
        playersDiv.appendChild(playerDiv);
    });
    
    // Show your cards (if you're in the game)
    if (gameState.hands[peer.id]) {
        gameState.hands[peer.id].forEach((card, i) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}`;
            cardDiv.textContent = `${card.rank}${card.suit}`;
            cardDiv.onclick = () => playCard(i);
            yourCardsDiv.appendChild(cardDiv);
        });
    }
    
    // Show whose turn it is
    const currentPlayerIndex = gameState.currentPlayer;
    gameStatusDiv.textContent = `Player ${currentPlayerIndex + 1}'s turn`;
}

// Play a card
function playCard(cardIndex) {
    if (gameState.currentPlayer !== gameState.players.indexOf(peer.id)) return;
    
    const nextPlayer = (gameState.currentPlayer + gameState.direction) % gameState.players.length;
    const card = gameState.hands[peer.id][cardIndex];
    
    // Remove card from your hand
    gameState.hands[peer.id].splice(cardIndex, 1);
    
    // Add card to next player's hand
    gameState.hands[gameState.players[nextPlayer]].push(card);
    
    // Check for matching cards (elimination)
    checkForMatches(gameState.players[nextPlayer]);
    
    // Move to next player
    gameState.currentPlayer = nextPlayer;
    
    // Broadcast updated state
    broadcastGameState();
    renderGame();
}

// Check if a player has matching cards
function checkForMatches(playerId) {
    const hand = gameState.hands[playerId];
    const rankCount = {};
    
    hand.forEach(card => {
        rankCount[card.rank] = (rankCount[card.rank] || 0) + 1;
    });
    
    // Remove pairs
    Object.keys(rankCount).forEach(rank => {
        if (rankCount[rank] >= 2) {
            gameState.hands[playerId] = hand.filter(card => card.rank !== rank);
        }
    });
}

// Initialize the deck
function initializeDeck() {
    const suits = ['♥', '♦', '♣', '♠'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    gameState.deck = [];
    
    suits.forEach(suit => {
        ranks.forEach(rank => {
            gameState.deck.push({ suit, rank });
        });
    });
    
    // Shuffle
    gameState.deck = gameState.deck.sort(() => Math.random() - 0.5);
    
    // Deal cards
    const playerCount = gameState.players.length;
    const cardsPerPlayer = Math.floor(52 / playerCount);
    
    gameState.players.forEach(playerId => {
        gameState.hands[playerId] = gameState.deck.splice(0, cardsPerPlayer);
    });
}

// Start the game when enough players join
function startGame() {
    initializeDeck();
    lobbyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    renderGame();
}