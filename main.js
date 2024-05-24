const canvas = document.getElementById("Canvas")
const context = canvas.getContext('2d');

print("a")

const baseWidth = 891
context.strokeStyle='black';


canvas.setAttribute("width", baseWidth)
canvas.setAttribute("height", baseWidth)

const maxDepth = 4
const players = 2 //max 8
const useThreshold = 0
const threshold = 0.51
let highlightedCell = [900,900]
let currPlayer = 0

let board = []
let currBoard = []
let currLayer = 1
let currSkipped = []

const colours = ["red", "blue", "pink", "orange", "grey", "magenta", "purple", "lime"]

const gridColours = [null, "red", "blue", "green", "magenta", "black"]

function createBasicBoard(){
    return [-1,-1,-1,-1,-1,-1,-1,-1,-1]
}
function createUltra1Board(){
    board = [[[-1,-1,-1,-1,-1,-1,-1,-1,-1],-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1]]
  return board
}

function createUltra2Board(){
  createUltra1Board()
  for(i=0;i<27;i++){
    board[div(i,9)][i%9] = createBasicBoard()
  }
}

//createBasicBoard()

function getLayerWidth(layer){
    return baseWidth / (3**layer)
}

function drawGrid(boundx = 0, boundy =0 , layer = 1){
    let layerWidth = getLayerWidth(layer)
    let startx = gridToCoords(layer-1, boundx)
    let starty =  gridToCoords(layer-1,null, boundy)
    context.beginPath();    
    context.strokeStyle = gridColours[layer]
    
    for(i=1;i<3;i++){
        context.moveTo(startx+layerWidth*i, starty);
        context.lineTo(startx+layerWidth*i, starty+layerWidth*3);
    }
    for(i=1;i<3;i++){

        context.moveTo(startx, starty+layerWidth*i);
        context.lineTo(startx+layerWidth*3, starty+layerWidth*i);
        
    }
   context.stroke();
    
}

function recursiveGrid(layer, subboard,position, starti){
    // debugger
    drawGrid(position[0], position[1], layer)
    for(i=0;i<9;i++){
        if(typeof(subboard[i]) == "object"){
            i =recursiveGrid(layer+1, subboard[i], [position[0]*3+i%3, position[1]*3+div(i,3)], i)
        }
    }
    return starti
}

//drawGrid()



function gridToCoords(layer,x=null,y=null){
    let layerWidth = getLayerWidth(layer)
    if(x==null){
        return y*layerWidth
    }
    return x*layerWidth
}
function posToCoords(layer, position){
    return [gridToCoords(layer, position%(3**layer)), gridToCoords(layer, 0, Math.floor(position/(3**layer)))]
}

function findMetaCellClicked(e){
    let x = e.clientX
    let y = e.clientY
    let cell, celloff;
    if( x < baseWidth/3){
        celloff = 0
    } else if(x < 2*baseWidth/3){
        celloff = 1
    }
    else{
        celloff = 2
    }

    if( y < baseWidth/3){
        cell = 0
    } else if(y < 2*baseWidth/3){
        cell = 3
    }
    else{
        cell = 6
    }
    return cell + celloff
}


function update(){
    context.clearRect(0, 0,baseWidth,baseWidth);
    
    zoomedRecursion(currBoard)

    recursiveGrid(1, currBoard, [0,0], 0)

    for(i=0;i<9;i++){
    //    drawGrid(i%3, div(i,3), 2)
    }
    
    highlightCell()
}

let timesRun = 0



function recursiveFill(layer, subBoard, skippedX = 0, skippedY = 0, starti){
    timesRun++
    for(i=0; i<9; i++){
        if(typeof(subBoard[i])=="number"){
            if(subBoard[i] >=0){ // if the cell is colouredw
                fillSpace(layer, skippedX, skippedY, i, colours[subBoard[i]])
            }
        }else{ // happens when an array which indicates a sub-board
            i = recursiveFill(layer+1, subBoard[i], skippedX*3+i%3, skippedY*3+div(i,3), i)
        }
    }
    timesRun= 0
    return starti
}
//

function zoomedRecursion(subBoard){
    recursiveFill(1, subBoard)
}

function div(x,y){
    return Math.floor(x/y)
}

function fillSpace(layer, skippedX, skippedY, subCellPos, colour){

    let layerWidth = getLayerWidth(layer)
    let startx = gridToCoords(layer, subCellPos%3)
    let starty = gridToCoords(layer, null, div(subCellPos,3))
    startx += gridToCoords(layer-1, skippedX)
    starty += gridToCoords(layer-1, null, skippedY)
    context.fillStyle=colour;
    
    context.fillRect(startx, starty, layerWidth, layerWidth);
    
    
}

function highlightCell(e){    
    context.fillStyle='green';
    
    context.fillRect(highlightedCell[0], highlightedCell[1], 297,297);
    
}

function selectHighlightedCell(e){
    highlightedCell = [gridToCoords(1, findMetaCellClicked(e)%3),gridToCoords(1, Math.floor(findMetaCellClicked(e)/3))]
}

function handleClicks(e){
    let cell = findMetaCellClicked(e)
    //print((cell))

    handleMove(cell)    

}

function handleMove(metaCell){
    
    if(currBoard[metaCell] === -1){  //empty normal cell
        currBoard[metaCell] = currPlayer
        currPlayer += 1
        currPlayer %= players
        //checkWin()
        saveBoard(  )
    }else if(currBoard[metaCell]!==-1){ // any grid
        currBoard = currBoard[metaCell]
        currLayer++
        currSkipped.push(metaCell)
    }
}



function saveBoard(){
    while(checkWin() !== -1){
        saveWin(winningPlayer)
        currBoard = [...board]
    }
    
    currLayer = 1
    currSkipped = []
}

function saveWin(winningPlayer){   
    let temp = "board"
    for(i=0;i<currSkipped.length;i++){
        temp+= "["+currSkipped[i]+"]"
    }
    temp += " = " + checkWin()
    eval(temp)
}

function checkWin(){
    // debugger
    for(i=0;i<3;i++){
        if(currBoard[i]===currBoard[i+3] && currBoard[i] === currBoard[i+6] && typeof(currBoard[i]) == "number" && currBoard[i]!==-1){
            return currBoard[i]
        }
    }
    for(i=0;i<3;i+=3){
        if(currBoard[i]===currBoard[i+1] && currBoard[i] === currBoard[i+2] && typeof(currBoard[i]) == "number"&& currBoard[i]!==-1){
            return currBoard[i]
        }
    }

    if(currBoard[0]===currBoard[4] && currBoard[0] === currBoard[8] && typeof(currBoard[0]) == "number"&& currBoard[0]!==-1){
        //print("diag tl")
        return currBoard[0]
    }
    if(currBoard[2]===currBoard[4] && currBoard[2] === currBoard[6] && typeof(currBoard[2]) == "number"&& currBoard[2]!==-1){
        //print("diag tr")
        return currBoard[2]
    }
    return -1
}



canvas.addEventListener("mousemove", selectHighlightedCell)
canvas.addEventListener("mouseup", handleClicks)
canvas.addEventListener("mouseleave", ()=>{highlightedCell=[900,900]})



createUltra1Board()
currBoard = [...board]
setInterval(update, 25)
