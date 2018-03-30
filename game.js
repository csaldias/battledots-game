//Initialise the Kiwi Game. 
var gameOptions = {
	width: 1000,
	height: 750
}
var myGame = new Kiwi.Game('content', 'myGame', null, gameOptions);

var myState = new Kiwi.State( "myState" );

// variables to customize the game

var tileSize = 64;				// tile size, in pixels
var fieldSize = 7;     			// number of tiles per row/column
var tileTypes = 3;				// different kind of tiles allowed
var pickedZoom = 1.3;              // zoom ratio to highlight picked tile

// variables used by game engine

var dragging = false;			// are we dragging?
var movingRow;					// row of the moving tile
var movingCol;					// col of the moving tile
var originX;
var originY;
var landingX;
var landingY;
var dotArray = [];				// array with all game tiles
var posArray = [];
var dotGroup; 				// group containing all tiles
var movingDotGroup;               // group containing the moving tile
var currentPlayer = 1; //State variable, current player
var availableMov = 3; //State variavle, amount of movements left

myState.preload = function () {
  this.game.stage.setRGBColor(255, 255, 255);
  Kiwi.State.prototype.preload.call(this);
  this.addSpriteSheet( 'dotSprite', 'dotsSheet_sq.png', 64, 64);
}

myState.create = function(){
  Kiwi.State.prototype.create.call( this );

  //Lets find the center coordinate of the dot matrix
  var center_x = (tileSize * fieldSize) / 2;
  var center_y = (tileSize * fieldSize) / 2;

  this.currPlayer = new Kiwi.GameObjects.Textfield(this, "Jugador "+currentPlayer.toString(), 600, 100, fontsize = 16);
  this.moves = new Kiwi.GameObjects.Textfield(this, "Te quedan "+availableMov.toString()+" movimientos", 600, 150, fontsize = 16);
  this.addChild(this.currPlayer);
  this.addChild(this.moves);

  for(i=0;i<fieldSize;i++){
		dotArray[i] = [];
    posArray[i] = [];
		for(j=0;j<fieldSize;j++){
			var randomTile = 0;
      if (i == 0 && j == 0) {
        randomTile = 2;
      } else if (i == fieldSize-1 && j == fieldSize-1) {
        randomTile = 1;
      }
      var position_x = (j * tileSize) - center_x;
      var position_y = (i * tileSize) - center_y;

      var transformed_y = position_x * 0.707107 + position_y * 0.707107;
      var transformed_x = position_y * 0.707107 - position_x * 0.707107;

			var theTile=new Kiwi.GameObjects.Sprite(this, this.textures["dotSprite"], transformed_x + center_x + 50, transformed_y + center_y + 100);
			theTile.centerAnchorPoint();
      theTile.animation.switchTo(randomTile);
      theTile.rotation = Math.PI/4;
			this.addChild(theTile);
			dotArray[i][j]=theTile;
      posArray[i][j] = {x:dotArray[i][j].x, y:dotArray[i][j].y};
      //console.log("Position of ("+i.toString()+","+j.toString()+"):", dotArray[i][j].x, dotArray[i][j].y);
		}
	}
	this.game.input.onDown.add(pickDot);
}

function pickDot(inputX, inputY){
  // save input coordinates
	startX = inputX;
	startY = inputY;
	// retrieve picked row and column
  // We'll have to look for them by iterating over the whole matrix
  for(i=0;i<fieldSize;i++){
    for(j=0;j<fieldSize;j++){
      var centerX = dotArray[i][j].x + 32;
      var centerY = dotArray[i][j].y + 32;

      var transformed_inputY = (inputX - centerX) * 0.707107 + (inputY - centerY) * 0.707107;
      var transformed_inputX = (inputY - centerY) * 0.707107 - (inputX - centerX) * 0.707107;

      //console.log("Relative mouse coordinates from ("+i.toString()+","+j.toString()+"):", transformed_inputX, transformed_inputY);
      //console.log("Anchor point of ("+i.toString()+","+j.toString()+"):", centerX, centerY);

      if ((Math.abs(transformed_inputX) <= 32) && (Math.abs(transformed_inputY) <= 32)) {
        movingRow = i;
        movingCol = j;
        originX = dotArray[i][j].x;
        originY = dotArray[i][j].y;
      }
    }
  }
  
  console.log("The selected pick location is ", movingRow, movingCol);
	// zoom the tile
	dotArray[movingRow][movingCol].scaleToWidth(tileSize*pickedZoom);
	dotArray[movingRow][movingCol].scaleToHeight(tileSize*pickedZoom);
  // moving the tile in front of the stage

	myState.swapChildren(dotArray[movingRow][movingCol],myState.getChildAt(myState.numChildren()-1));
	myState.game.input.onDown.remove(pickDot);
	myState.game.input.onUp.add(releaseDot);
	dragging=true;
}

function releaseDot(){
  // remove the listener
  myState.game.input.onUp.remove(releaseDot);

  var inputX = dotArray[movingRow][movingCol].x + 32;
  var inputY = dotArray[movingRow][movingCol].y + 32;

	// determine landing row and column
  for(i=0;i<fieldSize;i++){
    for(j=0;j<fieldSize;j++){
      var centerX = dotArray[i][j].x + 32;
      var centerY = dotArray[i][j].y + 32;

      var transformed_releaseY = (inputX - centerX) * 0.707107 + (inputY - centerY) * 0.707107;
      var transformed_releaseX = (inputY - centerY) * 0.707107 - (inputX - centerX) * 0.707107;

      //console.log("Relative mouse coordinates from ("+i.toString()+","+j.toString()+"):", transformed_releaseX, transformed_releaseY);
      //console.log("Anchor point of ("+i.toString()+","+j.toString()+"):", centerX, centerY);

      //HACK: Por alguna razón, la posición de inicio queda como (0,0). Debemos saltarnos eso.
      if (transformed_releaseX == 0 && transformed_releaseY == 0) {continue;}

      if ((Math.abs(transformed_releaseX) <= 32) && (Math.abs(transformed_releaseY) <= 32)) {
        //console.log("Picked:", i, j);
        var landingRow = i;
        var landingCol = j;
        landingX = posArray[i][j].x;
        landingY = posArray[i][j].y;

        //HACK: Apenas encontramos una posición de llegada, nos vamos.
        i = fieldSize;
        j = fieldSize;
      }
    }
  }
  //console.log("Absolute mouse coordinates are:", inputX, inputY);
  console.log("The selected release location is ", landingRow, landingCol);
	//var landingRow = Math.floor((dotArray[movingRow][movingCol].y+tileSize/2)/tileSize);
	//var landingCol = Math.floor((dotArray[movingRow][movingCol].x+tileSize/2)/tileSize);
	// reset the moving tile to its original size
	dotArray[movingRow][movingCol].scaleToWidth(tileSize);
  dotArray[movingRow][movingCol].scaleToWidth(tileSize);
          
  //First, we need to check if we have available movements
  var total_mov = Math.abs(movingRow - landingRow) + Math.abs(movingCol - landingCol);
  console.log("Play requires "+total_mov.toString()+" moves.");
  //Are they enough?
  if (total_mov <= availableMov) {
    //Discount from available moves
    availableMov = availableMov - total_mov;
    myState.moves.text = "Te quedan "+availableMov.toString()+" movimientos";
  } else {
    //If we dont have available moves, we dont move the piece
    landingRow = movingRow;
    landingCol = movingCol;

    landingX = originX;
    landingY = originY;
  }
	// swap tiles, both visually and in tileArray array...
	dotArray[movingRow][movingCol].x=landingX;
	dotArray[movingRow][movingCol].y=landingY;
	if(movingRow!=landingRow || movingCol!=landingCol){
    // but only if you actually moved a tile
    myState.swapChildren(dotArray[landingRow][landingCol],myState.getChildAt(myState.numChildren()-1));
		var moveTween = myState.game.tweens.create(dotArray[landingRow][landingCol]);
    moveTween.to({x: originX, y: originY}, 800, Kiwi.Animations.Tweens.Easing.Exponential.Out);
    moveTween.start();
    moveTween.onComplete(function(){
      var temp = dotArray[landingRow][landingCol];
      dotArray[landingRow][landingCol] = dotArray[movingRow][movingCol];
      dotArray[movingRow][movingCol] = temp;
    })
  }
	// we aren't dragging anymore
  dragging = false;
  myState.game.input.onDown.add(pickDot);
  
  if (currentPlayer == 1 && availableMov == 0) {
    currentPlayer = 2;
    availableMov = Math.floor(Math.random() * 3) + 1;
  } else if (currentPlayer == 2 && availableMov == 0) {
    currentPlayer = 1;
    availableMov = Math.floor(Math.random() * 3) + 1;
  }
  myState.currPlayer.text = "Jugador "+currentPlayer.toString();
  myState.moves.text = "Te quedan "+availableMov.toString()+" movimientos";
}

myState.update = function(){
  // if we are dragging a tile
	if(dragging){
		// check x and y distance from starting to current input location
		distX = this.game.input.x-startX;
    distY = this.game.input.y-startY;
    // move the tile
    dotArray[movingRow][movingCol].x=originX+distX;
    dotArray[movingRow][movingCol].y=originY+distY;
	}
}
        
myGame.states.addState(myState, true);