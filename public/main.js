// Make connection
var socket = io.connect('http://localhost:4000');	//Uses the io interface to connect as a socket to localhost:4000

//Query DOM -- This is where all of the functionality of client side of the app happens
var	wrapper = document.getElementById('wrapper'),
    color1 = document.getElementById('color1'),
    color = document.getElementById('color'),
    play = document.getElementById('play');

//	Objects
var canvas,
    ctx,
    color,
    grid,
    playerGrid,
    blankPlayerGrid;

//	Grid variables
var TILE_S = 48,
    COLS = 48,
    ROWS = 48,
    maze_w = COLS * TILE_S,
    maze_h = ROWS * TILE_S;

// Player variables
var playerx,
    playery,
    score;

playerGrid = [];
blankPlayerGrid = new Array(COLS);
for (i = 0; i < COLS; i++) {
    blankPlayerGrid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
        blankPlayerGrid[i][j] = 0;
    }
}

//Functions
function keyDownHandler(event) {
    var key = String.fromCharCode(event.keyCode);
    switch (key) {
        case "W":
            socket.emit('W');
            break;
        case "S" :
            socket.emit('S');
            break;
        case "A":
            socket.emit('A');
            break;
        case "D":
            socket.emit('D');
            break;
        case "E":
            socket.emit('E');
            break;
    }
}

function keyUpHandler(event) {
    var key = String.fromCharCode(event.keyCode);
    switch (key) {
        case "W":
            socket.emit('-W');
            break;
        case "S" :
            socket.emit('-S');
            break;
        case "A":
            socket.emit('-A');
            break;
        case "D":
            socket.emit('-D');
            break;
    }
}

//////////////////////////////////////////////
//##########################################//
//#Everything between here and socket setup#//
//#will be related to stuff that makes the #//
//#game aspect of the game lol.            #//
//##########################################//
//////////////////////////////////////////////

/* Food */
var foodGrid;

function drawFood(i, j, canvasi, canvasj) {
    if (foodGrid[i][j]) {
        ctx.fillStyle = 'rgb(105, 105, 105)';
        ctx.fillRect(canvasi * TILE_S + (7 * TILE_S / 16), canvasj * TILE_S + (7 * TILE_S / 16), TILE_S / 8, TILE_S / 8);
    }
}
/* End of food */

/* Enemies */
var enemyGrid = [];

function drawEnemy(i, j, canvasi, canvasj) {
    if (enemyGrid[i][j]) {
        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.fillRect(canvasi * TILE_S + (3 * TILE_S / 8), canvasj * TILE_S + (3 * TILE_S / 8), TILE_S / 4, TILE_S / 4);
    }
}

/* End of enemies */

/* Leaderboard */
var leaderboard = [];

function drawLeaderBoard() {
    ctx.font = "20px Arial";
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillText('Leaderboard', 0.9 * canvas.width, 30);
    for (i = 0; i < Math.min(10, leaderboard.length); i++) {
        ctx.fillText(leaderboard[i][2] + '   ' + leaderboard[i][1], 0.9 * canvas.width, (i + 2) * 30);
    }
}

/* End of leaderboard */

/* Items */

var itemGrid;
var items;

function drawItem(i, j, canvasi, canvasj) {
    if (itemGrid[i][j]) {
        ctx.fillStyle = 'rgb(64, 64, 64)';
        ctx.fillRect(canvasi * TILE_S + (1 * TILE_S / 4), canvasj * TILE_S + (1 * TILE_S / 4), TILE_S / 2, TILE_S / 2);
    }
}

/* End of Items */

play.addEventListener('click', function() {      //Adds an event listener on button that when pressed, emits the message and handle to server
    socket.emit('begin', {
        name: color1.value,
        color: color.value
    });
    wrapper.parentNode.removeChild(wrapper);
});

socket.on('privateState', function(data) {
    playerx = data.playerx;
    playery = data.playery;
    score = data.score;
    items = data.items;
});

socket.on('gameState', function(data) {
    grid = data.grid;
    foodGrid = data.food;
    leaderboard = data.leaderboard;
    itemGrid = data.items;
    for (var i = 0; i < blankPlayerGrid.length; i++) {
        playerGrid[i] = blankPlayerGrid[i].slice();
    }
	for (let value of data.locations) {
        playerGrid[value[0]][value[1]] = value[2];
	}
    for (var i = 0; i < blankPlayerGrid.length; i++) {
        enemyGrid[i] = blankPlayerGrid[i].slice();
    }
    for (let enemy of data.enemies) {
        enemyGrid[enemy[1]][enemy[2]] = 1;
    }
});

socket.on('begin', function(data) {
    grid = data.grid;
    foodGrid = data.food;
    leaderboard = data.leaderboard;
    itemGrid = data.items;
    for (var i = 0; i < blankPlayerGrid.length; i++) {
        playerGrid[i] = blankPlayerGrid[i].slice();
    }
    for (let value of data.locations) {
        playerGrid[value[0]][value[1]] = value[2];
    }
    for (var i = 0; i < blankPlayerGrid.length; i++) {
        enemyGrid[i] = blankPlayerGrid[i].slice();
    }
    for (let enemy of data.enemies) {
        enemyGrid[enemy[1]][enemy[2]] = 1;
    }
	main();
});

//  Initialize the canvas and context
canvas = document.createElement("canvas");
ctx = canvas.getContext("2d");
canvas.height = window.innerHeight - (window.innerHeight % TILE_S);
canvas.width = window.innerWidth - (window.innerWidth % TILE_S);//canvas.height;
canvas.setAttribute("tabIndex", "0");
canvas.focus();

// Adding keyboard listeners to canvas
window.addEventListener("keydown", keyDownHandler);
window.addEventListener("keyup", keyUpHandler);

//  Adding canvas to DOM
document.body.appendChild(canvas);

//Initialize Game
function init() {
    drawAll();
}

//  Main game loop
function loop() {
    drawAll();
    window.requestAnimationFrame(loop);
}

//	Draws background and all actors on screen
function drawAll() {
    //Draw background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //The beginning of REAL rendering
    var canvasi = 0,
        canvasj = 0;
    if (playerx * TILE_S < canvas.width/2) {
        if (playery * TILE_S < canvas.height/2) {                                                                            //Player is in Area 1
            drawMaze (0, canvas.width, 0, canvas.height);     //Renders the maze
        }
        else if (playery * TILE_S > maze_h - canvas.height/2) {                                                               //Player is in Area 2
            drawMaze (0, canvas.width, maze_h - canvas.height, maze_h);     //Renders the maze
        }
        else {                                                                                                        //Player is in Area 3
            drawMaze (0, canvas.width, (playery * TILE_S - canvas.height/2), (playery * TILE_S + canvas.height/2));
        }
    }
    else if (playerx * TILE_S > maze_w - canvas.width/2) {
        if (playery * TILE_S < canvas.height/2) {                                                                              //Player is in Area 4
            drawMaze (maze_w - canvas.width, maze_w, 0, canvas.height);
        }
        else if (playery * TILE_S > maze_h - canvas.height/2) {                                                                //Player is in Area 5
            drawMaze (maze_w - canvas.width, maze_w, maze_h - canvas.height, maze_h);
        }
        else {                                                                                                        //Player is in Area 6
            drawMaze (maze_w - canvas.width, maze_w, playery * TILE_S - canvas.height/2, playery *TILE_S + canvas.height/2);
        }
    }
    else {
        if (playery * TILE_S < canvas.height/2) {                                                                              //Player is in Area 7
            drawMaze (playerx * TILE_S - canvas.width/2, playerx * TILE_S + canvas.width/2, 0, canvas.height);
        }
        else if (playery * TILE_S > maze_h - canvas.height/2) {                                                                //Player is in Area 8
            drawMaze (playerx * TILE_S - canvas.width/2, playerx * TILE_S + canvas.width/2, maze_h - canvas.height, maze_h);
        }
        else {                                                                                                        //Player is in Area 9
            drawMaze (playerx * TILE_S - canvas.width/2, playerx * TILE_S + canvas.width/2, playery * TILE_S - canvas.height/2, playery * TILE_S + canvas.height/2);
        }
    }

    // Draw the score
    ctx.font = "30px Arial";
    ctx.strokeText('Score: ' + score, 10, 30);

    // Draw the leaderboard
    drawLeaderBoard();

}

//This method is a helper to make the REAL rendering less disgusting
function drawMaze (leftb, rightb, upb, downb, i, j) {
    var canvasi = 0,
        canvasj = 0;
    for (i = Math.floor(leftb / TILE_S); i < Math.floor(rightb / TILE_S); i++) {               //These two for loops help draw the maze
        for (j = Math.floor(upb / TILE_S); j < Math.floor(downb / TILE_S); j++) {

            //Draw the walls
            drawMazeTile(i, j, canvasi, canvasj);

            //Draw the food
            drawFood(i, j, canvasi, canvasj);

            //Draw the item
            drawItem(i, j, canvasi, canvasj);

            //Draw the enemies
            drawEnemy(i, j, canvasi, canvasj);

            //Draw the player
            drawPlayer(i, j, canvasi, canvasj);
            canvasj++;
        }
        canvasj = 0;
        canvasi++;
    }
    canvasi = 0;
}

function drawMazeTile (i, j, canvasi, canvasj) {
    ctx.fillStyle = 'rgb(105, 105, 105)';
    if(grid[i][j][0]) {
        ctx.fillRect(canvasi * TILE_S, canvasj * TILE_S, 1, TILE_S);
    }
    if(grid[i][j][1]) {
        ctx.fillRect(canvasi * TILE_S, canvasj * TILE_S, TILE_S, 1);
    }
    if(grid[i][j][2]) {
        ctx.fillRect(canvasi * TILE_S + (TILE_S - 1), canvasj * TILE_S, 1, TILE_S);
    }
    if(grid[i][j][3]) {
        ctx.fillRect(canvasi * TILE_S, canvasj * TILE_S + (TILE_S - 1), TILE_S, 1);
    }
}

//Player drawing for REAL rendering
function drawPlayer(i, j, canvasi, canvasj) {
    if (playerGrid[i][j]) {
        ctx.fillStyle = playerGrid[i][j];
        ctx.fillRect(canvasi * TILE_S + 2, canvasj * TILE_S + 2, TILE_S - 4, TILE_S - 4);
    }
}

//  Starting point for program
function main() {
    init();
    loop();
}

main();