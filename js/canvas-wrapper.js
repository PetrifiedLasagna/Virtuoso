"use strict";

function tRGB(red, green, blue){
  return {r: red, g: green, b: blue};
}

function getString(color){
  return "rgb(" + color.r + "," + color.g + "," + color.b + ")";
}

function colorEquals(col1, col2){
  return col1.r == col2.r && col1.g == col2.g && col1.b == col2.b;
}

class GfxEngine{
  constructor(id){
    this.canvas = document.getElementById(id);
    this.buffer = document.createElement("canvas");

    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.buffer.width = this.width;
    this.buffer.height = this.height;

    this.context = this.canvas.getContext("2d");
    this.contextB = this.buffer.getContext("2d");
    this.currentState = {
                         strokeStyle: "rgb(0,0,0)",
                         fillStyle: "rgb(0,0,0)"
                        };
    this.contextB.strokeStyle = this.currentState.strokeStyle;
    this.contextB.fillStyle = this.currentState.fillStyle;
  }

  drawRect(x, y, width, height, lineColor){
    var style = getString(lineColor);

    if(style != this.currentState.strokeStyle){
      this.contextB.strokeStyle = style;
      this.currentState.strokeStyle = style;
    }

    this.contextB.strokeRect(x, y, width, height);
  }

  fillRect(x, y, width, height, bgColor){
    var style = getString(bgColor);

    if(style != this.currentState.fillStyle){
      this.contextB.fillStyle = style;
      this.currentState.fillStyle = style;
    }

    this.contextB.fillRect(x, y, width, height);
  }

  clearRect(x, y, width, height){
    this.contextB.clearRect(x, y, width, height);
  }

  clearScreen(){
    this.contextB.clearRect(0, 0, this.width, this.height);
  }

  setDrawMode(mode){
    this.contextB.globalCompositeOperation = mode;
  }

  swapBuffers(){
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.drawImage(this.buffer, 0, 0);
  }
}
