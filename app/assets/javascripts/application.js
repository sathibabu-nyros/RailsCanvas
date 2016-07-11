// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require angular
//= require angular-animate
//= require angular-resource
//= require bootstrap-sprockets
//= require home
//= require_tree .





var app = angular.module("testapp", []); 
app.controller('MainCtrl', function($scope, $http,$rootScope) {


});

  app.directive("canvas",function($http) {
    return{
      restrict: "A",
      link: function(scope, element){
        var canvas = element[0];
        var ctx = canvas.getContext('2d');
        var shapes = [],
        Data,
        ID = 0,
        drag = false,
        mouseX,
        mouseY,
        closeEnough = 10,
        dragTL = dragBL = dragTR = dragBR = false;


      
function Shape(x, y, w, h,r,s,id) {
  // This is a very simple and unsafe constructor. All we're doing is checking if the values exist.
  // "x || 0" just means "if there is a value for x, use that. Otherwise use 0."
  // But we aren't checking anything else! We could put "Lalala" for the value of x 
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 1;
  this.h = h || 1;
  this.r = r || 1;
  this.s = s || null;
  this.id = id || 0;
  this.fill =  '#222222';
}

// Draws this shape to a given context
Shape.prototype.draw = function(ctx) {
  ctx.fillStyle = this.fill;
  if(this.s == 'circle'){
       ctx.beginPath();
       ctx.arc(this.x, this.y, this.r, 0, Math.PI*2, true);
       ctx.fill();
  }else if(this.s == 'rect'){
      ctx.fillRect(this.x, this.y, this.w, this.h);
  }else{
     ctx.font = "14px Arial";
     ctx.fillText("some text here",this.x,this.y);
  }
}

// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Width) and its Y and (Y + Height)
  return  (this.x <= mx) && (this.x + this.w - 15 >= mx) &&
          (this.y <= my) && (this.y + this.h - 15 >= my);
}


// Determine if a point is corner of the shape's bounds
Shape.prototype.corners = function(mx, my) {
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Width) and its Y and (Y + Height)
  return  (mx >= this.x + this.w - 15) && (this.x + this.w  >= mx) &&
          (my >= this.y + this.h - 15)  && (this.y + this.h >= my);
}

function CanvasState(canvas) {
  // **** First some setup! ****
  
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****
  
  this.valid = false; // when set to false, the canvas will redraw everything
  this.shapes = [];  // the collection of things to be drawn
  this.dragging = false; // Keep track of when we are dragging
  // the current selected object. In the future we could turn this into an array for multiple selection
  this.selection = null;
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
  this.dragoffy = 0;
  
  // **** Then events! ****
  
  // This is an example of a closure!
  // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
  // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
  // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
  // This is our reference!
  var myState = this;
  
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  // Up, down, and move are for dragging
  canvas.addEventListener('mousedown', function(e) {
    var mouse = myState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var shapes = myState.shapes;
    var l = shapes.length;
    for (var i = l-1; i >= 0; i--) {


      // for dragging
      if (shapes[i].contains(mx, my)) {
        var mySel = shapes[i];
        // Keep track of where in the object we clicked
        // so we can move it smoothly (see mousemove)
        myState.dragoffx = mx - mySel.x;
        myState.dragoffy = my - mySel.y;
        myState.dragging = true;
        myState.resize = false;
        myState.selection = mySel;
        myState.valid = false;
        return;
      }


      // for resize
      if (shapes[i].corners(mx, my)) {
        var mySel = shapes[i];
        // Keep track of where in the object we clicked
        // so we can move it smoothly (see mousemove)
        myState.dragoffx = mx - mySel.x;
        myState.dragoffy = my - mySel.y;
        myState.resize = true;
        myState.dragging = false;
        myState.selection = mySel;
        myState.valid = false;
        return;
      }

    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    if (myState.selection) {
      myState.selection = null;
      myState.valid = false; // Need to clear the old selection border
    }
  }, true);
  canvas.addEventListener('mousemove', function(e) {
    if (myState.dragging){
      var mouse = myState.getMouse(e);
      // We don't want to drag the object by its top-left corner, we want to drag it
      // from where we clicked. Thats why we saved the offset and use it here
      myState.selection.x = mouse.x - myState.dragoffx;
      myState.selection.y = mouse.y - myState.dragoffy;   
      myState.valid = false; // Something's dragging so we must redraw
    }


     if (myState.resize){
      var mouse = myState.getMouse(e);
      // We don't want to drag the object by its top-left corner, we want to drag it
      // from where we clicked. Thats why we saved the offset and use it here
      myState.selection.w = Math.abs(myState.selection.x - mouse.x) 
      // mouse.x - myState.dragoffx;
      myState.selection.h = Math.abs(myState.selection.y - mouse.y) 
      myState.valid = false; // Something's dragging so we must redraw
    }



  }, true);
  canvas.addEventListener('mouseup', function(e) {
    myState.dragging = false;
    myState.resize = false;


    // update dimensions of shapes
     var data = $.param({
          x: myState.selection.x,
          y: myState.selection.y,
          w: myState.selection.w,
          h: myState.selection.h,
          r: myState.selection.r,         
          id: myState.selection.id
      });
    var config = {
        headers : {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
    }


   
    $http.put('/usershapes', data, config)
    .success(function (data, status, headers, config) {
      window.location.reload();
    })
    .error(function (data, status, header, config) {
    });


  }, true);
 
  
  // **** Options! ****
  
  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;  
  this.interval = 30;
  setInterval(function() { myState.draw(); }, myState.interval);
}

CanvasState.prototype.addShape = function(shape) {
  this.shapes.push(shape);
  this.valid = false;
}

CanvasState.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function() {
  // if our state is invalid, redraw and validate!
  if (!this.valid) {
    var ctx = this.ctx;
    var shapes = this.shapes;
    this.clear();
    
    // ** Add stuff you want drawn in the background all the time here **
    
    // draw all shapes
    var l = shapes.length;
    for (var i = 0; i < l; i++) {
      var shape = shapes[i];
      // We can skip the drawing of elements that have moved off the screen:
      if (shape.x > this.width || shape.y > this.height ||
          shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
      shapes[i].draw(ctx);
    }
    
    // draw selection
    // right now this is just a stroke along the edge of the selected Shape
    if (this.selection != null) {
      ctx.strokeStyle = this.selectionColor;
      ctx.lineWidth = this.selectionWidth;
      var mySel = this.selection;
      ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
       // if(mySel.s == 'circle'){
       //   // ctx.stroke(mySel.x,mySel.y,mySel.r);
       // }else{
       //   ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
       // }
     

    }
    
    // ** Add stuff you want drawn on top all the time here **
    
    this.valid = true;
  }
}


// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
CanvasState.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  
  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;
  
  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
}

// If you dont want to use <body onLoad='init()'>
// You could uncomment this init() reference and place the script reference inside the body tag
init();
var s;
function init() {
   s = new CanvasState(document.getElementById('graphCanvas'));
}
  
       
       
       
        // resize events ends

        // get current user shapes
        $http.get('/usershapes')
        .success(function (value, status, headers, config) {  
              angular.forEach(value, function(res, key) {

                // console.log(value);
                shapes.push({
                    id: res['id'],
                    startX: res['x'],
                    startY: res['y'],
                    w: res['w'],
                    h: res['h'],
                    shape: res['shape']['name'],
                    text: res['text']
               });

              s.addShape(new Shape(res['x'],res['y'],res['w'],res['h'],res['r'],res['shape']['name'],res['id']));

              // draw_first(res['x'],res['y'],res['w'],res['h'],res['r'],res['shape']['name']);
              
            });

               // draw();
            
        })
        .error(function (data, status, header, config) {
        });



        // create user shapes
        var canvasLeft = canvas.offsetLeft;
        var canvasTop = canvas.offsetTop;
        var dragok = false;
        canvas.ondrop = drop;
        canvas.ondragover = allowDrop;

        var rectang = document.getElementById("rect");
        rectang.onmousedown = mousedown;
        rectang.ondragstart = dragstart;


        // circle
        var circ = document.getElementById("circle");
        circ.onmousedown = mousedown;
        circ.ondragstart = dragstart;


        // Text
         // circle
        var text = document.getElementById("text");
        text.onmousedown = mousedown;
        text.ondragstart = dragstart;

        // var x = 75;
        // var y = 50;
        var WIDTH = 400;
        var HEIGHT = 300;


          // this is the mouse position within the drag element
          var startOffsetX, startOffsetY;

          function allowDrop(ev) {
              ev.preventDefault();
          }

          function mousedown(ev) {
              startOffsetX = ev.offsetX;
              startOffsetY = ev.offsetY;
          }

          function dragstart(ev) {
              ev.dataTransfer.setData("Text", ev.target.id);
          }


          function new_rect(x,y,w,h) {
           ctx.beginPath();
           ctx.rect(x,y,w,h,'id');
           ctx.closePath();
           ctx.fill();
          }

            //draw a circle
          function new_circle(x,y,r) {          
            ctx.beginPath();
            ctx.arc(x + 10, y + 10, r, 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.fill();
          }


          // draw text
          function new_text(x,y) {
           ctx.font = "14px Arial";
           ctx.fillText("some text here",x,y);
          }



          function clear() {
           ctx.clearRect(0, 0, WIDTH, HEIGHT);
          }

          
          function draw_first(x,y,w,h,r,s) {
             if(s == 'rect'){
                ctx.fillStyle = "#222222";
                new_rect(x , y , w, h);
             }else if(s == 'circle'){
                ctx.fillStyle = "#222222";
                new_circle(x, y,r);
             }else if(s == 'text'){
                new_text(x , y <= 0 ? (y + 300) : y);
             } else {
                
             }
          }

          function drop(ev) {
              ev.preventDefault();
              var dropX = ev.clientX - canvasLeft - startOffsetX;
              var dropY = ev.clientY - canvasTop - startOffsetY;
              var id = ev.dataTransfer.getData("Text");
              var dropElement = document.getElementById(id);
             
              // draw the drag image at the drop coordinates
              draw_first(dropX, dropY, 100,100,50,dropElement.id);
          }


          canvas.addEventListener(
          'drop',
          function(ev) {       


              ev.preventDefault();
              var dropX = ev.clientX - canvasLeft - startOffsetX;
              var dropY = ev.clientY - canvasTop - startOffsetY;
              var id = ev.dataTransfer.getData("Text");
              var dropElement = document.getElementById(id);



                var data = $.param({
                    x: dropX,
                    y: dropElement.id == 'text' ? (dropY + 300): dropY,
                    shape: dropElement.id
                });
                var config = {
                    headers : {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                    }
                }


                 $http.post('/usershapes', data, config)
                      .success(function (data, status, headers, config) {
                           window.location.reload();
                      })
                      .error(function (data, status, header, config) {
                      });
                return false;
          },
          false
        );

     }
    }
  });





