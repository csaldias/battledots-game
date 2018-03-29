var myGame = new Kiwi.Game();

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

myGame.states.addState(myState, true);

myState.preload = function () {
  this.game.stage.setRGBColor(255, 255, 255);
  Kiwi.State.prototype.preload.call(this);
  this.addSpriteSheet( 'dotSprite', 'dotsSheet.png', 64, 64);
}

myState.create = function(){
    Kiwi.State.prototype.create.call( this );

    //Lets find the center coordinate of the dot matrix
    var center_x = (tileSize * fieldSize) / 2;
    var center_y = (tileSize * fieldSize) / 2;

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
              //var theTile=new Kiwi.GameObjects.Sprite(this, this.textures["dotSprite"], j * tileSize, i * tileSize );
							theTile.centerAnchorPoint();
							theTile.animation.switchTo(randomTile);
							this.addChild(theTile);
							dotArray[i][j]=theTile;
              posArray[i][j] = {x:dotArray[i][j].x, y:dotArray[i][j].y};
              console.log(dotArray[i][j].x, dotArray[i][j].y);
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
              if ((dotArray[i][j].x < startX && startX < dotArray[i][j].x + 64) && (dotArray[i][j].y < startY && startY < dotArray[i][j].y + 64)) {
                movingRow = i;
                movingCol = j;
                originX = dotArray[i][j].x;
                originY = dotArray[i][j].y;
              }
            }
          }
          console.log("The selected pick location is ", movingRow, movingCol);
					//movingRow = Math.floor(startY/tileSize);
					//movingCol = Math.floor(startX/tileSize);
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
					// determine landing row and column
          for(i=0;i<fieldSize;i++){
            for(j=0;j<fieldSize;j++){
              if ((posArray[i][j].x < dotArray[movingRow][movingCol].x && dotArray[movingRow][movingCol].x < posArray[i][j].x + 64) && (posArray[i][j].y < dotArray[movingRow][movingCol].y && dotArray[movingRow][movingCol].y < posArray[i][j].y + 64)) {
                var landingRow = i;
                var landingCol = j;
                landingX = posArray[i][j].x;
                landingY = posArray[i][j].y;
              }
            }
          }
          console.log("The selected release location is ", landingRow, landingCol);
					//var landingRow = Math.floor((dotArray[movingRow][movingCol].y+tileSize/2)/tileSize);
					//var landingCol = Math.floor((dotArray[movingRow][movingCol].x+tileSize/2)/tileSize);
					// reset the moving tile to its original size
					dotArray[movingRow][movingCol].scaleToWidth(tileSize);
					dotArray[movingRow][movingCol].scaleToWidth(tileSize);
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
              myState.game.input.onDown.add(pickDot);
            })
          }
					// we aren't dragging anymore
					dragging = false;
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