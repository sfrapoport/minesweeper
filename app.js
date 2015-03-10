// Created by sophierapoport on 2/8/15.

var myBoard, boardCanvas, startTime;
var picture_resources = {
    "m": "images/mine.gif",
    0: "images/zero.gif",
    1: "images/one.gif",
    2: "images/two.gif",
    3: "images/three.gif",
    4: "images/four.gif",
    5: "images/five.gif",
    6: "images/six.gif",
    "f": "images/flag.jpeg"
};
var clockID; 

//Initialize board as an object
function Board(rows, cols, mines) {
    this.rows = rows;
    this.cols = cols;
    this.mineTotal = mines;
    this.revealed = [];
}

function Cell(mines, i, j) {
    this.mines = mines;
    this.neighborCount = 0;
    this.flagged = false;
    this.xCoord = i;
    this.yCoord = j;
}
//Board configuration: Place mines on board

Board.prototype.placeMines = function() {

    var mineCount = 0;
    var mines = [];
    var rowID, colID;
    //Select mine placements at random
    var mineArray = new Array(this.rows * this.cols);
    for (var k = 0; k<mineArray.length; k++) {
        mineArray[k] = k;
    }
    mineArray.sort(function () {
        return Math.random() - 0.5;
    });
    for (var k=0; k<mineArray.length; k++) {
        rowID = Math.floor(mineArray[k] / this.cols);
        colID = mineArray[k] % this.rows;
        if (k < this.mineTotal) {
            this[[rowID, colID]] = new Cell(true, rowID, colID);
            mines.push([rowID, colID]);
        } else {
            this[[rowID, colID]] = new Cell(false, rowID, colID);
        }
    }
    
    this.mineLocations = mines;
};
//Board configuration: Link each cell to its neighbors, and calculate the number
//of bordering mines.

Board.prototype.setNeighborCount = function() {
    for (var i=0; i<this.rows; i++) {
        for (var j= 0; j<this.cols; j++) {
            var mines = 0;
            var nbr = this.neighbors(i, j);
            for (var k=0, len = nbr.length; k<len; k++) {
                if (this[nbr[k]].mines === true) {
                    mines++;
                }
            }
            this[[i,j]].neighborCount = mines;
        }
    }
}

//Helper function to find a cell's neighbors.
//I'm unclear here on best practices about object orientation: Should I have the neighbors
//function call only the cell, and assume it's only being called from within a board. Time
//to review!

Board.prototype.neighbors = function(i, j) {
    var cols = this.cols;
    var rows = this.rows;
    var neighbors = [[i-1, j-1], [i-1, j], [i-1, j+1],
        [i, j-1], [i, j+1], [i+1, j-1], [i+1, j], [i+1, j+1]];
    return neighbors.filter(function(coords) {
        return (0<=coords[0] && coords[0]<cols && 0<=coords[1]&& coords[1]<rows) 
    })
}

//initialize the board object

Board.prototype.init = function() {
    this.placeMines();
    this.setNeighborCount();
    this.draw();
    startTime = new Date().getTime();
    clockID = setInterval(updateClock, 1000);
}

//Draw an empty board

Board.prototype.draw = function() {
    var canvas = document.getElementById("boardbackground");
    if (canvas.getContext) {
        var ctx = canvas.getContext("2d");

        ctx.fillStyle = "rgb(160, 160, 160)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        for (var i=0; i<this.rows; i++) {
            for (var j=0; j<this.cols; j++) {
                ctx.strokeRect(i*20, j*20, 20, 20);
            }
        }
    }
    var overlay = document.getElementById("gameboard");
    overlay.width = overlay.width;    
}
//Refactor this function to follow scope conventions after researching this. 
//For now I've aliased the board to have access to it from within the function
//scope.

Board.prototype.revealBombs = function() {
    var board = this;
    this.mineLocations.forEach(function(cell) {
        board[cell].draw();
    });
    clearInterval(clockID);
}

Board.prototype.checkFinished = function() {
    for (var i=0; i<this.cols; i++) {
        for (var j=0; j<this.rows; j++) {
            if (!this[[i, j]].drawn) {
                return false;
            }
        }
    }
    return true;
}

//Place a flag on a cell, to make that cell unclickable
Cell.prototype.placeFlag = function(cell) {
    //Make position unclickable
    this.flagged = true;
    this.draw();
    //Call draw function;
}

Cell.prototype.removeFlag = function() {
    this.flagged = false;
    var overlay = document.getElementById("gameboard");
    if (overlay.getContext) {
        var ctx = overlay.getContext("2d");
        var xCoord = this.xCoord;
        var yCoord = this.yCoord;
        ctx.fillStyle = "rgb(160, 160, 160)";
        ctx.fillRect(xCoord*20, yCoord*20, 20, 20);
    }
}

Cell.prototype.draw = function() {
    var canvas = document.getElementById("gameboard");
    if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        var contents = this.flagged ? "f" : this.mines ? "m" : this.neighborCount;
        var img = new Image();
        var xCoord = this.xCoord;
        var yCoord = this.yCoord;

        img.src = picture_resources[contents];
        ctx.drawImage(img, xCoord * 20, yCoord*20, 20, 20);
        if (contents === 0 && !(this.drawn)) {
            this.fillZerosIn();
        } else {
            this.drawn = true;
            if (myBoard.checkFinished()) {
                clearInterval(clockID);
            }
        }
    }
}

Cell.prototype.fillZerosIn = function() {
    this.drawn = true;
    var nbr = myBoard.neighbors(this.xCoord, this.yCoord);
    for (var i=0; i<nbr.length; i++) {
        myBoard[[nbr[i][0], nbr[i][1]]].draw();
    }
}

window.onload = function() {
    myBoard = new Board(10,10,10);
    myBoard.draw();
    myBoard.init();
    boardCanvas = document.getElementById("gameboard");
    boardCanvas.addEventListener("click", minesweeperClickHandler, false);
    boardCanvas.addEventListener("contextmenu", minesweeperRightClickHandler, false);
}


function updateClock() {
    document.getElementById("clock").innerHTML = Math.floor((new Date().getTime() - startTime)/1000);
}

function minesweeperClickHandler(e) {
    var cell = getCursorCell(e);
    if (!cell.flagged) {
        if (cell.mines) {
            myBoard.revealBombs();
        } else {
            cell.draw();
        }
    }
}

function minesweeperRightClickHandler(e) {
    e.preventDefault();
    var cell = getCursorCell(e);
    if (cell.flagged) {
        cell.removeFlag();
    } else {
        cell.placeFlag();
    }
}

function getCursorCell(e) {
    var x, y;
    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft +
        document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop +
        document.documentElement.scrollTop;
    }
    x -= boardCanvas.offsetLeft;
    y -= boardCanvas.offsetTop;
    return myBoard[[Math.floor(x/20), Math.floor(y/20)]];
}

function refresh() {
    myBoard.init();
}

var resetBtn = document.getElementById("reset");
resetBtn.onclick = refresh; 