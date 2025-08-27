// Make connection
var socket = io.connect('localhost:4000');	//Uses the io interface to connect as a socket to localhost:4000

//Query DOM -- This is where all of the functionality of client side of the app happens
var	wrapper = document.getElementById('wrapper'),
    color1 = document.getElementById('color1'),
    color = document.getElementById('color'),
    play = document.getElementById('play'),
    help = document.getElementById('help');

//Party mode?!?!
var party = false;
var started = false;

//	Objects
var canvas,
    ctx,
    color,
    grid,
    playerGrid,
    blankPlayerGrid;

// Images
keyImage = new Image();
keyImage.src = "textures/key.png";
bombImage = new Image();
bombImage.src = "textures/bomb.png";
combImage = new Image();
combImage.src = "textures/comb.png";
smartyImage = new Image();
smartyImage.src = "textures/smarty.png";
bossImage = new Image();
bossImage.src = "textures/minotaur.png";

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

var heldKeys = new Set();

setInterval(function(){ // After a set time, put back the food
	for (let held of heldKeys) {
		socket.emit(held);
	}
},100);

//Functions
function keyDownHandler(event) {
    var key = String.fromCharCode(event.keyCode);
    if (started) {
        switch (key) {
            case "W":
                heldKeys.add('W');
                heldKeys.delete('S');
                break;
            case "S" :
                heldKeys.add('S');
                heldKeys.delete('W');
                break;
            case "A":
                heldKeys.add('A');
                heldKeys.delete('D');
                break;
            case "D":
                heldKeys.add('D');
                heldKeys.delete('A');
                break;
            case "E":
                heldKeys.add('E');
                break;
            case "Q":
                heldKeys.add('Q');
                break;
            case "P":
                party = !party;
                break;
        }
    }
}

function keyUpHandler(event) {
    var key = String.fromCharCode(event.keyCode);
    switch (key) {
        case "W":
            heldKeys.delete('W');
            break;
        case "S" :
            heldKeys.delete('S');
            break;
        case "A":
            heldKeys.delete('A');
            break;
        case "D":
            heldKeys.delete('D');
            break;
    }
}

//////////////////////////////////////////////
//##########################################//
//#Everything between here and socket setup#//
//#will be related to stuff that makes the #//
//#game.                                   #//
//##########################################//
//////////////////////////////////////////////

/* Food */
var foodGrid;

function drawFood(i, j, canvasi, canvasj) {
    if (foodGrid[i][j]) {
        if (party) {
            ctx.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
        } else {
            ctx.fillStyle = 'rgb(105, 105, 105)';
        }
        ctx.fillRect(canvasi * TILE_S + (7 * TILE_S / 16), canvasj * TILE_S + (7 * TILE_S / 16), TILE_S / 8, TILE_S / 8);
    }
}
/* End of food */

/* Enemies */
var enemyGrid = [];

function drawEnemy(i, j, canvasi, canvasj) {
    if (enemyGrid[i][j]) {
        switch(enemyGrid[i][j]) {
            case 'mob':
                ctx.fillStyle = 'rgb(173, 255, 47)';
                ctx.fillRect(canvasi * TILE_S + (3 * TILE_S / 8), canvasj * TILE_S + (3 * TILE_S / 8), TILE_S / 4, TILE_S / 4);
                break;
            case 'smarty':
                ctx.drawImage(smartyImage, canvasi * TILE_S, canvasj * TILE_S);
                break;
            case 'minotaur':
                ctx.drawImage(bossImage, canvasi * TILE_S, canvasj * TILE_S);
                break;
        }
    }
}

/* End of enemies */

/* Leaderboard */
var leaderboard = [];

function drawLeaderBoard() {
    ctx.font = "20px Arial";
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillText('Leaderboard', canvas.width - 3 * TILE_S + 30, 30);
    for (i = 0; i < Math.min(10, leaderboard.length); i++) {
        ctx.fillStyle = leaderboard[i][0];
        ctx.fillText(leaderboard[i][2] + '   ' + leaderboard[i][1], canvas.width - 3 * TILE_S + 30, (i + 2) * 30);
    }
}

/* End of leaderboard */

/* Items */

var itemGrid;
var items = [0, 0, 0];

function drawItem(i, j, canvasi, canvasj) {
    if (itemGrid[i][j]) {
        switch(itemGrid[i][j]) {
            case "bomb":
                //ctx.fillStyle = 'rgb(64, 64, 64)';
                //ctx.fillRect(canvasi * TILE_S + (1 * TILE_S / 4), canvasj * TILE_S + (1 * TILE_S / 4), TILE_S / 2, TILE_S / 2);
                //ctx.fillStyle = 'rgb(128, 128, 128)';
                //ctx.fillRect(canvasi * TILE_S + (7 * TILE_S / 16), canvasj * TILE_S + (TILE_S / 8), TILE_S / 8, TILE_S / 8);
                ctx.drawImage(bombImage, canvasi * TILE_S, canvasj * TILE_S);
                break;
            case "comb":
                //ctx.fillStyle = 'rgb(64, 64, 64)';
                //ctx.fillRect(canvasi * TILE_S + (1 * TILE_S / 4), canvasj * TILE_S + (1 * TILE_S / 4), TILE_S / 2, TILE_S / 2);
                //ctx.fillStyle = 'rgb(255, 255, 0)';
                //ctx.fillRect(canvasi * TILE_S + (7 * TILE_S / 16), canvasj * TILE_S + (TILE_S / 8), TILE_S / 8, TILE_S / 8);
                ctx.drawImage(combImage, canvasi * TILE_S, canvasj * TILE_S);
                break;
            case "boom":
                ctx.fillStyle = 'rgb(128, 128, 64, 0.5)';
                ctx.fillRect(canvasi * TILE_S, canvasj * TILE_S, TILE_S, TILE_S);
                break;
            case "key":
                //ctx.fillStyle = 'rgb(128, 128, 128)';
                //ctx.fillRect(canvasi * TILE_S + (7 * TILE_S / 16), canvasj * TILE_S + (TILE_S / 8), TILE_S / 8, 3 * TILE_S / 4);
                ctx.drawImage(keyImage, canvasi * TILE_S, canvasj * TILE_S);
                break;
            default:
                break;
        }
    }
}

/* End of Items */

/* Safezones */

var safeGrid;

function drawSafeZone(i, j, canvasi, canvasj) {
    if (safeGrid[i][j]) {
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(canvasi * TILE_S + 2, canvasj * TILE_S + 2, TILE_S - 4, TILE_S - 4);
    }
}

/* End of safezones */

play.addEventListener('click', function() {      //Adds an event listener on button that when pressed, emits the message and handle to server
    socket.emit('begin', {
        name: color1.value,
        color: color.value
    });
    wrapper.parentNode.removeChild(wrapper);
    started = true;
});

help.addEventListener('click', function() {    //Adds event listener for the help button
    //wrapper.parentNode.removeChild(wrapper);
    canvas.style.display = "none";
    wrapper.style.display = "none";
    var halp = document.createElement("img");
    //halp.style.cssText = "position: absolute; left: 45%; top: 45%; width:200px; height:100px; background-color: #EEEEEE;";
    halp.src = "textures/instructions.png";
    halp.align = "top";
    var back = document.createElement("button");
    var backText = document.createTextNode("Back");
    back.appendChild(backText);
    document.body.appendChild(halp);
    document.body.appendChild(back);

    back.addEventListener('click', function() {
        halp.parentNode.removeChild(halp);
        back.parentNode.removeChild(back);
        canvas.style.display = "block";
        wrapper.style.display = "block";
    });
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
    safeGrid = data.safe;
    for (var i = 0; i < blankPlayerGrid.length; i++) {
        playerGrid[i] = blankPlayerGrid[i].slice();
    }
	for (let value of data.locations) {
        playerGrid[value[0]][value[1]] = [value[2], value[4]];
	}
    for (var i = 0; i < blankPlayerGrid.length; i++) {
        enemyGrid[i] = blankPlayerGrid[i].slice();
    }
    for (let enemy of data.enemies) {
        enemyGrid[enemy[1]][enemy[2]] = enemy[0];
    }
});

socket.on('begin', function(data) {
    grid = data.grid;
    foodGrid = data.food;
    leaderboard = data.leaderboard;
    itemGrid = data.items;
    safeGrid = data.safe;
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
        enemyGrid[enemy[1]][enemy[2]] = enemy[0];
    }
	main();
});

socket.on('dead', function(data) {  //Called when a player dies
    started = false;
    canvas.style.display = "none";
    var panel = document.createElement("div");
    panel.style.cssText = "position: absolute; left: 45%; top: 45%; width:200px; height:100px; background-color: #FFB6C1; font-size: 24px; font-family: sans-serif;";
    scoreText = "Your score is: " + data.score;
    panel.innerHTML = scoreText;
    var respawn = document.createElement("button");
    var respawnText = document.createTextNode("Play Again");
    respawn.appendChild(respawnText);
    document.body.appendChild(panel);
    panel.appendChild(respawn);

    respawn.addEventListener('click', function() {
        panel.parentNode.removeChild(panel);
        respawn.parentNode.removeChild(respawn);
        canvas.style.display = "block";
        socket.emit('respawn');
        started = true;
    });
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
        canvasj = 0,
        rightMargin = 3; //Set the right margin for HUD in # of Tiles
        mainw = canvas.width - rightMargin * TILE_S;
        mainh = canvas.height;
        
    if (playerx * TILE_S < mainw/2) {
        if (playery * TILE_S < canvas.height/2) {                                                                            //Player is in Area 1
            drawMaze (0, mainw, 0, canvas.height);     //Renders the maze
        }
        else if (playery * TILE_S > maze_h - canvas.height/2) {                                                               //Player is in Area 2
            drawMaze (0, mainw, maze_h - canvas.height, maze_h);     //Renders the maze
        }
        else {                                                                                                        //Player is in Area 3
            drawMaze (0, mainw, (playery * TILE_S - canvas.height/2), (playery * TILE_S + canvas.height/2));
        }
    }
    else if (playerx * TILE_S > maze_w - mainw/2) {
        if (playery * TILE_S < canvas.height/2) {                                                                              //Player is in Area 4
            drawMaze (maze_w - mainw, maze_w, 0, canvas.height);
        }
        else if (playery * TILE_S > maze_h - canvas.height/2) {                                                                //Player is in Area 5
            drawMaze (maze_w - mainw, maze_w, maze_h - canvas.height, maze_h);
        }
        else {                                                                                                        //Player is in Area 6
            drawMaze (maze_w - mainw, maze_w, playery * TILE_S - canvas.height/2, playery * TILE_S + canvas.height/2);
        }
    }
    else {
        if (playery * TILE_S < canvas.height/2) {                                                                              //Player is in Area 7
            drawMaze (playerx * TILE_S - mainw/2, playerx * TILE_S + mainw/2, 0, canvas.height);
        }
        else if (playery * TILE_S > maze_h - canvas.height/2) {                                                                //Player is in Area 8
            drawMaze (playerx * TILE_S - mainw/2, playerx * TILE_S + mainw/2, maze_h - canvas.height, maze_h);
        }
        else {                                                                                                        //Player is in Area 9
            drawMaze (playerx * TILE_S - mainw/2, playerx * TILE_S + mainw/2, playery * TILE_S - canvas.height/2, playery * TILE_S + canvas.height/2);
        }
    }

    // Draw the score
//    ctx.font = "30px Arial";
//    ctx.strokeText('Score: ' + score, 10, 30);

//###########################//
//************HUD************//
//###########################//

    // Draw the leaderboard
    drawLeaderBoard();

    drawHUD();
}

//This method is a helper to make the REAL rendering less disgusting
function drawMaze (leftb, rightb, upb, downb, i, j) {
    var canvasi = 0,
        canvasj = 0;
    for (i = Math.floor(leftb / TILE_S); i < Math.floor(rightb / TILE_S); i++) {               //These two for loops help draw the maze
        for (j = Math.floor(upb / TILE_S); j < Math.floor(downb / TILE_S); j++) {

            //Draw the walls
            drawMazeTile(i, j, canvasi, canvasj);

            //Draw safe zone
            //drawSafeZone(i, j, canvasi, canvasj);

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
    if (party) {
        ctx.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
    } else {
        ctx.fillStyle = 'rgb(105, 105, 105)';
    }
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
        //ctx.fillStyle = 'rgb(64, 64, 64)';
        //ctx.fillText(playerGrid[i][j][1], canvasi * TILE_S + 2, canvasj * TILE_S);
        ctx.fillStyle = playerGrid[i][j][0];
        ctx.fillRect(canvasi * TILE_S + 4, canvasj * TILE_S + 4, TILE_S - 8, TILE_S - 8);
    }
}

function drawHUD() {
    /*
    ctx.font = "20px Arial";
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillText('Bombs: ' + items[1], canvas.width - 3 * TILE_S + 30, 330);
    ctx.fillText('Keys: ' + items[2], canvas.width - 3 * TILE_S + 30, 360);
    */
    ctx.font = "20px Arial";

    //Bomb stuff
    ctx.fillStyle = 'rgb(64, 64, 64)';
    //ctx.fillRect(canvas.width - 3 * TILE_S + 30 + (1 * TILE_S / 4), 330 + (1 * TILE_S / 4), TILE_S / 2, TILE_S / 2);
    //ctx.fillStyle = 'rgb(128, 128, 128)';
    //ctx.fillRect(canvas.width - 3 * TILE_S + 30 + (7 * TILE_S / 16), 330 + (TILE_S / 8), TILE_S / 8, TILE_S / 8);
    //ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.drawImage(bombImage, canvas.width - 3 * TILE_S + 16 + (7 * TILE_S / 16), 324 + (TILE_S / 8));
    ctx.fillText('X ' + items[1], canvas.width - 3 * TILE_S + 78, 360);

    //Key stuff
    ctx.drawImage(keyImage, canvas.width - 3 * TILE_S + 16 + (7 * TILE_S / 16), 368 + (TILE_S / 8));
    //ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillText('X ' + items[2], canvas.width - 3 * TILE_S + 78, 408);

    drawMiniMap();
}

function drawMiniMap() {
    ctx.fillStyle = 'rgb(64, 64, 64)';

    //Borders of minimap
    ctx.fillRect(canvas.width - 3 * TILE_S + 1, canvas.height - 1, 3 * TILE_S - 2, 1);
    ctx.fillRect(canvas.width - 3 * TILE_S + 1, canvas.height - 3 * TILE_S + 1, 1, 3 * TILE_S - 2);
    ctx.fillRect(canvas.width - 3 * TILE_S + 1, canvas.height - 3 * TILE_S + 1, 3 * TILE_S - 2, 1);
    ctx.fillRect(canvas.width - 1, canvas.height - 3 * TILE_S + 1, 1, 3 * TILE_S - 2);

    //Safe zone
    ctx.fillStyle = '#FFB6C1';
    for (i = 0; i < COLS; i++) {
        for (j = 0; j < ROWS; j++) {
            if (safeGrid[i][j]) {
                ctx.fillRect(canvas.width - 3 * TILE_S + 1 + (i * 3 * TILE_S / COLS), canvas.height - 3 * TILE_S + 1 + (j * 3 * TILE_S / ROWS), 3, 3);
            }
        }
    }

    //Player
    ctx.fillStyle = 'rgb(64, 64, 64)';
    ctx.fillRect(canvas.width - 3 * TILE_S + 1 + (playerx * 3 * TILE_S / COLS), canvas.height - 3 * TILE_S + 1 + (playery * 3 * TILE_S / ROWS), 3, 3);
    
    /*
    ctx.fillRect(canvasi * TILE_S, canvasj * TILE_S, 1, TILE_S);
    ctx.fillRect(canvasi * TILE_S, canvasj * TILE_S, TILE_S, 1);
    ctx.fillRect(canvasi * TILE_S + (TILE_S - 1), canvasj * TILE_S, 1, TILE_S);
    ctx.fillRect(canvasi * TILE_S, canvasj * TILE_S + (TILE_S - 1), TILE_S, 1);
    */
}

//  Starting point for program
function main() {
    init();
    loop();
}

main();