# hajiki

physical touch motion library.

## demo
 - http://fnobi.github.io/hajiki/demo

## install

```
bower install hajiki
```

## usage

```javascript
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


// add listener
var hover = false;
hajiki.on('click', function () {
    alert('hello!');
});
hajiki.on('mouseover', function () {
    hover = true;
});
hajiki.on('mouseout', function () {
    hover = false;
});


(function loop () {
    // re-calculate position
    hajiki.calcPos();

    // clear canvas
    canvas.width = width;

    ctx.save();

    // check hover
    if (hover) {
        ctx.globalAlpha = 0.8;
    }

    // draw image on Hajiki position
    ctx.drawImage(
        image,
        hajiki.x - IMAGE_SIZE / 2,
        hajiki.y - IMAGE_SIZE / 2,
        IMAGE_SIZE,
        IMAGE_SIZE
    );

    ctx.restore();

    // repeat on animation frame
    requestAnimationFrame(loop);
})();

```