var EventTrigger = new Function ();

EventTrigger.prototype.initEventTrigger = function () {
    this._listeners = {};
};

EventTrigger.prototype.initEventTriggerType = function (type) {
    if (!type) {
        return;
    }
    this._listeners[type] = [];
};

EventTrigger.prototype.hasEventListener = function (type, fn) {
    if (!this.listener) {
        return false;
    }

    if (type && !this.listener[type]) {
        return false;
    }

    return true;
};

EventTrigger.prototype.addListener = function (type, fn) {
    if (!this._listeners) {
        this.initEventTrigger();
    }
    if (!this._listeners[type]) {
        this.initEventTriggerType(type);
    }
    this._listeners[type].push(fn);

    this.emit('newListener', type, fn);
};

EventTrigger.prototype.on = EventTrigger.prototype.addListener;

EventTrigger.prototype.one = function (type, fn) {
    fn._oneTimeListener = true;
    this.addListener(type, fn);
};

EventTrigger.prototype.removeListener = function (type, fn) {
    if (!this._listeners) {
        return;
    }
    if (!this._listeners[type]) {
        return;
    }
    if (isNaN(this._listeners[type].length)) {
        return;
    }

    if (!type) {
        this.initEventTrigger();
        this.emit('removeListener', type, fn);
        return;
    }
    if (!fn) {
        this.initEventTriggerType(type);
        this.emit('removeListener', type, fn);
        return;
    }

    var self = this;
    for (var i = 0; i < this._listeners[type].length; i++) {
        (function (listener, index) {
            if (listener === fn) {
                self._listeners[type].splice(index, 1);
            }
        })(this._listeners[type][i], i);
    }
    this.emit('removeListener', type, fn);
};

EventTrigger.prototype.emit = function (type) {
    if (!this._listeners) {
        return;
    }
    if (!this._listeners[type]) {
        return;
    }
    if (isNaN(this._listeners[type].length)) {
        return;
    }

    var self = this,
        args = [].slice.call(arguments, 1);

    for (var i = 0; i < this._listeners[type].length; i++) {
        (function (listener) {
            listener.apply(self, args);
            if (listener._oneTimeListener) {
                self.removeListener(type, listener);
            }
        })(this._listeners[type][i]);
    }
};

EventTrigger.prototype.listeners = function (type) {
    if (!type) {
        return undefined;
    }
    return this._listeners[type];
};

// jquery style alias
EventTrigger.prototype.trigger = EventTrigger.prototype.emit;
EventTrigger.prototype.off = EventTrigger.prototype.removeListener;


// class method for inheritance
EventTrigger.extend = function (Klass) {
    for (var i in EventTrigger.prototype) {
        if (Klass.prototype[i]) {
            continue;
        }
        Klass.prototype[i] = EventTrigger.prototype[i];
    }
    return Klass;
};

var Hajiki = function (opts) {
    opts = opts || {};

    this.el = opts.el || document.createElement('canvas');

    this.grip = false;

    this.pos = opts.pos || [0, 0];
    this.friction = isNaN(opts.friction) ? 0.8 : opts.friction;
    this.potentialRate = isNaN(opts.potentialRate) ? 0.1 : opts.potentialRate;
    this.deviceRate = isNaN(opts.deviceRate) ? 5 : opts.deviceRate;
    this.deviceGate = isNaN(opts.deviceGate) ? 4 : opts.deviceGate;
    this.throwPower = isNaN(opts.throwPower) ? 1 : opts.throwPower;
    this.resolution = isNaN(opts.resolution) ? 1 : opts.resolution;
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
    var instance = this,
        el = this.el;

    el.addEventListener('mousedown', function (e) {
        var success = instance.startGrip(e);
        if (success) {
            e.preventDefault();
        }
    });
    el.addEventListener('mouseup', function () {
        instance.endGrip();
    });
    el.addEventListener('mousemove', function (e) {
        e.preventDefault();

        // hover flag
        if (instance.onCircle(e.pageX, e.pageY)) {
            if (!instance.hover) {
                instance.hover = true;
                instance.emit('mouseover', e);
            }
        } else {
            if (instance.hover) {
                instance.hover = false;
                instance.emit('mouseout', e);
            }
        }

        if (!instance.grip) {
            return;
        }

        instance.processGrip(e);
    });

    el.addEventListener('touchstart', function (e) {
        var touch = e.touches[0];
        if (!touch) {
            return;
        }
        var success = instance.startGrip(touch);
        if (success) {
            e.preventDefault();
        }
    });
    el.addEventListener('touchend', function () {
        instance.endGrip();
    });

    el.addEventListener('touchmove', function (e) {
        var touch = e.touches[0];

        if (!instance.grip) {
            return;
        }
        if (!touch) {
            return;
        }

        e.preventDefault();
        instance.processGrip(touch);
    });
};

Hajiki.prototype.initDeviceListener = function () {
    var instance = this;

    window.addEventListener('devicemotion', function (e) {
        var ac = e.acceleration,
            deviceGate = instance.deviceGate,
            deviceRate = instance.deviceRate;

        if (Math.abs(ac.x) >= deviceGate) {
            instance.acc[0] = -ac.x * deviceRate;
        }
        if (Math.abs(ac.y) >= deviceGate) {
            instance.acc[1] = ac.y * deviceRate;
        }
    });
};

Hajiki.prototype.onCircle = function (x, y) {
    var radius = this.radius;
    var resolution = this.resolution;

    if (isNaN(radius)) {
        return true;
    }

    var w = x * resolution - this.pos[0];
    var h = y * resolution - this.pos[1];
    var d = Math.sqrt(w * w + h * h);

    if (d < radius) {
        return true;
    } else {
        return false;
    }
};

Hajiki.prototype.startGrip = function (e) {
    if (!this.onCircle(e.pageX, e.pageY)) {
        return false;
    }

    var resolution = this.resolution;
    
    this.grip = true;
    this.gripMove = false;
    this.prevPos = [
        e.pageX * resolution,
        e.pageY * resolution
    ];

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
    var resolution = this.resolution;

    this.pos[0] += e.pageX * resolution - prevPos[0];
    this.pos[1] += e.pageY * resolution - prevPos[1];

    this.prevPos[0] = e.pageX * resolution;
    this.prevPos[1] = e.pageY * resolution;

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

