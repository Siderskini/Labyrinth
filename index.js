//Imports (?)
var express = require('express');       //Sets up a callable express variable
var socket = require('socket.io');      //Sets up a callable socket variable

//App setup
var app = express();                                    //Sets up an app object by calling express
var server = app.listen(4000, function(){               //Sets up a server connection on locahost:4000
    console.log('listening to requests on port 4000');  //When server connection is made, logs this message to console
});

//Static Files
app.use(express.static('public'));      //Uses files in folder public as static files through express (?)

//Grid variables
var TILE_S = 48,
    COLS = 48,
    ROWS = 48;

//The grid itself
var grid = new Array(COLS);
for (i = 0; i < COLS; i++) {
    grid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
        grid[i][j] = [true, true, true, true];
    }
}

//Functions
function mapToArray(map) {
	var array = [];
	for (let [key, value] of map) {
  		array.push(value);
	}
	return array;
}

function updateTile(player) {
    if (isDeadEnd(player)) {
        var playerx = player[0]/TILE_S;
        var playery = player[1]/TILE_S;
        if ((playerx > 0) && (playery > 0) && (playerx < (ROWS - 1)) && (playery < (COLS - 1))) {
            var entrance = grid[playerx][playery].indexOf(false);
            closeWall(playerx, playery, entrance);
            var opening = Math.floor((Math.random() * 4));
            openWall(playerx, playery, opening);
        }
    }
}

function closeWall(playerx, playery, wall){
    grid[playerx][playery][wall] = true;
    switch (wall) {
        case 0:
            grid[playerx - 1][playery][2] = true;
            break;
        case 1:
            grid[playerx][playery - 1][3] = true;
            break;
        case 2:
            grid[playerx + 1][playery][0] = true;
            break;
        case 3:
            grid[playerx][playery + 1][1] = true;
            break;
    }
}

function openWall(playerx, playery, wall){
    grid[playerx][playery][wall] = false;
    switch (wall) {
        case 0:
            grid[playerx - 1][playery][2] = false;
            break;
        case 1:
            grid[playerx][playery - 1][3] = false;
            break;
        case 2:
            grid[playerx + 1][playery][0] = false;
            break;
        case 3:
            grid[playerx][playery + 1][1] = false;
            break;
    }
}

function getTile(player) {
    var playerx = player[0]/TILE_S;
    var playery = player[1]/TILE_S;
    return grid[playerx][playery];
}

function isDeadEnd(player) {
    var playerx = player[0]/TILE_S;
    var playery = player[1]/TILE_S;
    return grid[playerx][playery].reduce(add, 0) == 3;
}

function add(a, b) {
    return a + b;
}

function createMaze(grid, playerx, playery) {
    var queue = [];                             //Initializes an array to use as the fringe queue
    var visited = [];                           //Initializes an array to track the tiles that have been visited
    var temp = [playerx, playery];              //Creates a temprary variable to track the current tile with initial player coords
    var tempNeighbor = [0, 0];
    var neighbors = [];
    queue.push(temp);                           //Pushes the initial tile into the fringe queue
    while (!(queue.length == 0)) {              //Runs a loop while the fringe is not empty
        temp = queue.shift();
        visited.push(temp);
        neighbors = unvisitedNeighbors(temp[0], temp[1], visited);
        if (neighbors.length > 0) {
            tempNeighbor = neighbors[Math.floor((Math.random() * neighbors.length))];
            openWall(temp[0], temp[1], tempNeighbor[2])
            visited.push([tempNeighbor[0], tempNeighbor[1]]);
            queue.unshift([tempNeighbor[0], tempNeighbor[1]]);
            queue.unshift(temp);
        }
    }
}

function arrayContains(array, element) {
    for (let value of array) {
        if ((value[0] == element[0]) && (value[1] == element[1])) {
            return true;
        }
    }
    return false;
}

function unvisitedNeighbors(playerx, playery, visited) {
    var neighbors = [];                                                                 //Initializes an empty list to store neighbors
    if((playerx > 0) && !arrayContains(visited, [playerx - 1, playery])) {              //If the neigbor exists and hasn't been visited
        neighbors.push([playerx - 1, playery, 0]);                                      //Push the coords and the wall number
    }
    if((playery > 0) && !arrayContains(visited, [playerx, playery - 1])) {              //Rinse and repeat
        neighbors.push([playerx, playery - 1, 1]);
    }
    if((playerx < (COLS - 1)) && !arrayContains(visited, [playerx + 1, playery])) {
        neighbors.push([playerx + 1, playery, 2]);
    }
    if((playery < (ROWS - 1)) && !arrayContains(visited, [playerx, playery + 1])) {
        neighbors.push([playerx, playery + 1, 3]);
    }
    return neighbors;                                                                   //Return the list of unvisited neighbors
}

createMaze(grid, ROWS/2, COLS/2);

//////////////////////////////////////////////
//##########################################//
//#Everything between here and socket setup#//
//#will be related to stuff that makes the #//
//#game aspect of the game lol.            #//
//##########################################//
//////////////////////////////////////////////

/* The beginning of items
	Item grid holds items, aka collectibles for benefits
	Items can be food, keys, or anything else that is collected by running around the grid
 */
//Food grid is a grid used for storing food
var foodGrid = new Array(COLS);
for (i = 0; i < COLS; i++) {
    foodGrid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
        foodGrid[i][j] = true;
    }
}

//This function has rules for what happens when food is eaten
function eatFood(x, y, id) {
	if (foodGrid[x][y]) {
		foodGrid[x][y] = false;
		map.set(id, [map.get(id)[0], map.get(id)[1], map.get(id)[2], map.get(id)[3] + 1]); //Increase score by 1 for eating a food
		setTimeout(function(){
			foodGrid[x][y] = true;
		},5000);
	}
}
/* The end of items */


/* The beginning of maze modification 
	Maze modifiers are items that modify the maze
	These can be traps, tools to help other players, etc.	
*/
var itemGrid = new Array(COLS);
for (i = 0; i < COLS; i++) {
    itemGrid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
        itemGrid[i][j] = [];
    }
}

/*
function placeItem(x, y, id) {
	itemGrid[i][j].push();
}
*/

/* The end of maze modification */


/* The beginning of enemies
	I want one main enemy to be the minotaur, which represents a kind of "final boss"
	Current enemy types:
		- mob:
		  Mobs are the regular piece of shit monsters that love to give everyone trouble without regard for their own life.
		  They are usually weak and stupid and use randomwalk to go places.
		- smartys:
		  Smartys are the more intelligent mobs that strategize to end players' lives.
		  They might use heuristics and algorithms to find players.
		- bosses:
		  Bosses, such as the feared minotaur are smartys but they also must have unique powers that make them hard to defeat.
		  Since this is meant to be a collaborative game, bosses must be IMPOSSIBLE for players to kill, or maybe just impossible to kill. 
		  To lure some of the better players in, it's important for the boss to maintain the illusion of being killable by one person/ a 
		  few people.
		  I really want the death of the boss to be a cooperative effort, and not just a small-scale cooperative effort, but one
		  that occurs on a large scale. 
		  I want the boss to only be defeatable through capture or other means, to discourage the idea of necessary killing.
*/
var enemies = [];

//Add some enemies to our list
//Add mobs
for (i = 4; i < ROWS - 4; i++) {
	enemies.push(['mob', i, i]);
}
//Add smartys
for (i = 8; i < COLS; i += 8) {
	for (j = 8; j < ROWS; j += 8) {
		enemies.push('smarty', i, j);
	}
}
//Add bosses
enemies.push(['boss', COLS / 2, ROWS / 2]);


/* The end of enemies */


//Socket setup
var io = socket(server);                //Sets up an io variable by calling socket on the server (?)

var map = new Map();

io.on('connection', function(socket){               //When a connection is made, calls the function which...
    console.log('socket connected!', socket.id)     //Logs this message to console, along with the socket id of the connection
    map.set(socket.id, [TILE_S, TILE_S, (map.size % 4) + 1, 0]);
    eatFood(map.get(socket.id)[0] / TILE_S, map.get(socket.id)[1] / TILE_S, socket.id);
    //console.log(map);
    io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3]});
    io.emit('begin', {locations: mapToArray(map), grid: grid, food: foodGrid});

    socket.on('W', function(){                      //When socket gets a W event from a client...
        if (!getTile(map.get(socket.id))[1]) {
            if (map.get(socket.id)[1] > 0) {
                map.set(socket.id, [map.get(socket.id)[0], map.get(socket.id)[1] - TILE_S, map.get(socket.id)[2], map.get(socket.id)[3]]);
                updateTile(map.get(socket.id));
                eatFood(map.get(socket.id)[0] / TILE_S, map.get(socket.id)[1] / TILE_S, socket.id);
            }
        }
        io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3]});
        io.emit('gameState', {locations: mapToArray(map), grid: grid, food: foodGrid});                //It emits a chat event to every client with the data
    });

    socket.on('A', function(){                      //When socket gets a W event from a client...
        if (!getTile(map.get(socket.id))[0]) {
            if (map.get(socket.id)[0] > 0) {
                map.set(socket.id, [map.get(socket.id)[0] - TILE_S, map.get(socket.id)[1], map.get(socket.id)[2], map.get(socket.id)[3]]);
                updateTile(map.get(socket.id));
                eatFood(map.get(socket.id)[0] / TILE_S, map.get(socket.id)[1] / TILE_S, socket.id);
            }
        }
        io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3]});
        io.emit('gameState', {locations: mapToArray(map), grid: grid, food: foodGrid});          //It emits a chat event to every client with the data
    });

    socket.on('S', function(){                      //When socket gets a W event from a client...
        if (!getTile(map.get(socket.id))[3]) {
            if (map.get(socket.id)[1] < TILE_S * (ROWS - 1)) {
                map.set(socket.id, [map.get(socket.id)[0], map.get(socket.id)[1] + TILE_S, map.get(socket.id)[2], map.get(socket.id)[3]]);
                updateTile(map.get(socket.id));
                eatFood(map.get(socket.id)[0] / TILE_S, map.get(socket.id)[1] / TILE_S, socket.id);
            }
        }
        io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3]});
        io.emit('gameState', {locations: mapToArray(map), grid: grid, food: foodGrid});          //It emits a chat event to every client with the data
    });

    socket.on('D', function(){                      //When socket gets a W event from a client...
        if (!getTile(map.get(socket.id))[2]) {
            if (map.get(socket.id)[0] < TILE_S * (COLS - 1)) {
                map.set(socket.id, [map.get(socket.id)[0] + TILE_S, map.get(socket.id)[1], map.get(socket.id)[2], map.get(socket.id)[3]]);
                updateTile(map.get(socket.id));
                eatFood(map.get(socket.id)[0] / TILE_S, map.get(socket.id)[1] / TILE_S, socket.id);
            }
        }
        io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3]});
        io.emit('gameState', {locations: mapToArray(map), grid: grid, food: foodGrid})           //It emits a chat event to every client with the data
    });

    socket.on('disconnect', function(){
        map.delete(socket.id);
    });
});