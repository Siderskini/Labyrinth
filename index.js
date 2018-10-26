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
var COLS = 48,
    ROWS = 48;

var zeroToThree = [0, 1, 2, 3];

//The grid itself
var grid = new Array(COLS);
for (i = 0; i < COLS; i++) {
    grid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
        grid[i][j] = [true, true, true, true];
    }
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

//Functions
function mapToArray(map) {
	var array = [];
	for (let [key, value] of map) {
  		array.push(value);
	}
	return array;
}

function updateTile(player) {
    if (isDeadEnd(player[0], player[1])) {
        var playerx = player[0];
        var playery = player[1];
        if ((playerx > 0) && (playery > 0) && (playerx < (ROWS - 1)) && (playery < (COLS - 1))) { //If it's not a border tile
            var entrance = grid[playerx][playery].indexOf(false);
            closeWall(playerx, playery, entrance);
            var remaining = zeroToThree.filter(e => e !== entrance);
            var opening = remaining[Math.floor((Math.random() * 3))];
            openWall(playerx, playery, opening);
        }
    }
}

function closeWall(x, y, wall){
    grid[x][y][wall] = true;
    switch (wall) {
        case 0:
            grid[x - 1][y][2] = true;
            break;
        case 1:
            grid[x][y - 1][3] = true;
            break;
        case 2:
            grid[x + 1][y][0] = true;
            break;
        case 3:
            grid[x][y + 1][1] = true;
            break;
    }
}

function openWall(x, y, wall){
    grid[x][y][wall] = false;
    switch (wall) {
        case 0:
            grid[x - 1][y][2] = false;
            break;
        case 1:
            grid[x][y - 1][3] = false;
            break;
        case 2:
            grid[x + 1][y][0] = false;
            break;
        case 3:
            grid[x][y + 1][1] = false;
            break;
    }
}

function getTile(player) {
    var x = player[0];
    var y = player[1];
    return grid[x][y];
}

function isDeadEnd(x, y) {
    return grid[x][y].reduce(add, 0) == 3;
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

/* Food */
//Food grid is a grid used for storing food
var foodGrid = new Array(COLS);
for (i = 0; i < COLS; i++) {
    foodGrid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
    	if (!isDeadEnd(i, j)) {
        	foodGrid[i][j] = true;
    	}
    }
}

//This function has rules for what happens when food is eaten
function eatFood(x, y, id) {
	if (foodGrid[x][y]) {
		foodGrid[x][y] = false;
		map.get(id)[3]++;
		//map.set(id, [map.get(id)[0], map.get(id)[1], map.get(id)[2], map.get(id)[3] + 1, map.get(id)[4]]); //Increase score by 1 for eating a food
		setTimeout(function(){
			foodGrid[x][y] = true;
		},30000);
	}
}
/* The end of food */

/* Safe zones */
var safeGrid = [];
for (i = 0; i < COLS; i++) {
    safeGrid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
        safeGrid[i][j] = false;
    }
}

function createSafeZone(coords, length, width) {
	for (i = coords[0]; i < coords[0] + width; i++) {
		openWall(i, coords[1], 0);
		openWall(i, coords[1], 3);
		openWall(i, coords[1], 2);
		foodGrid[i][coords[1]] = false;
		openWall(i, coords[1] + length, 0);
		openWall(i, coords[1] + length, 1);
		openWall(i, coords[1] + length, 2);
		foodGrid[i][coords[1] + length] = false;
	}
	for (j = coords[1]; j < coords[1] + length; j++) {
		openWall(coords[0], j, 1);
		openWall(coords[0], j, 2);
		openWall(coords[0], j, 3);
		foodGrid[coords[0]][j] = false;
		openWall(coords[0] + width, j, 0);
		openWall(coords[0] + width, j, 1);
		openWall(coords[0] + width, j, 3);
		foodGrid[coords[0] + width][j] = false;
	}

	for (i = coords[0] + 1; i < coords[0] + width; i++) {
		for (j = coords[1] + 1; j < coords[1] + length; j++) {
			safeGrid[i][j] = true;
			grid[i][j] = [false, false, false, false];
			foodGrid[i][j] = false;
		}
	}
}

//Create the safe zones
createSafeZone ([COLS / 2 - 4, ROWS / 2 - 4], 8, 8);

/* The end of safe zones */

/* The beginning of items */

var itemGrid = new Array(COLS);
for (i = 0; i < COLS; i++) {
    itemGrid[i] = new Array(ROWS);
    for (j = 0; j < ROWS; j++) {
        itemGrid[i][j] = null;
    }
}

function placeItem(x, y, item) {
	itemGrid[x][y] = item;
	foodGrid[x][y] = false;
}

function useItem(id, item) {
	switch(item) {
		case "bomb":
			if (map.get(id)[5][1]) {
				map.get(id)[5][1]--;
				setBomb(map.get(id)[0], map.get(id)[1]);
			} else {
				console.log("No bombs!");
			}
			break;
		case "key":
			if (map.get(id)[5][2]) {
				useKey(map.get(id)[0], map.get(id)[1]);
			} else {
				console.log("No keys!");
			}
			break;
		default:
			console.log("wtf are you trying to do?");
			break;
	}
}

function useKey(x, y) {
	var temp = getTile([x, y]).slice();
	openWall(x, y, 0);
	openWall(x, y, 1);
	openWall(x, y, 2);
	openWall(x, y, 3);
	setTimeout(function(){
		for (i = 0; i < 4; i++) {
			if (temp[i]) {
				closeWall(x, y, i);
			}
		}
	},3000);
	console.log("Used a key!");
}

function setBomb(x, y) {
	placeItem(x, y, "comb");
	setTimeout(function(){
		itemGrid[x][y] = null;
		detonateBomb(x, y, 1);
	},3000);
}

function detonateBomb(x, y, radius) {
	console.log("BOOM");
	for (i = x - radius; i < x + radius + 1; i++) {
		for (j = y - radius; j < y + radius + 1; j++) {
			placeItem(i, j, "boom");
			for (let [id, player] of map) {
				if ((map.get(id)[0] == i) && (map.get(id)[1] == j)) {
					map.set(id, [(COLS / 2), (ROWS / 2), map.get(id)[2], 0, map.get(id)[4], [0, 0, 0]]);
				}
			}
			for (let enemy of enemies) {
				if ((enemy[1] == i) && (enemy[2] == j)) {
					enemy[1] = 1;
					enemy[2] = 1;
				}
			}
			setTimeout(function() {
				afterBomb(x, y, radius);
			},100);
		}	
	}
}

function afterBomb(x, y, radius) {
	for (i = x - radius; i < x + radius + 1; i++) {
		for (j = y - radius; j < y + radius + 1; j++) {
			placeItem(i, j, null);
		}	
	}
}

function overItem(x, y, id) {
	if (itemGrid[x][y]) {
		switch(itemGrid[x][y]) {
			case "bomb":
				itemGrid[x][y] = null;
				map.get(id)[3] += 5;
				map.get(id)[5][1]++;
				console.log("Bombs: ", map.get(id)[5][1]);
				setTimeout(function(){
					itemGrid[x][y] = "bomb";
				},300000);
				break;
			case "key":
				itemGrid[x][y] = null;
				map.get(id)[3] += 3;
				map.get(id)[5][2]++;
				setTimeout(function(){
					itemGrid[x][y] = "key";
				},300000);
				break;	
			default:
				console.log("Illegitimate item collected.");
				break;
		}
	}
}

for (i = 0; i < ROWS; i+=ROWS/8) {
	for (j = 0; j < COLS; j+=COLS/8) {
		if (!safeGrid[i][j]) {
			if ((i == j) || (i == (ROWS - j))) {
				placeItem(i, j, "key");
			} else {
				placeItem(i, j, "bomb");
			}
		}
	}
}

/* The end of items */


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
/*
for (i = 4; i < ROWS - 4; i++) {
	enemies.push(['mob', i, i]);
}
*/
/*
for (i = 4; i < COLS; i += 4) {
	for (j = 4; j < ROWS; j += 4) {
		enemies.push(['mob', i, j]);
	}
}
*/
//Add smartys
//enemies.push(['smarty', 3, 3]);

for (i = 0; i < COLS; i += 4) {
	for (j = 0; j < ROWS; j += 4) {
		if (!safeGrid[i][j]) {
			enemies.push(['smarty', i, j]);
		}
	}
}


//Add bosses
//enemies.push(['boss', COLS / 2, ROWS / 2]);

function moveEnemies() {
	for (let enemy of enemies) {
		switch (enemy[0]) {
			case 'mob':
				var moves = realMoves(enemy[1] , enemy[2]);
				if (moves.length) {
					var move = moves[Math.floor((Math.random() * moves.length))];		//Mobs randomwalk
					enemy[1] += move[0];
					enemy[2] += move[1];
				}
				break;
			case 'smarty':
				var moves = realMoves(enemy[1] , enemy[2]);
				//moves.push([0,0]);
				var move = getSmartMove(enemy, moves);
				if (move == null) {
					move = [0, 0];
				}
				enemy[1] += move[0];
				enemy[2] += move[1];
				break;
		}
	}
}

//Moves the enemies on a timer
setInterval(function(){
	moveEnemies();
},1000);

//Gets possible moves for an enemy
function realMoves(x, y) {
	var tile = getTile([x, y]);
	moves = [];
	if (!tile[0] && !safeGrid[x - 1][y]) {
		moves.push([-1, 0]);
	}
	if (!tile[1] && !safeGrid[x][y - 1]) {
		moves.push([0, -1]);
	}
	if (!tile[2] && !safeGrid[x + 1][y]) {
		moves.push([1, 0]);
	}
	if (!tile[3] && !safeGrid[x][y + 1]) {
		moves.push([0, 1]);
	}
	return moves;
}

//Returns neighbiring tiles and the move taken to get there
function getNeighbors(x, y) {
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
function getSmartMove(enemy, moves) {
	closest = [ROWS * 2, COLS * 2];
	dist = distanceToPlayer(enemy, closest);
	for (let [id, player] of map) {
		if (distanceToPlayer(enemy, [player[0], player[1]]) < dist) {
			dist = distanceToPlayer(enemy, [player[0], player[1]]);
			closest = [player[0], player[1]];
		}
	}
	if (map.size) {
		var directions = aStarSearch([enemy[1], enemy[2]], closest, 4);
		if (directions == null) {
			return moves[Math.floor((Math.random() * moves.length))];
		}
		return directions[0];
	}
	return moves[Math.floor((Math.random() * moves.length))];
}

function aStarSearch(start, goal, depth, heuristic = null) {
    //Search the node that has the lowest combined cost and heuristic first
    closed = [];
    var temp;
    q = new PriorityQueue();
    q.push(start);
    var node;
    while (true) {
        if (q.isEmpty()) {
            return null;
        }
        node = q.dequeue();
        if (closed.includes(node.element) || node.directions.length > depth) {
            continue;
        }
        closed.push(node.element);
        if ((goal[0] == node.element[0]) && (goal[1] == node.element[1])) {
            return node.directions;
        }
        children = getNeighbors(node.element[0], node.element[1]);
        for (let x of children) {
            if (!closed.includes(x[0])) {
            	temp = node.directions.slice();
            	temp.push(x[1]);
                q.update(x[0], node.priority + 1, temp);// + heuristic(x[0], problem));
            }
        }
    }
}

/* Beginning of ASTAR
def aStarSearch(problem, heuristic=nullHeuristic):
    """Search the node that has the lowest combined cost and heuristic first."""
    closed = []
    q = new PriorityQueue()
    q.push(searchNode(problem.getStartState()), 0)
    while True:
        if q.isEmpty():
            return None
        node = q.pop()
        if (node.n in closed):
            continue
        closed.append(node.n)
        if problem.isGoalState(node.n):
            return node.d
        children = problem.getSuccessors(node.n)
        for x in children:
            if x[0] not in closed:
                q.update(searchNode(x[0], node.p + x[2], node.d + [x[1]]), node.p + x[2] + heuristic(x[0], problem))
*/

//Gets the distance from an enemy to an objective
function distanceToPlayer(enemy, player) {
	return Math.abs(enemy[1] - player[0]) + Math.abs(enemy[2] - player[1]);
}

//General distance
function distance(a, b) {
	return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

/* The end of enemies */

/* Leaderboard */
var leaderboard = [];

function getLeaders() {
	leaderboard = [];
	for (let [key, value] of map) {
						  //color    score      name
		leaderboard.push([value[2], value[3], value[4]]);
	}
	leaderboard.sort(sortPlayer);
}

function sortPlayer(a,b) {
    return a[1] - b[1];
}

/* End of leaderboard */

function afterMove(id) {
	var x = map.get(id)[0],
		y = map.get(id)[1];
	updateTile(map.get(id));
	eatFood(x, y, id);
	overItem(x, y, id);
}

function continuous(id) {
	var x = map.get(id)[0],
		y = map.get(id)[1];
	eatFood(x, y, id);											//Eat food if available
	for (let enemy of enemies) {								//Die if touching enemy
		if ((enemy[1] == x) && (enemy[2] == y)) {
			map.set(id, [(COLS / 2), (ROWS / 2), map.get(id)[2], 0, map.get(id)[4], [0, 0, 0]]);
		}
	}
	getLeaders();
}

//Socket setup
var io = socket(server);                //Sets up an io variable by calling socket on the server (?)

/*
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
*/
var map = new Map();

io.on('connection', function(socket){               //When a connection is made, calls the function which...
    console.log('socket connected!', socket.id)     //Logs this message to console, along with the socket id of the connection
    //map.set(socket.id, [(COLS / 2) * TILE_S, (ROWS / 2) * TILE_S, (map.size % 4) + 1, 0]);
    //io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3]});
    io.to(socket.id).emit('begin', {locations: mapToArray(map), grid: grid, food: foodGrid, enemies: enemies, leaderboard: leaderboard, items: itemGrid});

    //Handles continuous events, including emitting gameState to client
    setInterval(function(){
    	if (map.get(socket.id)) {
    		io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3], items: map.get(socket.id)[5]});
    		io.emit('gameState', {locations: mapToArray(map), grid: grid, food: foodGrid, enemies: enemies, leaderboard: leaderboard, items: itemGrid});
    	}
	},100);
	setInterval(function(){
		if (map.get(socket.id)) {
    		continuous(socket.id);
   		}
    },10);

    socket.on('begin', function(data) {
    	map.set(socket.id, [(COLS / 2), (ROWS / 2), data.color, 0, data.name, [0, 0, 0]]);
    	io.to(socket.id).emit('privateState', {playerx: map.get(socket.id)[0], playery: map.get(socket.id)[1], score: map.get(socket.id)[3], items: map.get(socket.id)[5]});
    });

    socket.on('W', function() {                      //When socket gets a W event from a client...
        if (map.get(socket.id) && !getTile(map.get(socket.id))[1]) {
            if (map.get(socket.id)[1] > 0) {
            	map.get(socket.id)[1]--;
                //map.set(socket.id, [map.get(socket.id)[0], map.get(socket.id)[1] - 1, map.get(socket.id)[2], map.get(socket.id)[3], map.get(socket.id)[4], map.get(socket.id)[5]]);
                afterMove(socket.id);
            }
        }
    });

    socket.on('A', function() {                      //When socket gets an A event from a client...
        if (map.get(socket.id) && !getTile(map.get(socket.id))[0]) {
            if (map.get(socket.id)[0] > 0) {
            	map.get(socket.id)[0]--;
                //map.set(socket.id, [map.get(socket.id)[0] - 1, map.get(socket.id)[1], map.get(socket.id)[2], map.get(socket.id)[3], map.get(socket.id)[4], map.get(socket.id)[5]]);
                afterMove(socket.id);
            }
        }
    });

    socket.on('S', function() {                      //When socket gets an S event from a client...
        if (map.get(socket.id) && !getTile(map.get(socket.id))[3]) {
            if (map.get(socket.id)[1] < (ROWS - 1)) {
            	map.get(socket.id)[1]++;
                //map.set(socket.id, [map.get(socket.id)[0], map.get(socket.id)[1] + 1, map.get(socket.id)[2], map.get(socket.id)[3], map.get(socket.id)[4], map.get(socket.id)[5]]);
                afterMove(socket.id);
            }
        }
    });

    socket.on('D', function() {                      //When socket gets a D event from a client...
        if (map.get(socket.id) && !getTile(map.get(socket.id))[2]) {
            if (map.get(socket.id)[0] < (COLS - 1)) {
            	map.get(socket.id)[0]++;
                //map.set(socket.id, [map.get(socket.id)[0] + 1, map.get(socket.id)[1], map.get(socket.id)[2], map.get(socket.id)[3], map.get(socket.id)[4], map.get(socket.id)[5]]);
                afterMove(socket.id);
            }
        }
    });

    socket.on('E', function() {
    	useItem(socket.id, "bomb");
    });

	socket.on('Q', function() {
    	useItem(socket.id, "key");
    });    

    socket.on('disconnect', function(){
        map.delete(socket.id);
    });
});