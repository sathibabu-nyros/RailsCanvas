

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



        // resize events start
       
            canvas.addEventListener('mousedown', mouseDown, false);
            canvas.addEventListener('mouseup', mouseUp, false);
            canvas.addEventListener('mousemove', mouseMove, false);
  
        function mouseDown(e) {

                    ID = 0;
                    mouseX = e.pageX - this.offsetLeft;
                    mouseY = e.pageY - this.offsetTop;
                  
                
        
          angular.forEach(shapes, function(res, key) { 


              var left = res['startX'], right = res['startX']+res['w'];
              var top = res['startY'], bottom = res['startY']+res['h'];
                  
                if (right >= mouseX
                    && left <= mouseX
                    && bottom >= mouseY
                    && top <= mouseY) 
                {
           
                    if (res['u'] === undefined) {
                        dragBR = true;
                        ID = res['id']
                       
                    }

                   // 4. bottom right
                    else if (checkCloseEnough(mouseX, res['startX'] + res['w']) && checkCloseEnough(mouseY, res['startY'] + res['h'])) {
                        dragBR = true;
                       
                        
                    }
                    // (5.) none of them
                    else {
                        // handle not resizing
                    }


                }
          });

         
           

        }

        function checkCloseEnough(p1, p2) {
            return Math.abs(p1 - p2) < closeEnough;
        }

        function mouseUp() {
            dragBR = false;


                var data = Data;
                var config = {
                    headers : {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
                    }
                }



                // update dimensions of shapes
                $http.put('/usershapes', data, config)
                .success(function (data, status, headers, config) {
                  window.location.reload();
                })
                .error(function (data, status, header, config) {
                });


        }

        function mouseMove(e) {
             mouseX = e.pageX - this.offsetLeft;
             mouseY = e.pageY - this.offsetTop;

             angular.forEach(shapes, function(res, key) { 
               
                     
                      if (dragBR && ID == res['id']) {
                          res['w'] = Math.abs(res['startX'] - mouseX);
                          res['h'] = Math.abs(res['startY'] - mouseY);
                          ctx.clearRect(res['startX'], res['startY'], res['w'], res['h']);
                          draw(res['shape']);
                  }
                });
        }

        function draw(shape) {
        
          angular.forEach(shapes, function(res, key) { 

            if(ID == res['id']){
               
                if(shape == 'rect'){
                  ctx.fillStyle = "#222222";
                  ctx.fillRect(res['startX'], res['startY'], res['w'], res['h']);
                }else if(shape == 'circle'){
                  ctx.fillStyle = "#222222";
                  ctx.beginPath();
                  ctx.arc(res['startX'] + res['w'] / 2 , res['startY'] + res['w'] / 2, res['w'] / 2 , 0, Math.PI*2, true);
                  ctx.fill();
                }
                // drawHandles();
                Data = $.param({
                    id: ID,
                    w: res['w'],
                    h: res['h'],
                    r: (res['w'] / 2),
                    text: res['text']
                });
            }
          });


            

           
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
              
              draw_first(res['x'],res['y'],res['w'],res['h'],res['r'],res['shape']['name']);
              
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
            ctx.arc(x, y, r, 0, Math.PI*2, true); 
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




