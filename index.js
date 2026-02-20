///////////////////////////
//#######################//
//# Socket.io App Setup #//
//#######################//
///////////////////////////

//Imports (?)
const https = require('https');
const http = require('http');
var fs = require('fs');
var express = require('express');       //Sets up a callable express variable
var socket = require('socket.io');      //Sets up a callable socket variable

//App setup
var app = express();                                    //Sets up an app object by calling express

//Static Files
app.use(express.static('public'));      //Uses files in folder public as static files through express (?)

// Load optional config for hosting
const config = fs.existsSync('./config.json') ? JSON.parse(fs.readFileSync('./config.json', 'utf8')) : {host: 'localhost', port: 4000};

// Load optional keys for hosting via https
const options = fs.existsSync('./key.pem') ?{
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
} : null;

// Create a web server. If options is null, creates an http server, otherwise creates an https server with the given options.
const server = options == null ? http.createServer(app) : https.createServer(options, app);

server.listen(config.port, function(){               //Sets up a server connection on the configured port
	console.log('listening to requests on port ' + config.port);  //When server connection is made, logs this message to console
});


//Grid variables
const COLS = 48, //Number of columns in maze
	ROWS = 48; //Number of rows in maze

//An array storing the values zero to three
const zeroToThree = [0, 1, 2, 3]; //Used for opening and closing the walls

//Initializes maze grid with all walls
function createGrid() {
	var grid = new Array(COLS);
	for (i = 0; i < COLS; i++) {
		grid[i] = new Array(ROWS);
		for (j = 0; j < ROWS; j++) {
			grid[i][j] = [true, true, true, true]; //For each grid space, initialize all the walls to exist
		}
	}
	return grid;
}

/* Adapted from https://www.geeksforgeeks.org/implementation-priority-queue-javascript/ */
// User defined class 
// to store element and its priority 
class QElement {
	constructor(element, priority = 0, directions = []) 
	{ 
		this.element = element; 
		this.priority = priority;
		this.directions = directions;
	} 
}

// PriorityQueue class 
class PriorityQueue {
  
	// An array is used to implement priority 
	constructor() { 
		this.items = []; 
	} 
  
	// functions to be implemented
	// push(item, priority)
	// enqueue function to add element
	// to the queue as per priority
	push(element, priority = 0, directions = []) { 
		// creating object from queue element 
		var qElement = new QElement(element, priority, directions); 
		var contain = false;
  
		// iterating through the entire 
		// item array to add element at the 
		// correct location of the Queue 
		for (var i = 0; i < this.items.length; i++) { 
			if (this.items[i].priority > qElement.priority) { 
				// Once the correct location is found it is 
				// enqueued 
				this.items.splice(i, 0, qElement); 
				contain = true; 
				break; 
			} 
		} 
  
		// if the element have the highest priority 
		// it is added at the end of the queue 
		if (!contain) { 
			this.items.push(qElement); 
		} 
	}

	/* If item already in priority queue with higher priority, update its priority and rebuild the heap.
	   If item already in priority queue with equal or lower priority, do nothing.
	   If item not in priority queue, do the same thing as self.push. */
	update(element, priority, directions) {
		var x = this.items.indexOf(element);
		if (x == -1) {
			this.push(element, priority, directions);
		} else {
			if (priority > this.items[x].priority) {
				this.items.splice(x, 1);
				this.push(element, priority, directions);
			}
		}
	}

	// dequeue method to remove 
	// element from the queue 
	dequeue() { 
		// return the dequeued element 
		// and remove it. 
		// if the queue is empty 
		// returns Underflow 
		if (this.isEmpty()) 
			return "Underflow"; 
		return this.items.shift(); 
	}

	// front function 
	front() { 
		// returns the highest priority element 
		// in the Priority queue without removing it. 
		if (this.isEmpty()) 
			return "No elements in Queue"; 
		return this.items[0]; 
	}

	// rear function 
	rear() { 
		// returns the lowest priorty 
		// element of the queue 
		if (this.isEmpty()) 
			return "No elements in Queue"; 
		return this.items[this.items.length - 1]; 
	}

	// isEmpty function 
	isEmpty() { 
		// return true if the queue is empty. 
		return this.items.length == 0; 
	} 

	// printQueue function 
	// prints all the element of the queue 
	printPQueue() { 
		var str = ""; 
		for (var i = 0; i < this.items.length; i++) 
			str += this.items[i].element + " "; 
		return str;
	} 
} 


///////////////////////////
//#######################//
//# Utility Functions ###//
//#######################//
///////////////////////////

// Collects the entries from a map into an array (map is ordered)
// Used to send grid state to client
function mapToArray(map) {
	var array = [];
	for (let value of map.values()) {
		array.push(value);
	}
	return array;
}

// If the player is at a dead end of the maze, the tile's walls change to create a new opening
function updateTile(player, grid) {
	if (isDeadEnd(player[0], player[1], grid)) {
		var playerx = player[0];
		var playery = player[1];
		if ((playerx > 0) && (playery > 0) && (playerx < (ROWS - 1)) && (playery < (COLS - 1))) { //If it's not a border tile
			var entrance = grid[playerx][playery].indexOf(false); //Find out which wall is currently open
			grid = closeWall(playerx, playery, entrance, grid); //Close it
			var remaining = zeroToThree.filter(e => e !== entrance); //Filter out the currently open wall
			var opening = remaining[Math.floor((Math.random() * 3))]; //Randomly select a new wall to open
			grid = openWall(playerx, playery, opening, grid); //Open it
		}
	}
	return grid;
}

//When a wall is closed or opened, we really open two walls: The one for that tile and the corresponding one for the tile sharing that wall
function closeWall(x, y, wall, grid) {
	switch (wall) {
		case 0:
			if (x > 0) {
				grid[x][y][wall] = true;
				grid[x - 1][y][2] = true;
			}
			break;
		case 1:
			if (y > 0) {
				grid[x][y][wall] = true;
				grid[x][y - 1][3] = true;
			}
			break;
		case 2:
			if (x < COLS - 1) {
				grid[x][y][wall] = true;
				grid[x + 1][y][0] = true;
			}
			break;
		case 3:
			if (y < ROWS - 1) {
				grid[x][y][wall] = true;
				grid[x][y + 1][1] = true;
			}
			break;
	}
	return grid;
}

//When a wall is closed or opened, we really open two walls: The one for that tile and the corresponding one for the tile sharing that wall
function openWall(x, y, wall, grid){
	switch (wall) {
		case 0:
			if (x) {
				grid[x][y][wall] = false;
				grid[x - 1][y][2] = false;
			}
			break;
		case 1:
			if (y) {
				grid[x][y][wall] = false;
				grid[x][y - 1][3] = false;
			}
			break;
		case 2:
			if (x < COLS - 1) {
				grid[x][y][wall] = false;
				grid[x + 1][y][0] = false;
			}
			break;
		case 3:
			if (y < ROWS - 1) {
				grid[x][y][wall] = false;
				grid[x][y + 1][1] = false;
			}
			break;
	}
	return grid;
}

// Returns the grid tile that a player is on
function getTile(player, grid) {
	var x = player[0];
	var y = player[1];
	return grid[x][y];
}

//Checks if a tile represents a dead end in the maze (has 3 walls)
function isDeadEnd(x, y, grid) {
	return grid[x][y].reduce((x, y) => x + y, 0) == 3;
}

// Takes a maze with all the walls filled and opens walls to create a maze
function createMaze(playerx, playery, grid) {
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
			grid = openWall(temp[0], temp[1], tempNeighbor[2], grid)
			visited.push([tempNeighbor[0], tempNeighbor[1]]);
			queue.unshift([tempNeighbor[0], tempNeighbor[1]]);
			queue.unshift(temp);
		}
	}
	return grid;
}

//Takes a saved maze grid and loads it
function loadTestGrid(file) {
	var data = fs.readFileSync(file + '.json');
	var players = new Set();
	players.add(socket.id);
	lobbiesToPlayers.set(0, players);
	var grid = JSON.parse(data).grid;
	createLobby();
	var labyrinth = lobbiesToLabyrinths.get(0);
	labyrinth[0] = grid;
	lobbiesToLabyrinths.set(0, labyrinth);
}

//Saves a made maze to a file for testing
function saveMazeGrid() {
	console.log(JSON.stringify({grid: lobbiesToLabyrinths.get(0)[0]}));
}

//Check if an array of tuples contains a specific tuple
function arrayContains(array, element) {
	for (let value of array) {
		if ((value[0] == element[0]) && (value[1] == element[1])) {
			return true;
		}
	}
	return false;
}

// Returns a list of unvisited tiles neighboring a tile for maze generation function above
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

// Checks if there is a grid tile at a location
function tileExists(x, y, grid) {
	return grid[x] && grid[x][y];
}

/////////////////////
//#################//
//# Game elements #//
//#################//
/////////////////////

/* Food 
	Food is eaten to increase a player's score. 
	It is available on all grid spaces except dead ends, spaces with items on them, and spaces where it has recently been consumed.
	Eating one food will increase the player's score by 1. 
*/
const foodTimeout = 30000; //Food will respawn after 30s

//Food grid is a grid used for storing food
function createFoodGrid(grid) {
	var foodGrid = new Array(COLS);
	for (i = 0; i < COLS; i++) {
		foodGrid[i] = new Array(ROWS);
		for (j = 0; j < ROWS; j++) {
			if (!isDeadEnd(i, j, grid)) { //If the space is not a dead end, make food
				foodGrid[i][j] = true;
			}
		}
	}
	return foodGrid;
}

//This function has rules for what happens when food is eaten
function eatFood(x, y, id, lobbyId) {
	var labyrinth = lobbiesToLabyrinths.get(lobbyId);
	if (labyrinth[1][x][y]) {
		labyrinth[1][x][y] = false; //Remove the food
		map.get(id)[3]++; // Increment the player's score
		lobbiesToLabyrinths.set(lobbyId, labyrinth);
		setTimeout(function(){ // After a set time, put back the food
			labyrinth = lobbiesToLabyrinths.get(lobbyId);
			labyrinth[1][x][y] = true;
			lobbiesToLabyrinths.set(lobbyId, labyrinth);
		},foodTimeout);
	}
}
/* The end of food */

/* Safe zones 
	Safe zones are places where enemies cannot enter, with no walls, food, or items. 
	Players will spawn in safe zones. 
*/
function createSafeGrid() {
	var safeGrid = [];
	for (i = 0; i < COLS; i++) {
		safeGrid[i] = new Array(ROWS);
		for (j = 0; j < ROWS; j++) {
			safeGrid[i][j] = false;
		}
	}
	return safeGrid;
}

// Create a safe zone of specified length and width at specific coordinates
function createSafeZone(coords, length, width, grid, foodGrid, safeGrid) {
	for (i = coords[0]; i < coords[0] + width; i++) {
		grid = openWall(i, coords[1], 0, grid);
		grid = openWall(i, coords[1], 3, grid);
		grid = openWall(i, coords[1], 2, grid);
		foodGrid[i][coords[1]] = false;
		grid = openWall(i, coords[1] + length, 0, grid);
		grid = openWall(i, coords[1] + length, 1, grid);
		grid = openWall(i, coords[1] + length, 2, grid);
		foodGrid[i][coords[1] + length] = false;
	}
	for (j = coords[1]; j < coords[1] + length; j++) {
		grid = openWall(coords[0], j, 1, grid);
		grid = openWall(coords[0], j, 2, grid);
		grid = openWall(coords[0], j, 3, grid);
		foodGrid[coords[0]][j] = false;
		grid = openWall(coords[0] + width, j, 0, grid);
		grid = openWall(coords[0] + width, j, 1, grid);
		grid = openWall(coords[0] + width, j, 3, grid);
		foodGrid[coords[0] + width][j] = false;
	}

	for (i = coords[0] + 1; i < coords[0] + width; i++) {
		for (j = coords[1] + 1; j < coords[1] + length; j++) {
			safeGrid[i][j] = true;
			grid[i][j] = [false, false, false, false];
			foodGrid[i][j] = false;
		}
	}
	return [grid, foodGrid, safeGrid];
}
/* The end of safe zones */

/* Items 
	There are two kinds of items that a player can collect in the maze: 
		Bombs
			Bombs explode after a set time with a radius of one tile, eliminating all players and enemies in that space
		Keys
			Keys open all the walls for the tile that a player is on
*/
const keytimeOut = 3000, 
	bombTimeout = 3000, 
	bombEffectTimeout = 100,
	bombRadius = 1,
	itemRespawnTimeout = 30000;

function createItemGrid() {
	var itemGrid = new Array(COLS);
	for (i = 0; i < COLS; i++) {
		itemGrid[i] = new Array(ROWS);
		for (j = 0; j < ROWS; j++) {
			itemGrid[i][j] = null;
		}
	}
	return itemGrid;
}

// Place an item on a tile with specific coordinates
function placeItem(x, y, item, itemGrid, foodGrid) {
	itemGrid[x][y] = item;
	foodGrid[x][y] = false;
	return [itemGrid, foodGrid];
}

function hasItem(x, y, itemGrid) {
	return itemGrid[x][y] == null;
}

//Consume an item and use its effect
function useItem(id, item) {
	switch(item) {
		case "bomb":
			if (map.get(id)[5][1]) {
				map.get(id)[5][1]--;
				setBomb(map.get(id)[0], map.get(id)[1], map.get(id)[6]);
			}
			break;
		case "key":
			if (map.get(id)[5][2]) {
				map.get(id)[5][2]--;
				useKey(map.get(id)[0], map.get(id)[1], map.get(id)[6]);
			}
			break;
		default:
			console.log("Attempted to use illegitimate item.");
			break;
	}
}

//Use a key to open all of the walls for a tile, then close it after 3s
function useKey(x, y, lobbyId) {
	var labyrinth = lobbiesToLabyrinths.get(lobbyId);
	var temp = getTile([x, y], labyrinth[0]).slice();
	labyrinth[0] = openWall(x, y, 0, labyrinth[0]);
	labyrinth[0] = openWall(x, y, 1, labyrinth[0]);
	labyrinth[0] = openWall(x, y, 2, labyrinth[0]);
	labyrinth[0] = openWall(x, y, 3, labyrinth[0]);
	lobbiesToLabyrinths.set(lobbyId, labyrinth);
	setTimeout(function(){
		labyrinth = lobbiesToLabyrinths.get(lobbyId);
		for (i = 0; i < 4; i++) {
			if (temp[i]) {
				labyrinth[0] = closeWall(x, y, i, labyrinth[0]);
			}
		}
		lobbiesToLabyrinths.set(lobbyId, labyrinth);
	},keytimeOut);
}

//Sets a bomb on a tile and detonates it after the timeout
function setBomb(x, y, lobbyId) {
	var labyrinth = lobbiesToLabyrinths.get(lobbyId);
	if (labyrinth[3][x][y] != "comb") {
		var newGrids = placeItem(x, y, "comb", labyrinth[3], labyrinth[1]);
		labyrinth[3] = newGrids[0];
		labyrinth[1] = newGrids[1];
		lobbiesToLabyrinths.set(lobbyId, labyrinth);
		setTimeout(function(){
			labyrinth = lobbiesToLabyrinths.get(lobbyId);
			labyrinth[3][x][y] = null;
			detonateBomb(x, y, bombRadius, lobbyId);
			lobbiesToLabyrinths.set(lobbyId, labyrinth);
		},bombTimeout);
	}
}

//Places explosion effects on neighboring tiles, eleminates enemies and players, and removes explosion effect after 100ms
function detonateBomb(x, y, radius, lobbyId) {
	var labyrinth = lobbiesToLabyrinths.get(lobbyId);
	var safeGrid = labyrinth[2];
	var itemGrid = labyrinth[3];
	var enemies = labyrinth[4];
	var enemy;
	var newGrids = [labyrinth[3], labyrinth[1]];
	for (i = x - radius; i < x + radius + 1; i++) {
		for (j = y - radius; j < y + radius + 1; j++) {
			if (labyrinth[0][i] && labyrinth[0][i][j] && !safeGrid[i][j]) {
				if (hasItem(x, y, itemGrid)) {
					overItem(x, y, null, itemGrid, lobbyId);
				}
				newGrids = placeItem(i, j, "boom", newGrids[0], newGrids[1]); //Places explosion as an item on the grid
				for (let [id, player] of map) {
					if ((map.get(id)[0] == i) && (map.get(id)[1] == j)) {
						die(id);
					}
				}
				for (k = 0; k < enemies.length; k++) {
					enemy = enemies[k];
					if ((enemy[1] == i) && (enemy[2] == j)) {
						kill(k, lobbyId);
					}
				}
			}
		}	
	}
	labyrinth[3] = newGrids[0];
	labyrinth[1] = newGrids[1];
	lobbiesToLabyrinths.set(lobbyId, labyrinth);
	setTimeout(function() {
		afterBomb(x, y, radius, lobbyId);
	},bombEffectTimeout);
}

//Remove the explosion effect from affected tiles
function afterBomb(x, y, radius, lobbyId) {
	var labyrinth = lobbiesToLabyrinths.get(lobbyId);
	var newGrids = [labyrinth[3], labyrinth[1]];
	for (i = x - radius; i < x + radius + 1; i++) {
		for (j = y - radius; j < y + radius + 1; j++) {
			if (labyrinth[0][i] && labyrinth[0][i][j]) {
				newGrids = placeItem(i, j, null, newGrids[0], newGrids[1]);
			}
		}
	}
	labyrinth[3] = newGrids[0];
	labyrinth[1] = newGrids[1];
	lobbiesToLabyrinths.set(lobbyId, labyrinth);
}

//If the player is on top of an item, add it to their inventory, remove it from the maze, and bring it back after a specified time
function overItem(x, y, id, itemGrid, lobbyId) {
	var labyrinth = lobbiesToLabyrinths.get(lobbyId);
	var currentItem = itemGrid[x][y];
	if (currentItem) {
		switch(currentItem) {
			case "bomb":
				itemGrid[x][y] = null;
				if (id != null) {
					map.get(id)[3] += 5;
					map.get(id)[5][1]++;
				}
				break;
			case "key":
				itemGrid[x][y] = null;
				if (id != null) {
					map.get(id)[3] += 3;
					map.get(id)[5][2]++;
				}
		}
		lobbiesToLabyrinths.set(lobbyId, labyrinth);
		if (itemGrid[x][y] != "boom" && itemGrid[x][y] != "comb") {
			setTimeout(function(){
				labyrinth = lobbiesToLabyrinths.get(lobbyId);
				itemGrid[x][y] = currentItem;
				lobbiesToLabyrinths.set(lobbyId, labyrinth);
			},itemRespawnTimeout);
		}
	}
}
/* The end of items */


/* The beginning of enemies
	I want one main enemy to be the minotaur, which represents a kind of "final boss"
	Current enemy types:
		- mob:
		  Mobs are the regular monsters that love to give everyone trouble without regard for their own lives.
		  They are usually weak and stupid and use randomwalk to go places.
		- smartys:
		  Smartys are the more intelligent mobs that strategize to end players' lives.
		  They might use heuristics and algorithms to find players.
		- bosses:
		  Bosses, such as the feared minotaur are smartys but they also have unique powers that make them hard to defeat.
		  Since this is meant to be a collaborative game, bosses must be IMPOSSIBLE for single players to kill, or maybe just impossible to kill. 
		  To lure some of the better players in, it's important for the boss to maintain the illusion of being killable by one person/ a 
		  few people.
		  I really want the death of the boss to be a cooperative effort, and not just a small-scale cooperative effort, but one
		  that occurs on a large scale. 
		  I want the boss to only be defeatable through capture or other means, to discourage the idea of necessary killing.
*/
const mobTimeout = 30000,
	smartyTimeout = 30000,
	minotaurTimeout = 30000,
	wallTimeout = 1000,
	moveEnemyTimeout = 1000;

function moveEnemies(labyrinth) {
	var grid = labyrinth[0];
	var safeGrid = labyrinth[2];
	var enemies = labyrinth[4];
	for (let enemy of enemies) {
		switch (enemy[0]) {
			case 'mob':
				var moves = realMoves(enemy[1] , enemy[2], grid, safeGrid);
				if (moves.length) {
					var move = moves[Math.floor((Math.random() * moves.length))];		//Mobs randomwalk
					enemy[1] += move[0];
					enemy[2] += move[1];
				}
				break;
			case 'smarty':
				var moves = realMoves(enemy[1] , enemy[2], grid, safeGrid);
				//moves.push([0,0]);
				var move = getSmartMove(enemy, moves, grid, safeGrid);
				if (move == null) {
					move = [0, 0];
				}
				enemy[1] += move[0];
				enemy[2] += move[1];
				break;
			case 'minotaur':
				var move = getMinotaurMove(enemy, grid, safeGrid);
				var temp = enemy.slice();
				var tile = getTile([enemy[1], enemy[2]], grid);
				if (move[0] == 1) {
					if (tile[2], grid) {
						openWall(temp[1], temp[2], 2, grid);
						setTimeout(function(){
							closeWall(temp[1], temp[2], 2, grid);
						},wallTimeout);
					}
				} else if (move[1] ==1 ) {
					if (tile[3], grid) {
						openWall(temp[1], temp[2], 3, grid);
						setTimeout(function(){
							closeWall(temp[1], temp[2], 3, grid);
						},wallTimeout);
					}
				} else if (move[0] == -1) {
					if (tile[0], grid) {
						openWall(temp[1], temp[2], 0, grid);
						setTimeout(function(){
							closeWall(temp[1], temp[2], 0, grid);
						},wallTimeout);
					}
				} else if (move[1] == -1) {
					if (tile[1], grid) {
						openWall(temp[1], temp[2], 1, grid);
						setTimeout(function(){
							closeWall(temp[1], temp[2], 1, grid);
						},wallTimeout);
					}
				}
				enemy[1] += move[0];
				enemy[2] += move[1];
				break;
		}
	}
}

//Moves the enemies on a timer
function startMovingEnemies(lobbyId) {
	setInterval(function(){
		moveEnemies(lobbiesToLabyrinths.get(lobbyId));
	},moveEnemyTimeout);
}

//Gets possible moves for an enemy
function realMoves(x, y, grid, safeGrid) {
	var tile = getTile([x, y], grid);
	moves = [];
	if (tileExists(x - 1, y, grid) && !tile[0] && !safeGrid[x - 1][y]) {
		moves.push([-1, 0]);
	}
	if (tileExists(x, y - 1, grid) && !tile[1] && !safeGrid[x][y - 1]) {
		moves.push([0, -1]);
	}
	if (tileExists(x + 1, y, grid) && !tile[2] && !safeGrid[x + 1][y]) {
		moves.push([1, 0]);
	}
	if (tileExists(x, y + 1, grid) && !tile[3] && !safeGrid[x][y + 1]) {
		moves.push([0, 1]);
	}
	return moves;
}

//Returns neighboring tiles and the move taken to get there
function getNeighbors(x, y, grid, safeGrid) {
	neighbors = [];
	var tile = grid[x][y];
	if (!tile[0] && !safeGrid[x - 1][y]) {
		neighbors.push([[x - 1, y],[-1, 0]]);
	}
	if (!tile[1] && !safeGrid[x][y - 1]) {
		neighbors.push([[x, y - 1], [0, -1]]);
	}
	if (!tile[2] && !safeGrid[x + 1][y]) {
		neighbors.push([[x + 1, y], [1, 0]]);
	}
	if (!tile[3] && !safeGrid[x][y + 1]) {
		neighbors.push([[x, y + 1], [0, 1]]);
	}
	return neighbors;
}

//Gets a smart move for smartys
function getSmartMove(enemy, moves, grid, safeGrid) {
	closest = [ROWS * 2, COLS * 2];
	dist = distanceToPlayer(enemy, closest);
	for (let [id, player] of map) {
		if (distanceToPlayer(enemy, [player[0], player[1]]) < dist) {
			dist = distanceToPlayer(enemy, [player[0], player[1]]);
			closest = [player[0], player[1]];
		}
	}
	if (map.size) {
		depth = 4
		//If there are no players in range then randomwalk
		if (dist > depth) {
			return moves[Math.floor((Math.random() * moves.length))];
		}
		var directions = aStarSearch([enemy[1], enemy[2]], closest, 4, grid, safeGrid);
		if (directions == null) {
			return moves[Math.floor((Math.random() * moves.length))];
		}
		return directions[0];
	}
	return moves[Math.floor((Math.random() * moves.length))];
}

function aStarSearch(start, goal, depth, grid, safeGrid, heuristic = null) {
	//Search the node that has the lowest combined cost and heuristic first
	closed = new Set();
	var temp;
	q = new PriorityQueue();
	q.push(start);
	var node;
	while (true) {
		if (q.isEmpty()) {
			return null;
		}
		node = q.dequeue();
		if (closed.has(node.element) || node.directions.length > depth) {
			continue;
		}
		closed.add(node.element);
		if ((goal[0] == node.element[0]) && (goal[1] == node.element[1])) {
			return node.directions;
		}
		children = getNeighbors(node.element[0], node.element[1], grid, safeGrid);
		for (let x of children) {
			if (!closed.has(x[0])) {
				temp = node.directions.slice();
				temp.push(x[1]);
				q.update(x[0], node.priority + 1, temp);// + heuristic(x[0], problem));
			}
		}
	}
}

//Gets the distance from an enemy to an objective
function distanceToPlayer(enemy, player) {
	return Math.abs(enemy[1] - player[0]) + Math.abs(enemy[2] - player[1]);
}

//General distance
function distance(a, b) {
	return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

// Creates a space of specified length and width with no food or walls at specific coordinates for minotaur
function createMinotaurZone(coords, length, width, grid, foodGrid) {
	for (i = coords[0]; i < coords[0] + width; i++) {
		grid = openWall(i, coords[1], 0, grid);
		grid = openWall(i, coords[1], 3, grid);
		grid = openWall(i, coords[1], 2, grid);
		foodGrid[i][coords[1]] = false;
		grid = openWall(i, coords[1] + length, 0, grid);
		grid = openWall(i, coords[1] + length, 1, grid);
		grid = openWall(i, coords[1] + length, 2, grid);
		foodGrid[i][coords[1] + length] = false;
	}
	for (j = coords[1]; j < coords[1] + length; j++) {
		grid = openWall(coords[0], j, 1, grid);
		grid = openWall(coords[0], j, 2, grid);
		grid = openWall(coords[0], j, 3, grid);
		foodGrid[coords[0]][j] = false;
		grid = openWall(coords[0] + width, j, 0, grid);
		grid = openWall(coords[0] + width, j, 1, grid);
		grid = openWall(coords[0] + width, j, 3, grid);
		foodGrid[coords[0] + width][j] = false;
	}

	for (i = coords[0] + 1; i < coords[0] + width; i++) {
		for (j = coords[1] + 1; j < coords[1] + length; j++) {
			grid[i][j] = [false, false, false, false];
			foodGrid[i][j] = false;
		}
	}
	return [grid, foodGrid];
}

//Calculates next move for minotaur (currently beelines towards 1st place player)
function getMinotaurMove(enemy, grid, safeGrid) {
	var target = [enemy[1], enemy[2]];
	var maxScore = -1;
	for (let [_, value] of map) {
		if (value[3] > maxScore) {
			maxScore = value[3];
			target = [value[0], value[1]];
		}
	}
	return vectorToMove([target[0] - enemy[1], target[1] - enemy[2]], minoMoves(enemy[1], enemy[2], grid, safeGrid));
}

function vectorToMove(vector, moves) {
	var closest = [0, 0];
	var dist = distance(vector, closest);
	for (let move of moves) {
		if (distance(vector, move) < dist) {
			dist = distance(vector, move);
			closest = move;
		}
	}
	return closest;
}

function minoMoves(x, y, grid, safeGrid) {
	moves = [];
	if (tileExists(x - 1, y, grid) && !safeGrid[x - 1][y]) {
		moves.push([-1, 0]);
	}
	if (tileExists(x, y - 1, grid) && !safeGrid[x][y - 1]) {
		moves.push([0, -1]);
	}
	if (tileExists(x + 1, y, grid) && !safeGrid[x + 1][y]) {
		moves.push([1, 0]);
	}
	if (tileExists(x, y + 1, grid) && !safeGrid[x][y + 1]) {
		moves.push([0, 1]);
	}
	return moves;
}

//Kill an enemy on a tile, then bring it back after a specified time
function kill(index, lobbyId) {
	var labyrinth = lobbiesToLabyrinths.get(lobbyId);
	var enemies = labyrinth[4];
	var temp = enemies[index].slice();
	enemies.splice(index, 1);
	labyrinth[4] = enemies;
	lobbiesToLabyrinths.set(lobbyId, labyrinth);
	switch (temp[0]) {
		case 'mob':
			setTimeout(function(){
				labyrinth = lobbiesToLabyrinths.get(lobbyId);
				labyrinth[4].push(temp.slice());
				lobbiesToLabyrinths.set(lobbyId, labyrinth);
			},mobTimeout);
			break;
		case 'smarty':
			setTimeout(function(){
				labyrinth = lobbiesToLabyrinths.get(lobbyId);
				labyrinth[4].push(temp.slice());
				lobbiesToLabyrinths.set(lobbyId, labyrinth);
			},smartyTimeout);
			break;
		case 'minotaur':
			temp[1] = COLS / 2;
			temp[2] = ROWS / 2;
			setTimeout(function(){
				labyrinth = lobbiesToLabyrinths.get(lobbyId);
				labyrinth[4].push(temp.slice());
				lobbiesToLabyrinths.set(lobbyId, labyrinth);
			},minotaurTimeout);
			break;
	}
}

/* The end of enemies */

/* Leaderboard 
	Keep track of player's scores*/
function getLeaders() {
	leaderboard = [];
	for (let value of map.values()) {
						  //color    score      name
		leaderboard.push([value[2], value[3], value[4]]);
	}
	leaderboard.sort(sortPlayer);
	return leaderboard;
}

function sortPlayer(a,b) {
	return b[1] - a[1];
}
/* End of leaderboard */

/* Death 
	Upon dying, players will see their score and a popup will ask if they want to respawn */
//Counts players per quadrants and returns the quadrant to spawn in
function respawnLocation() {
	var counter = [0, 0, 0, 0];
	for (let [key, value] of map) {
		if(value[0] < COLS / 2){
			if(value[1] < ROWS / 2){
				counter[1]++;
			} else {
				counter[2]++;
			}
		} else {
			if(value[1] < ROWS / 2){
				counter[0]++;
			} else {
				counter[3]++;
			}
		}
	}
	return counter.indexOf(Math.min(...counter));
}

//Kill a player and respawn them
function die(id) {
	io.to(id).emit('dead', {score: map.get(id)[3]});
	respawn(id);
}

//Respawn a player at a spawn point
function respawn(id) {
	spawnLocations = [[3 * (COLS / 4), (ROWS / 4)], 
							[(COLS / 4), (ROWS / 4)], 
							[(COLS / 4), 3 * (ROWS / 4)], 
							[3 * (COLS / 4), 3 * (ROWS / 4)]];
	var spawnLocation = respawnLocation()
	map.set(id, [spawnLocations[spawnLocation][0], spawnLocations[spawnLocation][1], map.get(id)[2], 0, map.get(id)[4], [0, 0, 0], map.get(id)[6]]);
}
/* End of death */

/* Lobbies 
	A lobby is a concept used to link players to labyrinths. This prevents labyrinths from getting overcrowded, while also supporting invites to lobbies.
	As such, we have two global maps with lobbyId as the key:
	- lobbiesToPlayers, which maps lobbyIds to sets of player socket ids
	- lobbiesToLabyrinths, which maps lobbyIds to labyrinths, which are 
		{
			0: grid, 
			1: foodGrid, 
			2: safeGrid, 
			3: itemGrid, 
			4: enemies
		}
	
		Right now, we have a basic system for adding players to lobbies. 
		Players are added to the first lobby with space, and if there are no lobbies with space, a new lobby is created. 
		Removing players from lobbies is also not fully implemented, as lobbies are never removed, but players will be removed from lobbies.
		This is not a huge deal at the moment, but ideally, we would remove empty lobbies and possibly add a system for players to choose non-full lobbies to join, or even create private lobbies that have lifecycle tied to the host. 
		The lobby system is also used to determine which labyrinth a player is in, which is important for things like moving enemies and eating food.
*/
var lobbiesToPlayers = new Map(); // Maps lobby numbers to sets of player socket ids
var lobbiesToLabyrinths = new Map(); // Maps lobby numbers to labyrinths, which are arrays of [grid, foodGrid, safeGrid, itemGrid, enemies]
lobbiesToPlayers.set(0, new Set());
var maxLobbySize = 10;
var numberOfLobbies = 0;

function addPlayerToLobby(socketId) {
	var newLobby = -1;
	for (let [lobby, players] of lobbiesToPlayers) {
		if (players.size < maxLobbySize) {
			newLobby = lobby;
			players.add(socketId);
			lobbiesToPlayers.set(newLobby, players);
			break;
		}
	}
	if (newLobby == -1) {
		newLobby = lobbiesToPlayers.size;
		var newPlayers = new Set();
		newPlayers.add(socketId);
		lobbiesToPlayers.set(newLobby, newPlayers);
		createLobby(newLobby);
	}
	return newLobby;
}

function removePlayerFromLobbies(socketId) {
	for (let [lobby, players] of lobbiesToPlayers) {
		if (players.has(socketId)) {
			players.delete(socketId);
			lobbiesToPlayers.set(lobby, players);
			return;
		}
	}
}

function createLobby(lobbyId) {
	//Create just the maze
	var grid = createGrid();
	grid = createMaze(ROWS/2, COLS/2, grid);

	//Create the food grid
	var foodGrid = createFoodGrid(grid);

	//Create the safe grid
	var safeGrid = createSafeGrid();

	//Create the safe zones
	var grids = [grid, foodGrid, safeGrid];
	grids = createSafeZone([COLS / 4 - 2, ROWS / 4 - 2], 4, 4, grids[0], grids[1], grids[2]);
	grids = createSafeZone([3 * COLS / 4 - 2, ROWS / 4 - 2], 4, 4, grids[0], grids[1], grids[2]);
	grids = createSafeZone([COLS / 4 - 2, 3 * ROWS / 4 - 2], 4, 4, grids[0], grids[1], grids[2]);
	grids = createSafeZone([3 * COLS / 4 - 2, 3 * ROWS / 4 - 2], 4, 4, grids[0], grids[1], grids[2]);
	grid = grids[0];
	foodGrid = grids[1];
	safeGrid = grids[2];

	//Create the item grid
	var itemGrid = createItemGrid();
	var newGrids = [itemGrid, foodGrid]
	for (i = 0; i < ROWS; i+=ROWS/8) {
		for (j = 0; j < COLS; j+=COLS/8) {
			if (!safeGrid[i][j]) {
				if ((i - j) % (ROWS/4) == 0) {
					placeItem(i, j, "key", newGrids[0], newGrids[1]);
				} else {
					placeItem(i, j, "bomb", newGrids[0], newGrids[1]);
				}
			}
		}
	}

	//Create the enemies
	var enemies = [];

	//Add smartys
	for (i = 0; i < COLS; i += 4) {
		for (j = 0; j < ROWS; j += 4) {
			if (!safeGrid[i][j]) {
				enemies.push(['smarty', i, j]);
			}
		}
	}

	//Create zone for boss
	var gridAndFood = createMinotaurZone([COLS / 2 - 2, ROWS / 2 - 2], 4, 4, grid, foodGrid);
	grid = gridAndFood[0];
	foodGrid = gridAndFood[1];

	//Add bosses
	enemies.push(['minotaur', COLS / 2, ROWS / 2]);

	lobbiesToLabyrinths.set(lobbyId, [grid, foodGrid, safeGrid, itemGrid, enemies]);

	//Start moving enemies
	startMovingEnemies(lobbyId);
}

/* End of lobbies */

//After each player move, update the tiles, eat food, and pick up items
function afterMove(id) {
	var x = map.get(id)[0],
		y = map.get(id)[1];
	var labyrinth = lobbiesToLabyrinths.get(map.get(id)[6]);
	updateTile(map.get(id), labyrinth[0]);
	eatFood(x, y, id, map.get(id)[6]);
	overItem(x, y, id, labyrinth[3], map.get(id)[6]);
}

//Continuous processing for each player (eat, interact with enemies, display leaderboard)
function continuous(id) {
	var x = map.get(id)[0],
		y = map.get(id)[1];
	var lobbyId = map.get(id)[6];
	if (lobbyId == null) {
		return;
	}
	eatFood(x, y, id, lobbyId);											//Eat food if available
	for (let enemy of lobbiesToLabyrinths.get(lobbyId)[4]) {								//Die if touching enemy
		if ((enemy[1] == x) && (enemy[2] == y)) {
			die(id);
		}
	}
}

/*
'test' - load test maze
'printNew' - print new random maze
default - create new random maze
*/
function main(args) {
	//Create the maze
	switch(args) {
		case 'test':
			loadTestGrid('file');
			break;
		case 'printNew':
			createLobby(numberOfLobbies);
			saveMazeGrid();
			break;
		default:
			createLobby(numberOfLobbies);
			break;
	}
}

main();

////////////////////
//################//
//# Socket stuff #//
//################//
////////////////////
var io = socket(server);                //Sets up an io variable by calling socket on the server (?)

/*
We keep a map of socket connection to player data. Each value in the map contains an array with the following information at each index:
0 - x
	- The x grid coordinate of the player
1 - y
	- The y grid coordinate of the player
2 - color
	- The color of the player
3 - score
	- The score of the player
4 - name
	- The nickname of the player
5 - items
	- The items that a player has
	- Items are stored as number arrays so that powerups are the first number, and collectibles are the remaining as such:
		- 0 - Current Powerup (limited to 1)
		- 1 - Bombs
		- 2 - Keys, etc
6 - lobbyId
	- Which maze the player is in, numbered
*/
var map = new Map();
const emitInterval = 100, 
	continuousInterval = 10;

//Handles continuous serverside events, including emitting gameState to clients
setInterval(function(){
	for (var [lobbyId, players] of lobbiesToPlayers) {
		var labyrinth = lobbiesToLabyrinths.get(lobbyId);
		if (!labyrinth) {
			continue;
		}
		for (var player of players) {
			io.to(player).emit('privateState', {playerx: map.get(player)[0], playery: map.get(player)[1], score: map.get(player)[3], items: map.get(player)[5]});
			io.to(player).emit('gameState', {locations: mapToArray(map), grid: labyrinth[0], food: labyrinth[1], enemies: labyrinth[4], leaderboard: getLeaders(), items: labyrinth[3], safe: labyrinth[2]});
		}
	}
},emitInterval);

io.on('connection', function(socket){               //When a connection is made, calls the function which...
	var lobbyId = null; // Make this globally available in connection scope
	console.log('socket connected!', socket.id)     //Logs this message to console, along with the socket id of the connection
	//On first connection, we still don't know which lobby the player will be in, so we just send them the first one until they send us their name and color and we can put them in a lobby. 
	//This is a band-aid fix for the problem of the client needing the map before it can send us the info to put it in a lobby, which is necessary to know which map to send it.
	var labyrinth = lobbiesToLabyrinths.values().next().value;
	io.to(socket.id).emit('begin', {locations: mapToArray(map), grid: labyrinth[0], food: labyrinth[1], enemies: labyrinth[4], leaderboard: getLeaders(), items: labyrinth[3], safe: labyrinth[2]});

	socket.on('begin', function(data) {
		if (!data.name) {
			data.name = 'noname';
		}
		if (!data.color) {
			data.color = 'Grey';
		}
		const spawnLocations = [[3 * (COLS / 4), (ROWS / 4)], 
							[(COLS / 4), (ROWS / 4)], 
							[(COLS / 4), 3 * (ROWS / 4)], 
							[3 * (COLS / 4), 3 * (ROWS / 4)]];
		var spawnLocation = respawnLocation();
		lobbyId = addPlayerToLobby(socket.id);
		map.set(socket.id, [spawnLocations[spawnLocation][0], spawnLocations[spawnLocation][1], data.color, 0, data.name, [0, 0, 0], lobbyId]);
		io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3], items: map.get(socket.id)[5]});

		//Handles continuous events for a connection, such as eating food and interacting with enemies
		setInterval(function(){
			if (map.get(socket.id)) {
				continuous(socket.id);
			}
		},continuousInterval);
	});

	socket.on('W', function() {                      //When socket gets a W event from a client...
		if (map.get(socket.id) && !getTile(map.get(socket.id), lobbiesToLabyrinths.get(lobbyId)[0])[1]) {
			if (map.get(socket.id)[1] > 0) {
				map.get(socket.id)[1]--;
				afterMove(socket.id);
			}
		}
	});

	socket.on('A', function() {                      //When socket gets an A event from a client...
		if (map.get(socket.id) && !getTile(map.get(socket.id), lobbiesToLabyrinths.get(lobbyId)[0])[0]) {
			if (map.get(socket.id)[0] > 0) {
				map.get(socket.id)[0]--;
				afterMove(socket.id);
			}
		}
	});

	socket.on('S', function() {                      //When socket gets an S event from a client...
		if (map.get(socket.id) && !getTile(map.get(socket.id), lobbiesToLabyrinths.get(lobbyId)[0])[3]) {
			if (map.get(socket.id)[1] < (ROWS - 1)) {
				map.get(socket.id)[1]++;
				afterMove(socket.id);
			}
		}
	});

	socket.on('D', function() {                      //When socket gets a D event from a client...
		if (map.get(socket.id) && !getTile(map.get(socket.id), lobbiesToLabyrinths.get(lobbyId)[0])[2]) {
			if (map.get(socket.id)[0] < (COLS - 1)) {
				map.get(socket.id)[0]++;
				afterMove(socket.id);
			}
		}
	});

	socket.on('E', function() {
		if (map.get(socket.id)) {
			useItem(socket.id, "bomb");
		}
	});

	socket.on('Q', function() {
		if (map.get(socket.id)) {
			useItem(socket.id, "key");
		}
	});    

	socket.on('disconnect', function(){
		map.delete(socket.id);
		removePlayerFromLobbies(socket.id);
	});

	socket.on('respawn', function(){
		respawn(socket.id);
	});
});