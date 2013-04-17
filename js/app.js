/* code to manage foreground canvas */
var foreground = {
    
    /* initialize foreground canvas */
    init: function(width, height) {
        /* get foreground canvas */
        foreground.elem = document.getElementById('foreground');
        /* get 2d context of foreground canvas */
        foreground.ctx = foreground.elem.getContext('2d');
        /* initialize parameters needed to draw on canvas */
        foreground.initParams(width, height);
        /* initialize gesture handling */
        foreground.initGestures();
        /* initialize source sprite image */
        foreground.img = new Image();
        /* handler for when image is loaded & ready to be drawn */
        foreground.img.onload = function() {
            /* set up handlers to animate running man based on drag gestures */
            foreground.initRunAnim();
            /* set up handlers to animate jump on double tap */
            foreground.initJumpAnim();
            /* set up handlers to pinch zoom runner */
            foreground.initPinchZoom();
            
        };
        /* load image */
        foreground.img.src = 'imgs/stickman.png';
    },
    
    /* initialize parameters needed to draw on canvas */
    initParams: function(width, height) {
        /* resize foreground canvas to match background canvas size */
        foreground.ctx.canvas.width = width;
        foreground.ctx.canvas.height = height;
        /* initialize 4 sprites to animate a run */
        foreground.runSprites = [];
        foreground.runSprites.push([0, 375, 80, 150]);
        foreground.runSprites.push([85, 375, 80, 150]);
        foreground.runSprites.push([170, 375, 80, 150]);
        foreground.runSprites.push([255, 375, 80, 150]);
        /* initialize sprite to animate a jump */
        foreground.jumpSprite = [165, 0, 80, 150];
        /* initialize position of sprites wrt background */
        /* foreground.destX is determined dynamically based on current frame */
        foreground.destY = height * 0.6;    /* horizontal plane of runner on canvas */
        foreground.destWidth = height / 15; /* width of runner's stride on canvas */
        foreground.destHeight = height / 8; /* height of runner on canvas */
    },
    
    /* initialize gesture handling */
    initGestures: function() {
        foreground.gestures = Hammer(foreground.elem, {
            /* prevent default browser handling for drag events */
            drag_block_horizontal: true,
            drag_block_vertical: true,
            /* prevent default browser handling for transform (multitouch) events */
            transform_always_block: true
        });
        /* keep track of animation state (during drag & pinch) */
        foreground.dragged = false;
        foreground.pinched = false;
    },
    
    /* set up handlers to animate running man based on drag gestures */
    initRunAnim: function() {
        /* draw runner at initial frame (frame #2) */
        foreground.drawRunFrame(2);
        /* start animation when starting to drag on running man */
        foreground.gestures.on('dragstart', function(event) {
            if (!foreground.pinched && foreground.isTarget(event.gesture.startEvent.center.pageX, event.gesture.startEvent.center.pageY)) {
                console.log('dragstart');
                foreground.dragged = true;
            }
            else { console.log('drag'); }
        });
        /* animate each frame when dragged far enough */
        foreground.gestures.on('drag', function(event) {
            if (foreground.dragged) {
                var frame = Math.floor(event.gesture.center.pageX / foreground.destWidth);
                if (frame != foreground.frame) {
                    foreground.drawRunFrame(frame);
                }
            }
        });
        /* stop animation */
        foreground.gestures.on('dragend', function(event) {
            if (foreground.dragged) {
                console.log('dragend');
            }
            foreground.dragged = false;
        });
        /* TODO: for cooler demo, implement scrolling when drag/holding at edge of screen */
    },
    
    /* set up handlers to animate jump on double tap */
    initJumpAnim: function() {
        foreground.gestures.on('doubletap', function(event) {
            if (foreground.isTarget(event.gesture.center.pageX, event.gesture.center.pageY)) {
                foreground.drawJumpAnim();
            }
        });
    },
    
    /* set up handlers to pinch zoom runner */
    /* TODO: using webkit-specific vendor prefix for transforms for now, can make more cross-platform */
    initPinchZoom: function() {
        /* start pinch zoom when one of the touch points is near the running man */
        foreground.gestures.on('transformstart', function(event) {
            if (foreground.isTarget(event.gesture.touches[0].pageX, event.gesture.touches[0].pageY) || 
                foreground.isTarget(event.gesture.touches[1].pageX, event.gesture.touches[1].pageY)) {
                foreground.pinched = true;
                /* set transform origin to center of running man */
                var x = (foreground.destX + (foreground.destWidth / 2)) / foreground.ctx.canvas.width * 100 + '%';
                var y = (foreground.destY + (foreground.destHeight / 2)) / foreground.ctx.canvas.height * 100 + '%';
                foreground.elem.style.webkitTransformOrigin = x + ' ' + y + ' 0';
            }
        });
        /* zoom according to pinch distance and position */
        foreground.gestures.on('pinch', function(event) {
            if (foreground.pinched) {
                /* shift center of man to center of fingers */
                var deltaX = event.gesture.center.pageX - (foreground.destX + (foreground.destWidth / 2)) + 'px';
                var deltaY = event.gesture.center.pageY - (foreground.destY + (foreground.destHeight / 2)) + 'px';
                var translate = 'translate3d(' + deltaX + ',' + deltaY + ',0)';
                /* zoom according to distance between fingers */
                var scale = 'scale3d(' + event.gesture.scale + ',' + event.gesture.scale + ',1)';
                /* zoom using css3 transform */
                foreground.elem.style.webkitTransform = translate + ' ' + scale;
            }
        });
        /* end pinch zoom and reset canvas */
        foreground.gestures.on('transformend', function(event) {
            if (foreground.pinched) {
                console.log('transformend');
                foreground.pinched = false;
                foreground.elem.style.webkitTransform = 'translate3d(0,0,0) scale3d(1,1,1)';
            }
        });
    },
    
    /* draw runner at given frame */
    drawRunFrame: function(frame) {
        /* calculate new x coordinate */
        var destX = foreground.destWidth * frame;
        /* if still within canvas */
        if ((destX + foreground.destWidth) <= foreground.ctx.canvas.width) {
            /* clear previous frame */
            foreground.clearFrame(foreground.destX, foreground.destY);
            /* save new frame number */
            foreground.frame = frame;
            /* save new x coordinate */
            foreground.destX = destX;
            /* draw new frame */
            foreground._drawRunFrame();
        }
    },
    
    /* helper function for drawing runner */
    _drawRunFrame: function() {
        /* get coordinates on source sprite */
        var srcParams = foreground.runSprites[foreground.frame % 4];
        /* get coordinates on destination canvas */
        var destParams = [foreground.destX, foreground.destY, foreground.destWidth, foreground.destHeight];
        /* draw new frame */
        foreground.ctx.drawImage.apply(foreground.ctx, [foreground.img].concat(srcParams, destParams));
    },
    
    /* clear frame at x,y coordinate */
    clearFrame: function(x, y) {
        foreground.ctx.clearRect(x - 1, y - 1, foreground.destWidth + 2, foreground.destHeight + 2);
    },
    
    /* draw man jumping */
    drawJumpAnim: function() {
        /* disable user input for jump duration */
        foreground.gestures.enable(false);
        /* clear previous frame */
        foreground.clearFrame(foreground.destX, foreground.destY);
        /* get coordinates on source sprite */
        var srcParams = foreground.jumpSprite;
        /* get coordinates on destination canvas */
        var destParams = [foreground.destX, foreground.destY - (2 * foreground.destHeight), foreground.destWidth, foreground.destHeight];
        /* draw jump up */
        foreground.ctx.drawImage.apply(foreground.ctx, [foreground.img].concat(srcParams, destParams));
        /* wait to land from jump */
        setTimeout(function() {
            /* clear jump up */
            foreground.clearFrame(foreground.destX, foreground.destY - (2 * foreground.destHeight));
            /* draw jump landing */
            foreground._drawRunFrame();
            /* ren-enable user input */
            foreground.gestures.enable(true);
        }, 500);
        
    },
    
    /* determine if runner is target of given touch event */
    isTarget: function(x, y) {
        /* add 1/2 frame width & full frame height to account for fat fingers */
        return (((x >= (foreground.destX - (foreground.destWidth * 0.5))) && (x <= (foreground.destX + (foreground.destWidth * 1.5)))) &&
                ((y >= (foreground.destY - foreground.destHeight)) && (y <= (foreground.destY + (foreground.destHeight * 2)))));
    }
    
};

/* code to manage background canvas */
var background = {
    init: function() {
        /* get 2d context of background canvas */
        var ctx = document.getElementById('background').getContext('2d');
        /* initialize source background image */
        var img = new Image();
        img.onload = function() {
            /* resize canvas to fit image height */
            ctx.canvas.height = window.innerHeight;
            ctx.canvas.width = (ctx.canvas.height / this.height) * this.width;
            /* draw image onto canvas */
            ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
            /* enable foreground canvas */
            foreground.init(ctx.canvas.width, ctx.canvas.height);
        };
        /* load image */
        img.src = 'imgs/toronto.jpg';
    }
};

/* start demo app when dom is ready */
document.addEventListener('DOMContentLoaded', background.init, false);