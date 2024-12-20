const canvas = document.getElementById("Canvas")
const context = canvas.getContext('2d');

function handlesetting(id, functionstr, inpType, placeholder = null, initValue = null, min = null, max = null) {
    let superElem = document.createElement("span")

    let elem = docuemnt.createElement("input")
    elem.value = initVakue
    elem.min = min
    elem.max = max
    elem.placeholder = placeholder
    elem.id = id
    elem.addEventListener(inpType, functionstr)
    document.querySelectorAll("#info")[0].appendChild(elem).appendChild(document.createElement("br"))

}
settings = [
    ["players", "players = this.value", "number", "# of players", 2, 2, 8],
    ["players", "players = this.value", "number", "# of players", 2, 2, 8],
    ["players", "players = this.value", "number", "# of players", 2, 2, 8],
    ["players", "players = this.value", "number", "# of players", 2, 2, 8],
    ["players", "players = this.value", "number", "# of players", 2, 2, 8],
    ["players", "players = this.value", "number", "# of players", 2, 2, 8]
]






const baseWidth = 891
context.strokeStyle = 'black';


canvas.setAttribute("width", baseWidth)
canvas.setAttribute("height", baseWidth)


let dumbAiPlayers = []
let displyingLocks = false
let minimiseHighlights = false
let displayLocked = false
let maxDepth = 2
let players = 2 //max 8
let startLayers = 1
let savingName = "Save1"
let loadingName = "Save1"
const progressMode = 1
let ruleSet = 1
let currMaxLayer = 1;
/*
0: none
1: tries to force metacell- normal ultimate when used with startlayer 2
*/
let highlightedCell = [900, 900]
let currPlayer = 0

let board = []
let currBoard = []
let currLayer = 1
let currMoves = []
let upgradedCells = [] // will be full of small arrays like currMoves for where individual cells should be set
let won = -1
let selecting = 0
let staleMate = 0
let lastMove = []

function setSelecting(x) {
    selecting = x

    document.getElementById("upgrading").value = selecting
}

const colours = ["red", "blue", "pink", "orange", "grey", "magenta", "purple", "lime"]

const gridColours = [null, "red", "blue", "green", "magenta", "black"]

function createLayeredBoard(layers) {
    let currSample = [-1, -1, -1, -1, -1, -1, -1, -1, -1]
    let nextSample = []
    for (i = 0; i < layers - 1; i++) {
        for (j = 0; j < 9; j++) {
            nextSample.push(JSON.parse(JSON.stringify(currSample)))
        }
        currSample = [...nextSample]
        nextSample = []
    }
    return currSample
}

//createBasicBoard()

function getLayerWidth(layer) {
    return baseWidth / (3 ** layer)
}

function drawGrid(boundx = 0, boundy = 0, layer = 1) {
    let layerWidth = getLayerWidth(layer)
    let startx = gridToCoords(layer - 1, boundx)
    let starty = gridToCoords(layer - 1, null, boundy)
    context.beginPath();
    context.strokeStyle = gridColours[layer]

    for (i = 1; i < 3; i++) {
        context.moveTo(startx + layerWidth * i, starty);
        context.lineTo(startx + layerWidth * i, starty + layerWidth * 3);
    }
    for (i = 1; i < 3; i++) {

        context.moveTo(startx, starty + layerWidth * i);
        context.lineTo(startx + layerWidth * 3, starty + layerWidth * i);

    }
    context.stroke();

}

function recursiveGrid(layer, subboard, position, starti) {
    if (layer > 4) {
        return
    }
    // debugger
    drawGrid(position[0], position[1], layer)
    for (i = 0; i < 9; i++) {
        if (typeof(subboard[i]) == "object") {
            i = recursiveGrid(layer + 1, subboard[i], [position[0] * 3 + i % 3, position[1] * 3 + div(i, 3)], i)
        }
    }
    return starti
}

//drawGrid()



function gridToCoords(layer, x = null, y = null) {
    let layerWidth = getLayerWidth(layer)
    if (x == null) {
        return y * layerWidth
    }
    return x * layerWidth
}

function posToCoords(layer, position) {
    return [gridToCoords(layer, position % (3 ** layer)), gridToCoords(layer, 0, Math.floor(position / (3 ** layer)))]
}

function findMetaCellClicked(e) {
    let x = e.clientX
    let y = e.clientY
    let cell, celloff;
    if (x < baseWidth / 3) {
        celloff = 0
    } else if (x < 2 * baseWidth / 3) {
        celloff = 1
    } else {
        celloff = 2
    }

    if (y < baseWidth / 3) {
        cell = 0
    } else if (y < 2 * baseWidth / 3) {
        cell = 3
    } else {
        cell = 6
    }
    return cell + celloff
}


function update() {
    context.clearRect(0, 0, baseWidth, baseWidth);

    if (won !== -1) {
        fillSpace(0, 0, 0, 0, colours[won])
        return
    }

    zoomedRecursion(currBoard)

    recursiveGrid(1, currBoard, [0, 0], 0)

    for (i = 0; i < 9; i++) {
        //    drawGrid(i%3, div(i,3), 2)
    }

    highlightCell()

    if(dumbAiPlayers.length !== 0){
        if(currPlayer in dumbAiPlayers){
            dumbAiMove()
        }
    }
}

function dumbAiMove(){
    while(handleMove(Math.floor(9*Math.random() ) ) ){
        return
    }
}

let timesRun = 0



function recursiveFill(layer, subBoard, skippedX = 0, skippedY = 0, starti) {
    if (layer === 1 && displayLocked && typeof(board[lastMove.at(-1)]) === "object") {
        for (i = 0; i < 9; i++) {
            if (i === lastMove.at(-1)) {
                i++
            }
            
            context.fillStyle = "rgba(0,0,0,0.2)"
            context.fillRect(297*(i%3), 297*div(i,3), 297, 297)
        }
    }
    if (layer > 4) {
        return starti
    }
    timesRun++
    for (i = 0; i < 9; i++) {
        if (typeof(subBoard[i]) == "number") {
            if (subBoard[i] >= 0) { // if the cell is colouredw
                fillSpace(layer, skippedX, skippedY, i, colours[subBoard[i]])
            }
        } else { // happens when an array which indicates a sub-board
            i = recursiveFill(layer + 1, subBoard[i], skippedX * 3 + i % 3, skippedY * 3 + div(i, 3), i)
        }
    }
    timesRun = 0
    return starti
}
//

function zoomedRecursion(subBoard) {
    recursiveFill(1, subBoard)
}

function div(x, y) {
    return Math.floor(x / y)
}

function fillSpace(layer, skippedX, skippedY, subCellPos, colour) {

    let layerWidth = getLayerWidth(layer)
    let startx = gridToCoords(layer, subCellPos % 3)
    let starty = gridToCoords(layer, null, div(subCellPos, 3))
    startx += gridToCoords(layer - 1, skippedX)
    starty += gridToCoords(layer - 1, null, skippedY)
    context.fillStyle = colour;

    context.fillRect(startx, starty, layerWidth, layerWidth);


}

function showLockedGrids() {
    for (i = 0; i < 9; i++) {
        if (i === lastMove.at(-1)) {
            i++
        }
        context.fillStyle = "rgba(0,0,0,0.3)"
        context.fillRect(...posToCoords(0, i), 300, 300)
    }
}

function highlightCell(e) {

    if (window.matchMedia("(pointer: coarse)").matches) { // detects mobile users for better experience
        return
    }


    context.fillStyle = 'rgba(10,220,20,0.3)';

    context.fillRect(highlightedCell[0], highlightedCell[1], 297, 297);


}

function selectHighlightedCell(e) {
    highlightedCell = [gridToCoords(1, findMetaCellClicked(e) % 3), gridToCoords(1, Math.floor(findMetaCellClicked(e) / 3))]
}

function handleClicks(e) {
    let cell = findMetaCellClicked(e)

    if (!(canActHere(cell) || selecting)) {
        return
    }

    // print((cell))

    if (won === -1) {
        return handleMove(cell)
    }
    //when won has been set and therefore the game has concluded


}

function handleMove(metaCell) {

    if (currBoard[metaCell] === -1) { //empty normal cell
        if (selecting > 0) { //if a player has won
            currMoves.push(metaCell)
            if (currMoves.length > maxDepth) {
                currMoves.pop()
                return 1
            }
            currMaxLayer += currMoves.length > currMaxLayer
            upgradedCells.push(currMoves)
            setSelecting(selecting - 1)
            regenerateBoard()
            return 1
        }
        currBoard[metaCell] = currPlayer
        currPlayer += 1
        currPlayer %= players
            //checkWin()
        saveBoard(0, metaCell)
    } else if (typeof(currBoard[metaCell]) !== "number") { // any grid
        currBoard = currBoard[metaCell]
        currLayer++
        currMoves.push(metaCell)
    }
}



function saveBoard(iters = 0, moveMade) {
    if (checkWin(iters) !== -1) {
        let winner = checkWin(iters)
        let temp1 = getBoardZoomed(iters + 1)
        temp1[currMoves.at(-iters - 1)] = winner
        if (iters < currMoves.length) {
            return saveBoard(iters + 1, moveMade)
        }

        //we are at the highest level so set the winner

        if (checkWin() !== -1) {
            won = winningCell
            setSelecting(1)
            setTimeout(() => {
                won = -1;
                regenerateBoard()
                print("abacus")
            }, 1500)
        }

    }
    if (iters === 0) {
        let boardUpdateString = getBoardZoomed(0, true) + " = currBoard"
        eval(boardUpdateString)
    }
    currBoard = [...board]
    currLayer = 1
    currMoves.push(moveMade)
    lastMove = JSON.parse(JSON.stringify(currMoves))
    if (typeof(board[lastMove.at(-1)]) === "object") {
        displyingLocks = true
    }
    else{
        displayingLocks = false}
    currMoves = []
    if (checkWin() !== -1) {
        won = checkWin()
        setTimeout(() => {
            won = -1;
            regenerateBoard();
            setSelecting(1)
        }, 1500)
    }
    return

}

function checkWin(layersUp = 0) {


    let checkBoard = getBoardZoomed(layersUp)


    for (i = 0; i < 3; i++) {
        if (checkBoard[i] === checkBoard[i + 3] && checkBoard[i] === checkBoard[i + 6] && typeof(checkBoard[i]) == "number" && checkBoard[i] !== -1) {
            return checkBoard[i]
        }
    }
    for (i = 0; i < 9; i += 3) {
        if (checkBoard[i] === checkBoard[i + 1] && checkBoard[i] === checkBoard[i + 2] && typeof(checkBoard[i]) == "number" && checkBoard[i] !== -1) {
            return checkBoard[i]
        }
    }

    if (checkBoard[0] === checkBoard[4] && checkBoard[0] === checkBoard[8] && typeof(checkBoard[0]) == "number" && checkBoard[0] !== -1) {
        return checkBoard[0]
    }
    if (checkBoard[2] === checkBoard[4] && checkBoard[2] === checkBoard[6] && typeof(checkBoard[2]) == "number" && checkBoard[2] !== -1) {
        return checkBoard[2]
    }
    staleMate = 1

    for (i = 0; i < 9; i++) {
        if (!(board[i] !== -1 && typeof(board[i]) === "number")) {
            //occurs when there is at least one cell that is a subGrid or empty and therefore can be played

            staleMate = 0


        }
    }
    if (staleMate) {
        regenerateBoard()
        saveBoard(0, null)
    }
    return -1
}

function getBoardZoomed(offset = 0, raw = false) { // takes all the indices to find the current board given the 'currMoves' array
    let temp = "board"
    for (i = 0; i < currMoves.length - offset; i++) { // offset useful for changing a board a level out without changing the currMoves
        temp += "[" + currMoves[i] + "]"
    }
    return raw ? temp : eval(temp)

}

function zoomOut() {
    currMoves.pop()
    currBoard = getBoardZoomed()
}

function regenerateBoard() {
    board = createLayeredBoard(startLayers)
    for (i = 0; i < upgradedCells.length; i++) {

        let temp = "board"
        for (j = 0; j < upgradedCells[i].length; j++) { // offset useful for changing a board a level out without changing the currMoves
            temp += "[" + upgradedCells[i][j] + "]"
        }
        eval(temp + "= [-1,-1,-1,-1,-1,-1,-1,-1,-1]")
    }
    currLayer = 1
    currMoves = []
    lastMove = []
    currBoard = JSON.parse(JSON.stringify(board))
    currPlayer = 0

}

canvas.addEventListener("mousemove", selectHighlightedCell)
canvas.addEventListener("mouseup", handleClicks)
window.addEventListener("keypress", (e) => { if (e.key == "Enter") { zoomOut() } })
canvas.addEventListener("mouseleave", () => { highlightedCell = [900, 900] })

function canActHere(metaCell) {
    switch (ruleSet) {
        case 0:
            return true
        case 1:
            if (typeof(board[lastMove.at(-1)]) === "object" && currLayer === 1) {
                return metaCell === lastMove.at(-1)
            }
            return true


    }
}


regenerateBoard()
    // board = [
    //     [-1, -1, -1, -1, -1, -1, -1, -1, -1],
    //     [-1, 1, -1, 1, 1, -1, 1, -1, -1], 0, [-1, -1, -1, 1, -1, -1, -1, -1, -1],
    //     [-1, -1, -1, -1, 1, -1, -1, -1, -1], 0, [-1, -1, -1, -1, -1, -1, 1, -1, -1],
    //     [-1, -1, -1, -1, 1, -1, -1, -1, -1],
    //     [-1, -1, 0, -1, -1, -1, -1, -1, 0]
    // ]

currBoard = [...board]
setInterval(update, 25)

function generateSaveGame() {
    regenerateBoard()
    document.getElementById("iosave").value = JSON.stringify(board) + JSON.stringify([maxDepth, players, startLayers, ruleSet])
}

function saveGameToLocal() {
    localStorage.setItem(savingName, JSON.stringify([upgradedCells, [maxDepth, players, startLayers, ruleSet]]))
}

function setValue(id, value) {
    document.getElementById(id).value = value
}

function loadGameFromLocal() {
    let saveFile = JSON.parse(localStorage.getItem(loadingName))
    maxDepth = saveFile[1][0]
    setValue("mdRange", saveFile[1][0])
    players = saveFile[1][1]
    startLayers = saveFile[1][2]
    setValue("startDepthRange", saveFile[1][2])
    ruleSet = saveFile[1][3]
    upgradedCells = saveFile[0]
    regenerateBoard()
}

function populateSaveNames() {
    let names = Object.keys(localStorage)

    for (i = 0; i < names.length; i++) {
        addOptionTagToSelect(names[i])
    }
}

function addOptionTagToSelect(value) {
    if (value == "debug") {
        return
    }

    let temp = document.createElement("option")
    temp.value = value
    temp.innerHTML = value
    document.getElementsByTagName("select")[0].appendChild(temp)
}

populateSaveNames()
