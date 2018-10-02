// Make connection
var socket = io.connect('http://localhost:4000');	//Uses the io interface to connect as a socket to localhost:4000

//Query DOM -- This is where all of the functionality of client side of the app happens
	//message = document.getElementById('message'),
	//handle = document.getElementById('handle'),
	//btn = document.getElementById('send'),
	//output = document.getElementById('output'),
	//feedback = document.getElementById('feedback');

//	Objects
var canvas,
    ctx,
    color,
    grid;

var actorList = [];
    //obstacle,
    //follow,
    //wimp;

//	Grid variables
var TILE_S = 32,
    COLS = 32,
    ROWS = 32;

//	"World" variables
var GRAVITY = 0;

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
    actorList = [];
	for (let value of data.locations) {
  		//console.log(value);
        actorList.push(new Square(value[0], value[1], TILE_S, TILE_S, value[2]));
	}
});

socket.on('begin', function(data) {
    grid = data.grid;
    //console.log(grid);
    for (let value of data.locations) {
        //console.log(value);
        actorList.push(new Square(value[0], value[1], TILE_S, TILE_S, value[2]));
    }
	main();
});

//  Initialize the canvas and context
canvas = document.createElement("canvas");
ctx = canvas.getContext("2d");
canvas.width = TILE_S * COLS;
canvas.height = TILE_S * ROWS;
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
    ctx.fillStyle = 'rgb(105, 105, 105)';
    for (i = 0; i < COLS; i++) { 
        for (j = 0; j < ROWS; j++) {
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

    //	Call actors' draw methods
    //	SHOULD BE KEPT INSIDE A DATA STRUCTURE AND LOOPED
    //ctx.fillStyle = "white";
    for (let actor of actorList) {
        applyDraw(actor);
        actor.draw();
    }
    //hero.draw();
    //obstacle.draw();
    //follow.draw();
    //wimp.draw();
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
