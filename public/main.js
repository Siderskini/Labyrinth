// Make connection
var socket = io.connect('http://localhost:4000');	//Uses the io interface to connect as a socket to localhost:4000

//Query DOM -- This is where all of the functionality of client side of the app happens
	//feedback = document.getElementById('feedback');

//	Objects
var canvas,
    ctx,
    color,
    grid,
    playerGrid,
    blankPlayerGrid,
    area; //This is for testing of rendering

var actorList = [];
    //obstacle,
    //follow,
    //wimp;

//	Grid variables
var TILE_S = 48,
    COLS = 48,
    ROWS = 48,
    maze_w = COLS * TILE_S,
    maze_h = ROWS * TILE_S;

// Player variables
var playerx,
    playery;

playerGrid = [];
blankPlayerGrid = new Array(COLS);
for (i = 0; i < COLS; i++) {
    blankPlayerGrid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
        blankPlayerGrid[i][j] = 0;
    }
}

//Functions
function logMapElements(value, key, map) {	//Function to print map
  console.log(`m[${key}] = ${value}`);
}

//Emit Events to server
/*
btn.addEventListener('click', function() {		//Adds an event listener on button that when pressed, emits the message and handle to server
	socket.emit('chat', {
		message: message.value,
		handle: handle.value
	});
});

message.addEventListener('keypress', function() {	//Adds an event listener on message that when typed in, emits the handle to server
	socket.emit('typing', handle.value);
});
*/
function keyDownHandler(event) {
    var key = String.fromCharCode(event.keyCode);
    //console.log(key);
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
    }
}

function keyUpHandler(event) {
    var key = String.fromCharCode(event.keyCode);
    //console.log('-' + key);
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

//Listen for events from server
/*
socket.on('chat', function(data){																	//When a client receives a chat event from server...
	feedback.innerHTML = "";																		//The feedback is set to blank string
	output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.message + '</p>';		//It concatenates this message to output
});

socket.on('typing', function(data){																	//When a client receives a typing event from server...
	feedback.innerHTML = '<p><em>' + data + ' is typing a message...</em></p>';					    //The feedback is set to "x is typing a message"
});
*/

socket.on('locations', function(data) {
	//console.log(data);
    grid = data.grid;
    for (var i = 0; i < blankPlayerGrid.length; i++) {
        playerGrid[i] = blankPlayerGrid[i].slice();
    }
    //playerGrid = blankPlayerGrid.slice();
    playerx = data.playerx;
    playery = data.playery;
    actorList = [];
	for (let value of data.locations) {
  		//console.log(value);
        playerGrid[value[0]/TILE_S][value[1]/TILE_S] = value[2];
        //actorList.push(new Square(value[0], value[1], TILE_S, TILE_S, value[2]));
	}
});

socket.on('begin', function(data) {
    grid = data.grid;
    for (var i = 0; i < blankPlayerGrid.length; i++) {
        playerGrid[i] = blankPlayerGrid[i].slice();
    }
    playerx = data.playerx;
    playery = data.playery;
    //console.log(grid);
    for (let value of data.locations) {
        //console.log(value);
        playerGrid[value[0]/TILE_S][value[1]/TILE_S] = value[2];
        //actorList.push(new Square(value[0], value[1], TILE_S, TILE_S, value[2]));
    }
	main();
});

//  Initialize the canvas and context
canvas = document.createElement("canvas");
ctx = canvas.getContext("2d");
canvas.width = window.innerWidth - (window.innerWidth % TILE_S);//TILE_S * COLS;
canvas.height = window.innerHeight - (window.innerHeight % TILE_S);//TILE_S * ROWS;
canvas.setAttribute("tabIndex", "0");
canvas.focus();

// Adding keyboard listeners to canvas
canvas.addEventListener("keydown", keyDownHandler);
canvas.addEventListener("keyup", keyUpHandler);

//  Adding canvas to DOM
document.body.appendChild(canvas);

//Initialize Game
function init() {
    //	Initialize actors
    //	SHOULD BE KEPT INSIDE A DATA STRUCTURE
    drawAll();
    //hero = new Square(16, 16, TILE_S, TILE_S);
    //obstacle = new Square(600,600,TILE_S*2, TILE_S*2);
    //follow = new Square(400,600,TILE_S/2, TILE_S/2);
    //wimp = new Square(400,600,TILE_S/2, TILE_S/2);
    
    //applyDraw(hero);
    //applyDraw(obstacle);
    //applyDraw(follow);
    //applyDraw(wimp);
    //applyGravity(hero, GRAVITY);
}

//  Main game loop
function loop() {
    //updateAll();
    drawAll();
    window.requestAnimationFrame(loop);
}

//	Draws background and all actors on screen
function drawAll() {
    //Draw background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //console.log(grid);

    //Draw maze
    //ctx.fillStyle = 'rgb(105, 105, 105)';
    
    /*
    for (i = 0; i < canvas.width / TILE_S; i++) {
        for (j = 0; j < canvas.height / TILE_S; j++) {
            if(grid[i][j][0]) {
                ctx.fillRect(i * TILE_S, j * TILE_S, 1, TILE_S);
            }
            if(grid[i][j][1]) {
                ctx.fillRect(i * TILE_S, j * TILE_S, TILE_S, 1);
            }
            if(grid[i][j][2]) {
                ctx.fillRect(i * TILE_S + (TILE_S - 1), j * TILE_S, 1, TILE_S);
            }
            if(grid[i][j][3]) {
                ctx.fillRect(i * TILE_S, j * TILE_S + (TILE_S - 1), TILE_S, 1);
            }
        }
    }
    */

    //The beginning of REAL rendering
    var canvasi = 0,
        canvasj = 0;
    if (playerx < canvas.width/2) {
        if (playery < canvas.height/2) {                                                                            //Player is in Area 1
            drawMaze (0, canvas.width, 0, canvas.height);     //Renders the maze
        }
        else if (playery > maze_h - canvas.height/2) {                                                               //Player is in Area 2
            drawMaze (0, canvas.width, maze_h - canvas.height, maze_h);     //Renders the maze
            /*
            for (i = 0; i < canvas.width / TILE_S; i++) {
                for (j = Math.floor((maze_h - canvas.height) / TILE_S); j < (maze_h / TILE_S); j++) {
                    drawMazeTile (i, j, canvasi, canvasj);
                    canvasj++;
                }
                canvasj = 0;
                canvasi++;
            }
            canvasi = 0;
            */
        }
        else {                                                                                                        //Player is in Area 3
            drawMaze (0, canvas.width, (playery - canvas.height/2), (playery + canvas.height/2));
            /*
            for (i = 0; i < canvas.width / TILE_S; i++) {
                for (j = Math.floor((playery - canvas.height/2) / TILE_S); j < (playery + canvas.height/2) / TILE_S; j++) {
                    //console.log(i, j, playery, canvas.height, TILE_S);
                    drawMazeTile (i, j, canvasi, canvasj);
                    canvasj++;
                }
                canvasj = 0;
                canvasi++;
            }
            canvasi = 0;
            */
        }
    }
    else if (playerx > maze_w - canvas.width/2) {
        if (playery < canvas.height/2) {                                                                              //Player is in Area 4
            drawMaze (maze_w - canvas.width, maze_w, 0, canvas.height);
            /*
            for (i = Math.floor((maze_w - canvas.width) / TILE_S); i < (maze_w / TILE_S); i++) {
                for (j = 0; j < canvas.height / TILE_S; j++) {
                    //console.log(4);
                    drawMazeTile (i, j, canvasi, canvasj);
                    canvasj++;
                }
                canvasj = 0;
                canvasi++;
            }
            canvasi = 0;
            */
        }
        else if (playery > maze_h - canvas.height/2) {                                                                //Player is in Area 5
            drawMaze (maze_w - canvas.width, maze_w, maze_h - canvas.height, maze_h);
            /*
            for (i = Math.floor((maze_w - canvas.width) / TILE_S); i < (maze_w / TILE_S); i++) {
                for (j = Math.floor((maze_h - canvas.height) / TILE_S); j < (maze_h / TILE_S); j++) {
                    //console.log(5);
                    drawMazeTile (i, j, canvasi, canvasj);
                    canvasj++;
                }
                canvasj = 0;
                canvasi++;
            }
            canvasi = 0;
            */
        }
        else {                                                                                                        //Player is in Area 6
            drawMaze (maze_w - canvas.width, maze_w, playery - canvas.height/2, playery + canvas.height/2);
            /*
            for (i = Math.floor((maze_w - canvas.width) / TILE_S); i < (maze_w / TILE_S); i++) {
                for (j = Math.floor((playery - canvas.height/2) / TILE_S); j < (playery + canvas.height/2) / TILE_S; j++) {
                    //console.log(6);
                    drawMazeTile (i, j, canvasi, canvasj);
                    canvasj++;
                }
                canvasj = 0;
                canvasi++;
            }
            canvasi = 0;
            */
        }
    }
    else {
        if (playery < canvas.height/2) {                                                                              //Player is in Area 7
            //console.log(7);
            drawMaze (playerx - canvas.width/2, playerx + canvas.width/2, 0, canvas.height);
            /*
            for (i = Math.floor((playerx - canvas.width/2) / TILE_S); i < (playerx + canvas.width/2) / TILE_S; i++) {
                for (j = 0; j < canvas.height / TILE_S; j++) {
                    //console.log(i, j, grid[i][j]);
                    drawMazeTile (i, j, canvasi, canvasj);
                    canvasj++;
                }
                canvasj = 0;
                canvasi++;
            }
            canvasi = 0;
            */
        }
        else if (playery > maze_h - canvas.height/2) {                                                                //Player is in Area 8
            //console.log(8);
            drawMaze (playerx - canvas.width/2, playerx + canvas.width/2, maze_h - canvas.height, maze_h);
            /*
            for (i = Math.floor((playerx - canvas.width/2) / TILE_S); i < (playerx + canvas.width/2) / TILE_S; i++) {
                for (j = Math.floor((maze_h - canvas.height) / TILE_S); j < (maze_h / TILE_S); j++) {
                    drawMazeTile (i, j, canvasi, canvasj);
                    canvasj++;
                }
                canvasj = 0;
                canvasi++;
            }
            canvasi = 0;
            */
        }
        else {                                                                                                        //Player is in Area 9
            //console.log(9);
            drawMaze (playerx - canvas.width/2, playerx + canvas.width/2, playery - canvas.height/2, playery + canvas.height/2);
            /*
            for (i = Math.floor((playerx - canvas.width/2) / TILE_S); i < (playerx + canvas.width/2) / TILE_S; i++) {
                for (j = Math.floor((playery - canvas.height/2) / TILE_S); j < (playery + canvas.height/2) / TILE_S; j++) {
                    drawMazeTile (i, j, canvasi, canvasj);
                    canvasj++;
                }
                canvasj = 0;
                canvasi++;
            }
            canvasi = 0;
            */
        }
    }

    //	Call actors' draw methods
    /*
    for (let actor of actorList) {
        applyDraw(actor);
        actor.draw();
    }
    */   
}

//This method is a helper to make the REAL rendering less disgusting
function drawMaze (leftb, rightb, upb, downb, i, j) {
    var canvasi = 0,
        canvasj = 0;
    for (i = Math.floor(leftb / TILE_S); i < Math.floor(rightb / TILE_S); i++) {               //These two for loops help draw the maze
        for (j = Math.floor(upb / TILE_S); j < Math.floor(downb / TILE_S); j++) {
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
    switch(playerGrid[i][j]) {
        case 0:
            ctx.fillStyle = "white";
            break;
        case 1:
            ctx.fillStyle = 'rgb(255, 0, 129)';
            break;
        case 2:
            ctx.fillStyle = "green";
            break;
        case 3:
            ctx.fillStyle = "red";
            break;
        case 4:
            ctx.fillStyle = "yellow";
            break;
    }
    ctx.fillRect(canvasi * TILE_S + 1, canvasj * TILE_S + 1, TILE_S - 2, TILE_S - 2);
}

//	Applies the draw function to the actor
function applyDraw(actor) {
    actor.draw = function () {
        //console.log(actor.color);
        switch(actor.color) {
            case 0:
                ctx.fillStyle = "white";
                break;
            case 1:
                ctx.fillStyle = 'rgb(255, 0, 129)';
                break;
            case 2:
                ctx.fillStyle = "green";
                break;
            case 3:
                ctx.fillStyle = "red";
                break;
            case 4:
                ctx.fillStyle = "yellow";
                break;
        }
        ctx.fillRect(actor.x + 1, actor.y + 1, actor.width - 2, actor.height - 2);
    };
}

//  Starting point for program
function main() {
    init();
    loop();
}

main();
