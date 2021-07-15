const BG_COLOUR = "#90EE90";
const SNAKE_COLOUR = "blue";
const SNAKE_ENEMY_COLOR = "red";
const FOOD_COLOUR = "white";
var socket = io("https://gdfsnake.herokuapp.com/", {
    "force new connection": true,
    "reconnectionAttempts": "Infinity",
    "timeout": 10001,
    "transports": ["websocket"]
}
);

// Socket - Recebimento
socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const gamePointDisplay = document.getElementById('gamePointDisplay');

const spritesP1 = new Image();
spritesP1.src = "./assets/Snake.png";

const spritesP2 = new Image();
spritesP2.src = "./assets/Snake2.png";

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);


function newGame() {
    socket.emit('newGame');
    init();
}

function joinGame() {
    const code = gameCodeInput.value;
    socket.emit('joinGame', code);
    init();
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

function init() {
    initialScreen.style.display = "none";
    gameScreen.style.display = "block";

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.height = 600;

    // var background = new Image();
    // background.src = "./assets/GrassCanvas.jpg";
    // background.onload = function () {
    //     ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    // }

    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    document.addEventListener('keydown', keydown);
    gameActive = true;
}

function keydown(e) {
    socket.emit('keydown', e.keyCode);
}

function paintGame(state) {

    gamePointDisplay.innerText = `Azul: ${state.players[0].point} x Vermelho: ${state.players[1].point}`

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const food = state.food;
    const gridsize = state.gridsize;
    const size = canvas.width / gridsize;

    // ctx.fillStyle = FOOD_COLOUR;
    // ctx.fillRect(food.x * size, food.y * size, size, size);
    ctx.drawImage(
        spritesP1, //spritesheet
        0, 192,  // x = 0 y = 192 (64+64+64) posição inicial do recorte
        64, 64,  // tamanho do recorte no nosso spritesheet
        food.x * size, food.y * size,    //posição da comida
        size, size            // tamanho da comida
    );

    paintPlayer(state.players[0], size, SNAKE_COLOUR, 'P1');
    paintPlayer(state.players[1], size, SNAKE_ENEMY_COLOR, 'P2');
}

function paintPlayer(playerState, size, colour, player) {
    const snake = playerState.snake;

    let sprite = null
    if (player == 'P1') {
        sprite = spritesP1;
    } else {
        sprite = spritesP2;
    }

    let spriteHeadPosition = {
        x: 256,
        y: 64,
    }
    let spriteTailPosition = {
        x: 256,
        y: 128
    }
    let spriteBodyPosition = {
        x: 64,
        y: 0,
    }

    // Sprite Cabeça
    if (playerState.vel.x === 1)
        spriteHeadPosition = { x: 256, y: 0 } // Direita
    if (playerState.vel.x === -1)
        spriteHeadPosition = { x: 192, y: 64 } // Esquerda
    if (playerState.vel.y === 1)
        spriteHeadPosition = { x: 256, y: 64 } // Baixo
    if (playerState.vel.y === -1)
        spriteHeadPosition = { x: 192, y: 0 } // Cima


    ctx.fillStyle = colour;
    for (let [index, cell] of snake.entries()) {
        if (index + 1 == snake.length) { // Cabeça
            ctx.drawImage(
                sprite,
                spriteHeadPosition.x, spriteHeadPosition.y,
                64, 64,
                cell.x * size, cell.y * size,
                size, size
            );
        } else if (index == 0) {

            if (snake[1].x == cell.x && snake[1].y < cell.y) // Cima                  
                spriteTailPosition = { x: 192, y: 128 }
            if (snake[1].x == cell.x && snake[1].y > cell.y) // Baixo                 
                spriteTailPosition = { x: 256, y: 192 }
            if (snake[1].x > cell.x && snake[1].y == cell.y) // Esquerda 
                spriteTailPosition = { x: 256, y: 128 }
            if (snake[1].x < cell.x && snake[1].y == cell.y) // Direita  
                spriteTailPosition = { x: 192, y: 192 }

            ctx.drawImage(
                sprite,
                spriteTailPosition.x, spriteTailPosition.y,
                64, 64,
                cell.x * size, cell.y * size,
                size, size
            );
        }
        else {

            let haveRight = haveLeft = haveUp = haveDown = false;

            // Determina Nó Posterior
            if (snake[index + 1].x == cell.x && snake[index + 1].y < cell.y) // Cima             
                haveUp = true
            if (snake[index + 1].x == cell.x && snake[index + 1].y > cell.y) // Baixo              
                haveDown = true
            if (snake[index + 1].x > cell.x && snake[index + 1].y == cell.y) // Esquerda 
                haveRight = true
            if (snake[index + 1].x < cell.x && snake[index + 1].y == cell.y) // Direita 
                haveLeft = true

            // Determina Nó Anterior
            if (snake[index - 1].x == cell.x && snake[index - 1].y < cell.y) // Cima              
                haveUp = true
            if (snake[index - 1].x == cell.x && snake[index - 1].y > cell.y) // Baixo              
                haveDown = true
            if (snake[index - 1].x > cell.x && snake[index - 1].y == cell.y) // Esquerda 
                haveRight = true
            if (snake[index - 1].x < cell.x && snake[index - 1].y == cell.y) // Direita
                haveLeft = true

            // UP - LEFT -> Direita

            if (haveLeft && haveRight) spriteBodyPosition = { x: 64, y: 0 };
            if (haveUp && haveDown) spriteBodyPosition = { x: 128, y: 64 };
            if (haveLeft && haveDown) spriteBodyPosition = { x: 128, y: 0 };
            if (haveLeft && haveUp) spriteBodyPosition = { x: 128, y: 128 };
            if (haveRight && haveDown) spriteBodyPosition = { x: 0, y: 0 };
            if (haveRight && haveUp) spriteBodyPosition = { x: 0, y: 64 };

            ctx.drawImage(
                sprite,
                spriteBodyPosition.x, spriteBodyPosition.y,
                64, 64,
                cell.x * size, cell.y * size,
                size, size
            );

            // ctx.fillRect(cell.x * size, cell.y * size, size, size);
        }
        // ctx.fillRect(cell.x * size, cell.y * size, size, size);
    }
}

function handleInit(number) {
    playerNumber = number;
}

function handleGameState(gameState) {
    if (!gameActive) {
        return;
    }
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
    if (!gameActive) {
        return;
    }

    data = JSON.parse(data);

    gameActive = false;

    if (data.winner === playerNumber) {
        alert('You Win!');
    } else {
        alert('You Lose :(');
    }

    reset()
}

function handleGameCode(gameCode) {
    gameCodeDisplay.innerText = gameCode;
}

function handleUnknownCode() {
    reset();
    alert('Unknown Game Code')
}

function handleTooManyPlayers() {
    reset();
    alert('This game is already in progress');
}

function reset() {
    playerNumber = null;
    gameCodeInput.value = '';
    initialScreen.style.display = "block";
    gameScreen.style.display = "none";
}