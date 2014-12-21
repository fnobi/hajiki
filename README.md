# hajiki

physical touch motion library.

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
    pos: [ width / 2, height / 2 ],
    radius: IMAGE_SIZE / 2
});

(function loop () {
    // clear canvas
    canvas.width = width;

    // re-calculation position
    hajiki.calcPos();

    // draw image on Hajiki position
    ctx.drawImage(
        image,
        hajiki.pos[0] - IMAGE_SIZE / 2,
        hajiki.pos[1] - IMAGE_SIZE / 2,
        IMAGE_SIZE,
        IMAGE_SIZE
    );

    // repeat on animation frame
    requestAnimationFrame(loop);
})();

```