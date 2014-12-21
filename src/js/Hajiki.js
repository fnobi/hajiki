var Hajiki = function (opts) {
    opts = opts || {};

    this.el = opts.el || document.createElement('canvas');

    this.grip = false;

    this.pos = opts.pos || [0, 0];
    this.friction = opts.friction || 0.8;
    this.potentialRate = opts.potentialRate || 0.1;
    this.deviceRate = opts.deviceRate || 5;
    this.deviceGate = opts.deviceGate || 4;
    this.throwPower = opts.throwPower || 0;

    this.radius = opts.radius;

    this.acc = [0, 0];

    this.setOrigin(this.pos[0], this.pos[1]);

    this.disableGrip = opts.disableGrip;
    this.disableDeviceMotion = opts.disableDeviceMotion;

    this.hover = false;

    this.initListener();
};
Hajiki = EventTrigger.extend(Hajiki);

Hajiki.prototype.initListener = function () {
    if (!this.disableGrip) {
        this.initGripListener();
    }

    if (!this.disableDeviceMotion) {
        this.initDeviceListener();
    }
};

Hajiki.prototype.setOrigin = function (x, y) {
    this.originPos = [x, y];
};

Hajiki.prototype.setRadius = function (r) {
    this.radius = r;
};

Hajiki.prototype.initGripListener = function () {
    var self = this,
        el = this.el;

    el.addEventListener('mousedown', function (e) {
        var success = self.startGrip(e);
        if (success) {
            e.preventDefault();
        }
    });
    el.addEventListener('mouseup', function () {
        self.endGrip();
    });
    el.addEventListener('mousemove', function (e) {
        e.preventDefault();

        // hover flag
        if (self.onCircle(e.pageX, e.pageY)) {
            if (!self.hover) {
                self.hover = true;
                self.emit('mouseover', e);
            }
        } else {
            if (self.hover) {
                self.hover = false;
                self.emit('mouseout', e);
            }
        }

        if (!self.grip) {
            return;
        }

        self.processGrip(e);
    });

    el.addEventListener('touchstart', function (e) {
        var touch = e.touches[0];
        if (!touch) {
            return;
        }
        var success = self.startGrip(touch);
        if (success) {
            e.preventDefault();
        }
    });
    el.addEventListener('touchend', function () {
        self.endGrip();
    });

    el.addEventListener('touchmove', function (e) {
        var touch = e.touches[0];

        if (!self.grip) {
            return;
        }
        if (!touch) {
            return;
        }

        e.preventDefault();
        self.processGrip(touch);
    });
};

Hajiki.prototype.initDeviceListener = function () {
    var self = this;

    window.addEventListener('devicemotion', function (e) {
        var ac = e.acceleration,
            deviceGate = self.deviceGate,
            deviceRate = self.deviceRate;

        if (Math.abs(ac.x) >= deviceGate) {
            self.acc[0] = -ac.x * deviceRate;
        }
        if (Math.abs(ac.y) >= deviceGate) {
            self.acc[1] = ac.y * deviceRate;
        }
    });
};

Hajiki.prototype.onCircle = function (x, y) {
    var radius = this.radius;

    if (isNaN(radius)) {
        return true;
    }

    var w = x * 2 - this.pos[0];
    var h = y * 2 - this.pos[1];
    var d = Math.sqrt(w * w + h * h);

    if (d < radius) {
        return true;
    } else {
        return false;
    }
};

Hajiki.prototype.startGrip = function (e) {
    if (!this.onCircle(e.pageX, e.pageY)) {
        return;
    }
    
    this.grip = true;
    this.gripMove = false;
    this.prevPos = [e.pageX * 2, e.pageY * 2];

    return true;
};

Hajiki.prototype.endGrip = function () {
    if (!this.grip) {
        return;
    }

    this.grip = false;

    if (!this.gripMove) {
        this.emit('click');
    } else if (this.throwPower > 0) {
        this.acc = [
            (this.originPos[0] - this.pos[0]) / this.throwPower,
            (this.originPos[1] - this.pos[1]) / this.throwPower
        ];
    }
};

Hajiki.prototype.processGrip = function (e) {
    var prevPos = this.prevPos;

    this.pos[0] += e.pageX * 2 - prevPos[0];
    this.pos[1] += e.pageY * 2 - prevPos[1];

    this.prevPos[0] = e.pageX * 2;
    this.prevPos[1] = e.pageY * 2;

    this.gripMove = true;
};

Hajiki.prototype.calcPos = function () {
    if (this.grip) {
        return;
    }

    var el = this.el,
        pos = this.pos,
        originPos = this.originPos,
        acc = this.acc,
        friction = this.friction,
        potentialRate = this.potentialRate,
        potential = [
            (originPos[0] - pos[0]) * potentialRate,
            (originPos[1] - pos[1]) * potentialRate
        ];

    // accel
    pos[0] += acc[0];
    pos[1] += acc[1];

    // friction
    this.acc[0] = (acc[0] + potential[0]) * friction;
    this.acc[1] = (acc[1] + potential[1]) * friction;
};

Hajiki.prototype.getSpeed = function () {
    var acc = this.acc;
    return Math.sqrt(acc[0] * acc[0] + acc[1] * acc[1]);
};

