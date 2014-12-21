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

    var undef;

    this.el = opts.el || document.createElement('canvas');
    this.x = isNaN(opts.defaultX) ? 0 : opts.defaultX;
    this.y = isNaN(opts.defaultY) ? 0 : opts.defaultY;
    this.friction = isNaN(opts.friction) ? 0.8 : opts.friction;
    this.potentialRate = isNaN(opts.potentialRate) ? 0.1 : opts.potentialRate;
    this.deviceRate = isNaN(opts.deviceRate) ? 5 : opts.deviceRate;
    this.deviceGate = isNaN(opts.deviceGate) ? 4 : opts.deviceGate;
    this.throwPower = isNaN(opts.throwPower) ? 1 : opts.throwPower;
    this.resolution = isNaN(opts.resolution) ? 1 : opts.resolution;
    this.radius = opts.radius;
    this.enableGrip = (opts.enableGrip === undef) ? true : opts.enableGrip;
    this.enableDeviceMotion = (opts.enableDeviceMotion === undef) ? true : opts.enableDeviceMotion;

    this.grip = false;
    this.hover = false;
    this.acc = [0, 0];

    this.setOrigin(opts.originX, opts.originY);
    this.initListener();
};
Hajiki = EventTrigger.extend(Hajiki);

Hajiki.prototype.initListener = function () {
    if (this.enableGrip) {
        this.initGripListener();
    }
    if (this.enableDeviceMotion) {
        this.initDeviceListener();
    }
};

Hajiki.prototype.setOrigin = function (x, y) {
    x = isNaN(x) ? 0 : x;
    y = isNaN(y) ? 0 : y;
    this.originX = x;
    this.originY = y;
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

    var w = x * resolution - this.x;
    var h = y * resolution - this.y;
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
    this.prevX = e.pageX * resolution;
    this.prevY = e.pageY * resolution;

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
            (this.originX - this.x) / this.throwPower,
            (this.originY - this.y) / this.throwPower
        ];
    }
};

Hajiki.prototype.processGrip = function (e) {
    var resolution = this.resolution;

    this.x += e.pageX * resolution - this.prevX;
    this.y += e.pageY * resolution - this.prevY;

    this.prevX = e.pageX * resolution;
    this.prevY = e.pageY * resolution;

    this.gripMove = true;
};

Hajiki.prototype.calcPos = function () {
    if (this.grip) {
        return;
    }

    var el = this.el,
        acc = this.acc,
        friction = this.friction,
        potentialRate = this.potentialRate,
        potential = [
            (this.originX - this.x) * potentialRate,
            (this.originY - this.y) * potentialRate
        ];

    // accel
    this.x += acc[0];
    this.y += acc[1];

    // friction
    this.acc[0] = (acc[0] + potential[0]) * friction;
    this.acc[1] = (acc[1] + potential[1]) * friction;
};

Hajiki.prototype.getSpeed = function () {
    var acc = this.acc;
    return Math.sqrt(acc[0] * acc[0] + acc[1] * acc[1]);
};

