// get window size
var width = window.innerWidth;
var height = window.innerHeight;


// setup canvas
var canvas = document.getElementById('hajiki');
canvas.width = width;
canvas.height = height;
canvas.style.position = 'absolute';
canvas.style.top = canvas.style.left = '0px';
canvas.style.width = canvas.style.height = '100%';

var ctx = canvas.getContext('2d');


// setup hajiki
var hajiki = new Hajiki({
    el: canvas,
    pos: [ width * 0.5, height * 0.5 ],
    friction: 0.8,
    potentialRate: 0.1,
    throwPower: 1,
    disableGrip: false,
    disableDeviceMotion: false
});

// animation frame
var RECT_SIZE = 100;
(function loop () {
    hajiki.calcPos();

    canvas.width = width;
    ctx.fillRect(
        hajiki.pos[0] - RECT_SIZE / 2,
        hajiki.pos[1] - RECT_SIZE / 2,
        RECT_SIZE,
        RECT_SIZE
    );

    requestAnimationFrame(loop);
})();
