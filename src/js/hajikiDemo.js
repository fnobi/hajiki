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

// setup sample image
var IMAGE_SIZE = 128;
var image = new Image();
image.src = 'img/sample.png';

// setup hajiki
var hajiki = new Hajiki({
    el: canvas,
    radius: IMAGE_SIZE / 2,
    defaultX: width / 2,
    defaultY: 0,
    originX: width / 2,
    originY: height / 2
});

(function loop () {
    // clear canvas
    canvas.width = width;

    // re-calculation position
    hajiki.calcPos();

    // draw image on Hajiki position
    ctx.drawImage(
        image,
        hajiki.x - IMAGE_SIZE / 2,
        hajiki.y - IMAGE_SIZE / 2,
        IMAGE_SIZE,
        IMAGE_SIZE
    );

    // repeat on animation frame
    requestAnimationFrame(loop);
})();
