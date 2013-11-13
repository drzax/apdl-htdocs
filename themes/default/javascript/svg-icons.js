(function(glob) {
    var version = "0.4.2", has = "hasOwnProperty", separator = /[\.\/]/, wildcard = "*", fun = function() {}, numsort = function(a, b) {
        return a - b;
    }, current_event, stop, events = {
        n: {}
    }, eve = function(name, scope) {
        name = String(name);
        var e = events, oldstop = stop, args = Array.prototype.slice.call(arguments, 2), listeners = eve.listeners(name), z = 0, f = false, l, indexed = [], queue = {}, out = [], ce = current_event, errors = [];
        current_event = name;
        stop = 0;
        for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
            indexed.push(listeners[i].zIndex);
            if (listeners[i].zIndex < 0) {
                queue[listeners[i].zIndex] = listeners[i];
            }
        }
        indexed.sort(numsort);
        while (indexed[z] < 0) {
            l = queue[indexed[z++]];
            out.push(l.apply(scope, args));
            if (stop) {
                stop = oldstop;
                return out;
            }
        }
        for (i = 0; i < ii; i++) {
            l = listeners[i];
            if ("zIndex" in l) {
                if (l.zIndex == indexed[z]) {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                    do {
                        z++;
                        l = queue[indexed[z]];
                        l && out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                    } while (l);
                } else {
                    queue[l.zIndex] = l;
                }
            } else {
                out.push(l.apply(scope, args));
                if (stop) {
                    break;
                }
            }
        }
        stop = oldstop;
        current_event = ce;
        return out.length ? out : null;
    };
    eve._events = events;
    eve.listeners = function(name) {
        var names = name.split(separator), e = events, item, items, k, i, ii, j, jj, nes, es = [ e ], out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [ e[names[i]], e[wildcard] ];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    eve.on = function(name, f) {
        name = String(name);
        if (typeof f != "function") {
            return function() {};
        }
        var names = name.split(separator), e = events;
        for (var i = 0, ii = names.length; i < ii; i++) {
            e = e.n;
            e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {
                n: {}
            });
        }
        e.f = e.f || [];
        for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
            return fun;
        }
        e.f.push(f);
        return function(zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    eve.f = function(event) {
        var attrs = [].slice.call(arguments, 1);
        return function() {
            eve.apply(null, [ event, null ].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    eve.stop = function() {
        stop = 1;
    };
    eve.nt = function(subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    eve.nts = function() {
        return current_event.split(separator);
    };
    eve.off = eve.unbind = function(name, f) {
        if (!name) {
            eve._events = events = {
                n: {}
            };
            return;
        }
        var names = name.split(separator), e, key, splice, i, ii, j, jj, cur = [ events ];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [ j, 1 ];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    eve.once = function(name, f) {
        var f2 = function() {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    eve.version = version;
    eve.toString = function() {
        return "You are running Eve " + version;
    };
    typeof module != "undefined" && module.exports ? module.exports = eve : typeof define != "undefined" ? define("eve", [], function() {
        return eve;
    }) : glob.eve = eve;
})(this);

(function(glob, factory) {
    if (typeof define === "function" && define.amd) {
        define([ "eve" ], function(eve) {
            return factory(glob, eve);
        });
    } else {
        factory(glob, glob.eve);
    }
})(this, function(window, eve) {
    var mina = function(eve) {
        var animations = {}, requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
            setTimeout(callback, 16);
        }, isArray = Array.isArray || function(a) {
            return a instanceof Array || Object.prototype.toString.call(a) == "[object Array]";
        }, idgen = 0, idprefix = "M" + (+new Date()).toString(36), ID = function() {
            return idprefix + (idgen++).toString(36);
        }, diff = function(a, b, A, B) {
            if (isArray(a)) {
                res = [];
                for (var i = 0, ii = a.length; i < ii; i++) {
                    res[i] = diff(a[i], b, A[i], B);
                }
                return res;
            }
            var dif = (A - a) / (B - b);
            return function(bb) {
                return a + dif * (bb - b);
            };
        }, timer = function() {
            return +new Date();
        }, sta = function(val) {
            var a = this;
            if (val == null) {
                return a.s;
            }
            var ds = a.s - val;
            a.b += a.dur * ds;
            a.B += a.dur * ds;
            a.s = val;
        }, speed = function(val) {
            var a = this;
            if (val == null) {
                return a.spd;
            }
            a.spd = val;
        }, duration = function(val) {
            var a = this;
            if (val == null) {
                return a.dur;
            }
            a.s = a.s * val / a.dur;
            a.dur = val;
        }, stopit = function() {
            var a = this;
            delete animations[a.id];
            eve("mina.stop." + a.id, a);
        }, pause = function() {
            var a = this;
            if (a.pdif) {
                return;
            }
            delete animations[a.id];
            a.pdif = a.get() - a.b;
        }, resume = function() {
            var a = this;
            if (!a.pdif) {
                return;
            }
            a.b = a.get() - a.pdif;
            delete a.pdif;
            animations[a.id] = a;
        }, frame = function() {
            var len = 0;
            for (var i in animations) if (animations.hasOwnProperty(i)) {
                var a = animations[i], b = a.get(), res;
                len++;
                a.s = (b - a.b) / (a.dur / a.spd);
                if (a.s >= 1) {
                    delete animations[i];
                    a.s = 1;
                    len--;
                }
                if (isArray(a.start)) {
                    res = [];
                    for (var j = 0, jj = a.start.length; j < jj; j++) {
                        res[j] = a.start[j] + (a.end[j] - a.start[j]) * a.easing(a.s);
                    }
                } else {
                    res = a.start + (a.end - a.start) * a.easing(a.s);
                }
                a.set(res);
                if (a.s == 1) {
                    eve("mina.finish." + a.id, a);
                }
            }
            len && requestAnimFrame(frame);
        }, mina = function(a, A, b, B, get, set, easing) {
            var anim = {
                id: ID(),
                start: a,
                end: A,
                b: b,
                s: 0,
                dur: B - b,
                spd: 1,
                get: get,
                set: set,
                easing: easing || mina.linear,
                status: sta,
                speed: speed,
                duration: duration,
                stop: stopit,
                pause: pause,
                resume: resume
            };
            animations[anim.id] = anim;
            var len = 0, i;
            for (i in animations) if (animations.hasOwnProperty(i)) {
                len++;
                if (len == 2) {
                    break;
                }
            }
            len == 1 && requestAnimFrame(frame);
            return anim;
        };
        mina.time = timer;
        mina.getById = function(id) {
            return animations[id] || null;
        };
        mina.linear = function(n) {
            return n;
        };
        mina.easeout = function(n) {
            return Math.pow(n, 1.7);
        };
        mina.easein = function(n) {
            return Math.pow(n, .48);
        };
        mina.easeinout = function(n) {
            if (n == 1) {
                return 1;
            }
            if (n == 0) {
                return 0;
            }
            var q = .48 - n / 1.04, Q = Math.sqrt(.1734 + q * q), x = Q - q, X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1), y = -Q - q, Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1), t = X + Y + .5;
            return (1 - t) * 3 * t * t + t * t * t;
        };
        mina.backin = function(n) {
            if (n == 1) {
                return 1;
            }
            var s = 1.70158;
            return n * n * ((s + 1) * n - s);
        };
        mina.backout = function(n) {
            if (n == 0) {
                return 0;
            }
            n = n - 1;
            var s = 1.70158;
            return n * n * ((s + 1) * n + s) + 1;
        };
        mina.elastic = function(n) {
            if (n == !!n) {
                return n;
            }
            return Math.pow(2, -10 * n) * Math.sin((n - .075) * 2 * Math.PI / .3) + 1;
        };
        mina.bounce = function(n) {
            var s = 7.5625, p = 2.75, l;
            if (n < 1 / p) {
                l = s * n * n;
            } else {
                if (n < 2 / p) {
                    n -= 1.5 / p;
                    l = s * n * n + .75;
                } else {
                    if (n < 2.5 / p) {
                        n -= 2.25 / p;
                        l = s * n * n + .9375;
                    } else {
                        n -= 2.625 / p;
                        l = s * n * n + .984375;
                    }
                }
            }
            return l;
        };
        window.mina = mina;
        return mina;
    }(typeof eve == "undefined" ? function() {} : eve);
    (function() {
        function parse(s) {
            s = s || Object(s);
            var pos = 1, len = s.length + 1, p, c, n = at(s, 0);
            for (;pos < len; pos++) {
                p = c;
                c = n;
                n = at(s, pos);
                this.raw += c;
                step.call(this, c, n, p);
            }
            this._beforeEnd = function() {
                step.call(this, "", "", c);
            };
            return this;
        }
        function at(s, i) {
            return s && (s.charAt ? s.charAt(i) : s[i]);
        }
        function on(name, f) {
            this.events = this.events || {};
            this.events[name] = this.events[name] || [];
            this.events[name].push(f);
        }
        function event(name, data, extra) {
            if (typeof eve == "function") {
                eve("elemental." + name + (data ? "." + data : ""), null, data, extra || "", this.raw);
            }
            var a = this.events && this.events[name], i = a && a.length;
            while (i--) try {
                this.events[name][i](data, extra || "", this.raw);
            } catch (e) {}
            this.raw = "";
        }
        function end() {
            step.call(this, "eof");
            this.event("eof");
        }
        var entities = {
            lt: 60,
            "lt;": 60,
            "AMP;": 38,
            AMP: 38,
            "GT;": 62,
            GT: 62,
            "QUOT;": 34,
            QUOT: 34,
            "apos;": 39,
            "bull;": 8226,
            "bullet;": 8226,
            "copy;": 169,
            copy: 169,
            "deg;": 176,
            deg: 176
        }, whitespace = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]/, notEntity = /[#\da-z]/i, entity2text = function(entity) {
            var code;
            if (entity.charAt() == "#") {
                if (entity.charAt(1).toLowerCase() == "x") {
                    code = parseInt(entity.substring(2), 16);
                } else {
                    code = parseInt(entity.substring(1), 10);
                }
            }
            code = entities[entity];
            return code ? String.fromCharCode(code) : "&" + entity;
        }, fireAttrEvent = function() {
            for (var key in this.attr) if (this.attr.hasOwnProperty(key)) {
                this.event("attr", key, {
                    value: this.attr[key],
                    tagname: this.tagname,
                    attr: this.attr
                });
            }
        }, act = {
            text: function(c, n, p) {
                switch (c) {
                  case "<":
                  case "eof":
                    this.nodename = "";
                    this.attr = {};
                    this.mode = "tag name start";
                    this.raw = this.raw.slice(0, -1);
                    this.textchunk && this.event("text", this.textchunk);
                    this.raw += c;
                    this.textchunk = "";
                    break;

                  case "&":
                    this.mode = "entity";
                    this.entity = "";
                    break;

                  default:
                    this.textchunk += c;
                    break;
                }
            },
            entity: function(c, n, p) {
                if (whitespace.test(c)) {
                    this.textchunk += entity2text(this.entity);
                    this.mode = "text";
                } else if (c == ";") {
                    this.textchunk += entity2text(this.entity + c);
                    this.mode = "text";
                } else {
                    this.entity += c;
                }
            },
            special: function(c, n, p) {
                if (p == "!" && c == "-" && n == "-") {
                    this.mode = "comment start";
                    return;
                }
                if (this.textchunk == "[CDATA" && c == "[") {
                    this.mode = "cdata";
                    this.textchunk = "";
                    return;
                }
                if (c == ">" || c == "eof") {
                    this.event("special", this.textchunk);
                    this.mode = "text";
                    this.textchunk = "";
                    return;
                }
                this.textchunk += c;
            },
            cdata: function(c, n, p) {
                if (p == "]" && c == "]" && n == ">") {
                    this.mode = "cdata end";
                    this.textchunk = this.textchunk.slice(0, -1);
                    return;
                }
                if (c == "eof") {
                    act["cdata end"].call(this);
                }
                this.textchunk += c;
            },
            "cdata end": function(c, n, p) {
                this.event("cdata", this.textchunk);
                this.textchunk = "";
                this.mode = "text";
            },
            "comment start": function(c, n, p) {
                if (n == ">" || c == "eof") {
                    this.event("comment", "");
                    this.mode = "skip";
                } else {
                    this.mode = "comment";
                }
            },
            skip: function(c, n, p) {
                this.mode = "text";
            },
            comment: function(c, n, p) {
                if (c == "-" && p == "-" && n == ">") {
                    this.mode = "comment end";
                    this.textchunk = this.textchunk.slice(0, -1);
                } else if (c == "eof") {
                    this.event("comment", this.textchunk);
                } else {
                    this.textchunk += c;
                }
            },
            "comment end": function(c, n, p) {
                this.event("comment", this.textchunk);
                this.textchunk = "";
                this.mode = "text";
            },
            declaration: function(c, n, p) {
                if (c == "?" && n == ">") {
                    this.mode = "declaration end";
                    return;
                }
                if (c == "eof") {
                    this.event("comment", this.textchunk);
                }
                this.textchunk += c;
            },
            "declaration end": function(c, n, p) {
                this.event("comment", this.textchunk);
                this.textchunk = "";
                this.mode = "text";
            },
            "tag name start": function(c, n, p) {
                if (c == "eof") {
                    this.event("text", "<");
                    return;
                }
                if (!whitespace.test(c)) {
                    this.mode = "tag name";
                    if (c == "/") {
                        this.mode = "close tag name start";
                        return;
                    } else if (c == "!") {
                        this.mode = "special";
                        this.textchunk = "";
                        return;
                    } else if (c == "?") {
                        this.mode = "declaration";
                        return;
                    }
                    act[this.mode].call(this, c, n, p);
                }
            },
            "close tag name start": function(c, n, p) {
                if (!whitespace.test(c)) {
                    this.mode = "close tag name";
                    this.tagname = "";
                    this.nodename = "";
                    act[this.mode].call(this, c, n, p);
                }
            },
            "close tag name": function(c, n, p) {
                if (whitespace.test(c)) {
                    this.tagname = this.nodename;
                } else switch (c) {
                  case ">":
                    this.event("/tag", this.tagname || this.nodename);
                    this.mode = "text";
                    break;

                  default:
                    !this.tagname && (this.nodename += c);
                    break;
                }
            },
            "tag name": function(c, n, p) {
                if (whitespace.test(c)) {
                    this.tagname = this.nodename;
                    this.nodename = "";
                    this.mode = "attr start";
                } else switch (c) {
                  case ">":
                    this.event("tag", this.nodename);
                    this.mode = "text";
                    break;

                  case "/":
                    this.raw += n;
                    this.event("tag", this.nodename);
                    this.event("/tag", this.nodename);
                    this.mode = "skip";
                    break;

                  default:
                    this.nodename += c;
                    break;
                }
            },
            "attr start": function(c, n, p) {
                if (!whitespace.test(c)) {
                    this.mode = "attr";
                    this.nodename = "";
                    act[this.mode].call(this, c, n, p);
                }
            },
            attr: function(c, n, p) {
                if (whitespace.test(c) || c == "=") {
                    this.attr[this.nodename] = "";
                    this.mode = "attr value start";
                } else switch (c) {
                  case ">":
                    if (this.nodename == "/") {
                        delete this.attr["/"];
                        this.event("tag", this.tagname, this.attr);
                        fireAttrEvent.call(this);
                        this.event("/tag", this.tagname, true);
                    } else {
                        this.nodename && (this.attr[this.nodename] = "");
                        this.event("tag", this.tagname, this.attr);
                        fireAttrEvent.call(this);
                    }
                    this.mode = "text";
                    break;

                  default:
                    this.nodename += c;
                    break;
                }
            },
            "attr value start": function(c, n, p) {
                if (!whitespace.test(c)) {
                    this.mode = "attr value";
                    this.quote = false;
                    if (c == "'" || c == '"') {
                        this.quote = c;
                        return;
                    }
                    act[this.mode].call(this, c, n, p);
                }
            },
            "attr value": function(c, n, p) {
                if (whitespace.test(c) && !this.quote) {
                    this.mode = "attr start";
                } else if (c == ">" && !this.quote) {
                    this.event("tag", this.tagname, this.attr);
                    this.mode = "text";
                } else switch (c) {
                  case '"':
                  case "'":
                    if (this.quote == c && p != "\\") {
                        this.mode = "attr start";
                    }
                    break;

                  default:
                    this.attr[this.nodename] += c;
                    break;
                }
            }
        };
        function step(c, n, p) {
            c == "\n" && this.event("newline");
            act[this.mode].call(this, c, n, p);
        }
        function elemental(type, ent) {
            var out = function(s) {
                out.parse(s);
            };
            out.mode = "text";
            out.type = String(type || "html").toLowerCase();
            out.textchunk = "";
            out.raw = "";
            out.parse = parse;
            out.on = on;
            out.event = event;
            out.end = end;
            if (ent) {
                entities = ent;
            }
            return out;
        }
        elemental.version = "0.2.4";
        (typeof exports == "undefined" ? this : exports).elemental = elemental;
    })();
    var Snap = function() {
        Snap.version = "0.1.0";
        function Snap(w, h) {
            if (w) {
                if (w.tagName) {
                    return wrap(w);
                }
                if (w instanceof Element) {
                    return w;
                }
                if (h == null) {
                    w = glob.doc.querySelector(w);
                    return wrap(w);
                }
            }
            w = w == null ? "100%" : w;
            h = h == null ? "100%" : h;
            return new Paper(w, h);
        }
        Snap.toString = function() {
            return "Snap v" + this.version;
        };
        Snap._ = {};
        var glob = {
            win: window,
            doc: window.document
        };
        Snap._.glob = glob;
        var has = "hasOwnProperty", Str = String, toFloat = parseFloat, toInt = parseInt, math = Math, mmax = math.max, mmin = math.min, abs = math.abs, pow = math.pow, PI = math.PI, round = math.round, E = "", S = " ", objectToString = Object.prototype.toString, ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i, colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i, isnan = {
            NaN: 1,
            Infinity: 1,
            "-Infinity": 1
        }, bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/, reURLValue = /^url\(#?([^)]+)\)$/, spaces = "	\n\f\r   ᠎             　\u2028\u2029", separator = new RegExp("[," + spaces + "]+"), whitespace = new RegExp("[" + spaces + "]", "g"), commaSpaces = new RegExp("[" + spaces + "]*,[" + spaces + "]*"), hsrg = {
            hs: 1,
            rg: 1
        }, pathCommand = new RegExp("([a-z])[" + spaces + ",]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[" + spaces + "]*,?[" + spaces + "]*)+)", "ig"), tCommand = new RegExp("([rstm])[" + spaces + ",]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[" + spaces + "]*,?[" + spaces + "]*)+)", "ig"), pathValues = new RegExp("(-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?)[" + spaces + "]*,?[" + spaces + "]*", "ig"), idgen = 0, idprefix = "S" + (+new Date()).toString(36), ID = function() {
            return idprefix + (idgen++).toString(36);
        }, xlink = "http://www.w3.org/1999/xlink", hub = {};
        function $(el, attr) {
            if (attr) {
                if (typeof el == "string") {
                    el = $(el);
                }
                if (typeof attr == "string") {
                    if (attr.substring(0, 6) == "xlink:") {
                        return el.getAttributeNS(xlink, attr.substring(6));
                    }
                    return el.getAttribute(attr);
                }
                for (var key in attr) if (attr[has](key)) {
                    var val = Str(attr[key]);
                    if (val) {
                        if (key.substring(0, 6) == "xlink:") {
                            el.setAttributeNS(xlink, key.substring(6), val);
                        } else {
                            el.setAttribute(key, val);
                        }
                    } else {
                        el.removeAttribute(key);
                    }
                }
            } else {
                el = glob.doc.createElementNS("http://www.w3.org/2000/svg", el);
            }
            return el;
        }
        Snap._.$ = $;
        Snap._.id = ID;
        function getAttrs(el) {
            var attrs = el.attributes, name, out = {};
            for (var i = 0; i < attrs.length; i++) {
                if (attrs[i].namespaceURI == xlink) {
                    name = "xlink:";
                } else {
                    name = "";
                }
                name += attrs[i].name;
                out[name] = attrs[i].textContent;
            }
            return out;
        }
        function is(o, type) {
            type = Str.prototype.toLowerCase.call(type);
            if (type == "finite") {
                return !isnan[has](+o);
            }
            if (type == "array" && (o instanceof Array || Array.isArray && Array.isArray(o))) {
                return true;
            }
            return type == "null" && o === null || type == typeof o && o !== null || type == "object" && o === Object(o) || objectToString.call(o).slice(8, -1).toLowerCase() == type;
        }
        Snap.format = function() {
            var tokenRegex = /\{([^\}]+)\}/g, objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, replacer = function(all, key, obj) {
                var res = obj;
                key.replace(objNotationRegex, function(all, name, quote, quotedName, isFunc) {
                    name = name || quotedName;
                    if (res) {
                        if (name in res) {
                            res = res[name];
                        }
                        typeof res == "function" && isFunc && (res = res());
                    }
                });
                res = (res == null || res == obj ? all : res) + "";
                return res;
            };
            return function(str, obj) {
                return Str(str).replace(tokenRegex, function(all, key) {
                    return replacer(all, key, obj);
                });
            };
        }();
        var preload = function() {
            function onerror() {
                this.parentNode.removeChild(this);
            }
            return function(src, f) {
                var img = glob.doc.createElement("img"), body = glob.doc.body;
                img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
                img.onload = function() {
                    f.call(img);
                    img.onload = img.onerror = null;
                    body.removeChild(img);
                };
                img.onerror = onerror;
                body.appendChild(img);
                img.src = src;
            };
        }();
        function clone(obj) {
            if (typeof obj == "function" || Object(obj) !== obj) {
                return obj;
            }
            var res = new obj.constructor();
            for (var key in obj) if (obj[has](key)) {
                res[key] = clone(obj[key]);
            }
            return res;
        }
        Snap._.clone = clone;
        function repush(array, item) {
            for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
                return array.push(array.splice(i, 1)[0]);
            }
        }
        function cacher(f, scope, postprocessor) {
            function newf() {
                var arg = Array.prototype.slice.call(arguments, 0), args = arg.join("␀"), cache = newf.cache = newf.cache || {}, count = newf.count = newf.count || [];
                if (cache[has](args)) {
                    repush(count, args);
                    return postprocessor ? postprocessor(cache[args]) : cache[args];
                }
                count.length >= 1e3 && delete cache[count.shift()];
                count.push(args);
                cache[args] = f.apply(scope, arg);
                return postprocessor ? postprocessor(cache[args]) : cache[args];
            }
            return newf;
        }
        Snap._.cacher = cacher;
        function angle(x1, y1, x2, y2, x3, y3) {
            if (x3 == null) {
                var x = x1 - x2, y = y1 - y2;
                if (!x && !y) {
                    return 0;
                }
                return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
            } else {
                return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
            }
        }
        function rad(deg) {
            return deg % 360 * PI / 180;
        }
        function deg(rad) {
            return rad * 180 / PI % 360;
        }
        function x_y() {
            return this.x + S + this.y;
        }
        function x_y_w_h() {
            return this.x + S + this.y + S + this.width + " × " + this.height;
        }
        Snap.rad = rad;
        Snap.deg = deg;
        Snap.angle = angle;
        Snap.is = is;
        Snap.snapTo = function(values, value, tolerance) {
            tolerance = is(tolerance, "finite") ? tolerance : 10;
            if (is(values, "array")) {
                var i = values.length;
                while (i--) if (abs(values[i] - value) <= tolerance) {
                    return values[i];
                }
            } else {
                values = +values;
                var rem = value % values;
                if (rem < tolerance) {
                    return value - rem;
                }
                if (rem > values - tolerance) {
                    return value - rem + values;
                }
            }
            return value;
        };
        function Matrix(a, b, c, d, e, f) {
            if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
                this.a = a.a;
                this.b = a.b;
                this.c = a.c;
                this.d = a.d;
                this.e = a.e;
                this.f = a.f;
                return;
            }
            if (a != null) {
                this.a = +a;
                this.b = +b;
                this.c = +c;
                this.d = +d;
                this.e = +e;
                this.f = +f;
            } else {
                this.a = 1;
                this.b = 0;
                this.c = 0;
                this.d = 1;
                this.e = 0;
                this.f = 0;
            }
        }
        (function(matrixproto) {
            matrixproto.add = function(a, b, c, d, e, f) {
                var out = [ [], [], [] ], m = [ [ this.a, this.c, this.e ], [ this.b, this.d, this.f ], [ 0, 0, 1 ] ], matrix = [ [ a, c, e ], [ b, d, f ], [ 0, 0, 1 ] ], x, y, z, res;
                if (a && a instanceof Matrix) {
                    matrix = [ [ a.a, a.c, a.e ], [ a.b, a.d, a.f ], [ 0, 0, 1 ] ];
                }
                for (x = 0; x < 3; x++) {
                    for (y = 0; y < 3; y++) {
                        res = 0;
                        for (z = 0; z < 3; z++) {
                            res += m[x][z] * matrix[z][y];
                        }
                        out[x][y] = res;
                    }
                }
                this.a = out[0][0];
                this.b = out[1][0];
                this.c = out[0][1];
                this.d = out[1][1];
                this.e = out[0][2];
                this.f = out[1][2];
                return this;
            };
            matrixproto.invert = function() {
                var me = this, x = me.a * me.d - me.b * me.c;
                return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
            };
            matrixproto.clone = function() {
                return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
            };
            matrixproto.translate = function(x, y) {
                return this.add(1, 0, 0, 1, x, y);
            };
            matrixproto.scale = function(x, y, cx, cy) {
                y == null && (y = x);
                (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
                this.add(x, 0, 0, y, 0, 0);
                (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
                return this;
            };
            matrixproto.rotate = function(a, x, y) {
                a = rad(a);
                x = x || 0;
                y = y || 0;
                var cos = +math.cos(a).toFixed(9), sin = +math.sin(a).toFixed(9);
                this.add(cos, sin, -sin, cos, x, y);
                return this.add(1, 0, 0, 1, -x, -y);
            };
            matrixproto.x = function(x, y) {
                return x * this.a + y * this.c + this.e;
            };
            matrixproto.y = function(x, y) {
                return x * this.b + y * this.d + this.f;
            };
            matrixproto.get = function(i) {
                return +this[Str.fromCharCode(97 + i)].toFixed(4);
            };
            matrixproto.toString = function() {
                return "matrix(" + [ this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5) ].join() + ")";
            };
            matrixproto.offset = function() {
                return [ this.e.toFixed(4), this.f.toFixed(4) ];
            };
            function norm(a) {
                return a[0] * a[0] + a[1] * a[1];
            }
            function normalize(a) {
                var mag = math.sqrt(norm(a));
                a[0] && (a[0] /= mag);
                a[1] && (a[1] /= mag);
            }
            matrixproto.split = function() {
                var out = {};
                out.dx = this.e;
                out.dy = this.f;
                var row = [ [ this.a, this.c ], [ this.b, this.d ] ];
                out.scalex = math.sqrt(norm(row[0]));
                normalize(row[0]);
                out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
                row[1] = [ row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear ];
                out.scaley = math.sqrt(norm(row[1]));
                normalize(row[1]);
                out.shear /= out.scaley;
                var sin = -row[0][1], cos = row[1][1];
                if (cos < 0) {
                    out.rotate = deg(math.acos(cos));
                    if (sin < 0) {
                        out.rotate = 360 - out.rotate;
                    }
                } else {
                    out.rotate = deg(math.asin(sin));
                }
                out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
                out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
                out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
                return out;
            };
            matrixproto.toTransformString = function(shorter) {
                var s = shorter || this.split();
                if (s.isSimple) {
                    s.scalex = +s.scalex.toFixed(4);
                    s.scaley = +s.scaley.toFixed(4);
                    s.rotate = +s.rotate.toFixed(4);
                    return (s.dx || s.dy ? "t" + [ +s.dx.toFixed(4), +s.dy.toFixed(4) ] : E) + (s.scalex != 1 || s.scaley != 1 ? "s" + [ s.scalex, s.scaley, 0, 0 ] : E) + (s.rotate ? "r" + [ +s.rotate.toFixed(4), 0, 0 ] : E);
                } else {
                    return "m" + [ this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5) ];
                }
            };
        })(Matrix.prototype);
        Snap.Matrix = Matrix;
        Snap.getRGB = cacher(function(colour) {
            if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: "none",
                    error: 1,
                    toString: rgbtoString
                };
            }
            if (colour == "none") {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: "none",
                    toString: rgbtoString
                };
            }
            !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
            if (!colour) {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: "none",
                    error: 1,
                    toString: rgbtoString
                };
            }
            var res, red, green, blue, opacity, t, values, rgb = colour.match(colourRegExp);
            if (rgb) {
                if (rgb[2]) {
                    blue = toInt(rgb[2].substring(5), 16);
                    green = toInt(rgb[2].substring(3, 5), 16);
                    red = toInt(rgb[2].substring(1, 3), 16);
                }
                if (rgb[3]) {
                    blue = toInt((t = rgb[3].charAt(3)) + t, 16);
                    green = toInt((t = rgb[3].charAt(2)) + t, 16);
                    red = toInt((t = rgb[3].charAt(1)) + t, 16);
                }
                if (rgb[4]) {
                    values = rgb[4].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) == "%" && (red *= 2.55);
                    green = toFloat(values[1]);
                    values[1].slice(-1) == "%" && (green *= 2.55);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) == "%" && (blue *= 2.55);
                    rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                }
                if (rgb[5]) {
                    values = rgb[5].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) == "%" && (red /= 100);
                    green = toFloat(values[1]);
                    values[1].slice(-1) == "%" && (green /= 100);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) == "%" && (blue /= 100);
                    (values[0].slice(-3) == "deg" || values[0].slice(-1) == "°") && (red /= 360);
                    rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                    return Snap.hsb2rgb(red, green, blue, opacity);
                }
                if (rgb[6]) {
                    values = rgb[6].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) == "%" && (red /= 100);
                    green = toFloat(values[1]);
                    values[1].slice(-1) == "%" && (green /= 100);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) == "%" && (blue /= 100);
                    (values[0].slice(-3) == "deg" || values[0].slice(-1) == "°") && (red /= 360);
                    rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                    return Snap.hsl2rgb(red, green, blue, opacity);
                }
                red = mmin(math.round(red), 255);
                green = mmin(math.round(green), 255);
                blue = mmin(math.round(blue), 255);
                opacity = mmin(mmax(opacity, 0), 1);
                rgb = {
                    r: red,
                    g: green,
                    b: blue,
                    toString: rgbtoString
                };
                rgb.hex = "#" + (16777216 | blue | green << 8 | red << 16).toString(16).slice(1);
                rgb.opacity = is(opacity, "finite") ? opacity : 1;
                return rgb;
            }
            return {
                r: -1,
                g: -1,
                b: -1,
                hex: "none",
                error: 1,
                toString: rgbtoString
            };
        }, Snap);
        Snap.hsb = cacher(function(h, s, b) {
            return Snap.hsb2rgb(h, s, b).hex;
        });
        Snap.hsl = cacher(function(h, s, l) {
            return Snap.hsl2rgb(h, s, l).hex;
        });
        Snap.rgb = cacher(function(r, g, b, o) {
            if (is(o, "finite")) {
                var round = math.round;
                return "rgba(" + [ round(r), round(g), round(b), +o.toFixed(2) ] + ")";
            }
            return "#" + (16777216 | b | g << 8 | r << 16).toString(16).slice(1);
        });
        var toHex = function(color) {
            var i = glob.doc.getElementsByTagName("head")[0], red = "rgb(255, 0, 0)";
            toHex = cacher(function(color) {
                if (color.toLowerCase() == "red") {
                    return red;
                }
                i.style.color = red;
                i.style.color = color;
                var out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
                return out == red ? null : out;
            });
            return toHex(color);
        }, hsbtoString = function() {
            return "hsb(" + [ this.h, this.s, this.b ] + ")";
        }, hsltoString = function() {
            return "hsl(" + [ this.h, this.s, this.l ] + ")";
        }, rgbtoString = function() {
            return this.opacity == 1 || this.opacity == null ? this.hex : "rgba(" + [ this.r, this.g, this.b, this.opacity ] + ")";
        }, prepareRGB = function(r, g, b) {
            if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in r) {
                b = r.b;
                g = r.g;
                r = r.r;
            }
            if (g == null && is(r, string)) {
                var clr = Snap.getRGB(r);
                r = clr.r;
                g = clr.g;
                b = clr.b;
            }
            if (r > 1 || g > 1 || b > 1) {
                r /= 255;
                g /= 255;
                b /= 255;
            }
            return [ r, g, b ];
        }, packageRGB = function(r, g, b, o) {
            r = math.round(r * 255);
            g = math.round(g * 255);
            b = math.round(b * 255);
            var rgb = {
                r: r,
                g: g,
                b: b,
                opacity: is(o, "finite") ? o : 1,
                hex: Snap.rgb(r, g, b),
                toString: rgbtoString
            };
            is(o, "finite") && (rgb.opacity = o);
            return rgb;
        };
        Snap.color = function(clr) {
            var rgb;
            if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
                rgb = Snap.hsb2rgb(clr);
                clr.r = rgb.r;
                clr.g = rgb.g;
                clr.b = rgb.b;
                clr.opacity = 1;
                clr.hex = rgb.hex;
            } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
                rgb = Snap.hsl2rgb(clr);
                clr.r = rgb.r;
                clr.g = rgb.g;
                clr.b = rgb.b;
                clr.opacity = 1;
                clr.hex = rgb.hex;
            } else {
                if (is(clr, "string")) {
                    clr = Snap.getRGB(clr);
                }
                if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr && !("error" in clr)) {
                    rgb = Snap.rgb2hsl(clr);
                    clr.h = rgb.h;
                    clr.s = rgb.s;
                    clr.l = rgb.l;
                    rgb = Snap.rgb2hsb(clr);
                    clr.v = rgb.b;
                } else {
                    clr = {
                        hex: "none"
                    };
                    clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
                    clr.error = 1;
                }
            }
            clr.toString = rgbtoString;
            return clr;
        };
        Snap.hsb2rgb = function(h, s, v, o) {
            if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
                v = h.b;
                s = h.s;
                h = h.h;
                o = h.o;
            }
            h *= 360;
            var R, G, B, X, C;
            h = h % 360 / 60;
            C = v * s;
            X = C * (1 - abs(h % 2 - 1));
            R = G = B = v - C;
            h = ~~h;
            R += [ C, X, 0, 0, X, C ][h];
            G += [ X, C, C, X, 0, 0 ][h];
            B += [ 0, 0, X, C, C, X ][h];
            return packageRGB(R, G, B, o);
        };
        Snap.hsl2rgb = function(h, s, l, o) {
            if (is(h, "object") && "h" in h && "s" in h && "l" in h) {
                l = h.l;
                s = h.s;
                h = h.h;
            }
            if (h > 1 || s > 1 || l > 1) {
                h /= 360;
                s /= 100;
                l /= 100;
            }
            h *= 360;
            var R, G, B, X, C;
            h = h % 360 / 60;
            C = 2 * s * (l < .5 ? l : 1 - l);
            X = C * (1 - abs(h % 2 - 1));
            R = G = B = l - C / 2;
            h = ~~h;
            R += [ C, X, 0, 0, X, C ][h];
            G += [ X, C, C, X, 0, 0 ][h];
            B += [ 0, 0, X, C, C, X ][h];
            return packageRGB(R, G, B, o);
        };
        Snap.rgb2hsb = function(r, g, b) {
            b = prepareRGB(r, g, b);
            r = b[0];
            g = b[1];
            b = b[2];
            var H, S, V, C;
            V = mmax(r, g, b);
            C = V - mmin(r, g, b);
            H = C == 0 ? null : V == r ? (g - b) / C : V == g ? (b - r) / C + 2 : (r - g) / C + 4;
            H = (H + 360) % 6 * 60 / 360;
            S = C == 0 ? 0 : C / V;
            return {
                h: H,
                s: S,
                b: V,
                toString: hsbtoString
            };
        };
        Snap.rgb2hsl = function(r, g, b) {
            b = prepareRGB(r, g, b);
            r = b[0];
            g = b[1];
            b = b[2];
            var H, S, L, M, m, C;
            M = mmax(r, g, b);
            m = mmin(r, g, b);
            C = M - m;
            H = C == 0 ? null : M == r ? (g - b) / C : M == g ? (b - r) / C + 2 : (r - g) / C + 4;
            H = (H + 360) % 6 * 60 / 360;
            L = (M + m) / 2;
            S = C == 0 ? 0 : L < .5 ? C / (2 * L) : C / (2 - 2 * L);
            return {
                h: H,
                s: S,
                l: L,
                toString: hsltoString
            };
        };
        Snap.parsePathString = function(pathString) {
            if (!pathString) {
                return null;
            }
            var pth = Snap.path(pathString);
            if (pth.arr) {
                return Snap.path.clone(pth.arr);
            }
            var paramCounts = {
                a: 7,
                c: 6,
                o: 2,
                h: 1,
                l: 2,
                m: 2,
                r: 4,
                q: 4,
                s: 4,
                t: 2,
                v: 1,
                u: 3,
                z: 0
            }, data = [];
            if (is(pathString, "array") && is(pathString[0], "array")) {
                data = Snap.path.clone(pathString);
            }
            if (!data.length) {
                Str(pathString).replace(pathCommand, function(a, b, c) {
                    var params = [], name = b.toLowerCase();
                    c.replace(pathValues, function(a, b) {
                        b && params.push(+b);
                    });
                    if (name == "m" && params.length > 2) {
                        data.push([ b ].concat(params.splice(0, 2)));
                        name = "l";
                        b = b == "m" ? "l" : "L";
                    }
                    if (name == "o" && params.length == 1) {
                        data.push([ b, params[0] ]);
                    }
                    if (name == "r") {
                        data.push([ b ].concat(params));
                    } else while (params.length >= paramCounts[name]) {
                        data.push([ b ].concat(params.splice(0, paramCounts[name])));
                        if (!paramCounts[name]) {
                            break;
                        }
                    }
                });
            }
            data.toString = Snap.path.toString;
            pth.arr = Snap.path.clone(data);
            return data;
        };
        var parseTransformString = Snap.parseTransformString = function(TString) {
            if (!TString) {
                return null;
            }
            var paramCounts = {
                r: 3,
                s: 4,
                t: 2,
                m: 6
            }, data = [];
            if (is(TString, "array") && is(TString[0], "array")) {
                data = Snap.path.clone(TString);
            }
            if (!data.length) {
                Str(TString).replace(tCommand, function(a, b, c) {
                    var params = [], name = b.toLowerCase();
                    c.replace(pathValues, function(a, b) {
                        b && params.push(+b);
                    });
                    data.push([ b ].concat(params));
                });
            }
            data.toString = Snap.path.toString;
            return data;
        };
        function svgTransform2string(tstr) {
            var res = [];
            tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, function(all, name, params) {
                params = params.split(/\s*,\s*/);
                if (name == "rotate" && params.length == 1) {
                    params.push(0, 0);
                }
                if (name == "scale") {
                    if (params.length == 2) {
                        params.push(0, 0);
                    }
                    if (params.length == 1) {
                        params.push(params[0], 0, 0);
                    }
                }
                if (name == "skewX") {
                    res.push([ "m", 1, 0, math.tan(rad(params[0])), 1, 0, 0 ]);
                } else if (name == "skewY") {
                    res.push([ "m", 1, math.tan(rad(params[0])), 0, 1, 0, 0 ]);
                } else {
                    res.push([ name.charAt(0) ].concat(params));
                }
                return all;
            });
            return res;
        }
        var rgTransform = new RegExp("^[a-z][" + spaces + "]*-?\\.?\\d");
        function transform2matrix(tstr, bbox) {
            var tdata = parseTransformString(tstr), m = new Matrix();
            if (tdata) {
                for (var i = 0, ii = tdata.length; i < ii; i++) {
                    var t = tdata[i], tlen = t.length, command = Str(t[0]).toLowerCase(), absolute = t[0] != command, inver = absolute ? m.invert() : 0, x1, y1, x2, y2, bb;
                    if (command == "t" && tlen == 3) {
                        if (absolute) {
                            x1 = inver.x(0, 0);
                            y1 = inver.y(0, 0);
                            x2 = inver.x(t[1], t[2]);
                            y2 = inver.y(t[1], t[2]);
                            m.translate(x2 - x1, y2 - y1);
                        } else {
                            m.translate(t[1], t[2]);
                        }
                    } else if (command == "r") {
                        if (tlen == 2) {
                            bb = bb || bbox;
                            m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                        } else if (tlen == 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.rotate(t[1], x2, y2);
                            } else {
                                m.rotate(t[1], t[2], t[3]);
                            }
                        }
                    } else if (command == "s") {
                        if (tlen == 2 || tlen == 3) {
                            bb = bb || bbox;
                            m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                        } else if (tlen == 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.scale(t[1], t[1], x2, y2);
                            } else {
                                m.scale(t[1], t[1], t[2], t[3]);
                            }
                        } else if (tlen == 5) {
                            if (absolute) {
                                x2 = inver.x(t[3], t[4]);
                                y2 = inver.y(t[3], t[4]);
                                m.scale(t[1], t[2], x2, y2);
                            } else {
                                m.scale(t[1], t[2], t[3], t[4]);
                            }
                        }
                    } else if (command == "m" && tlen == 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                }
            }
            return m;
        }
        Snap._.transform2matrix = transform2matrix;
        function extractTransform(el, tstr) {
            if (tstr == null) {
                var doReturn = true;
                if (el.type == "linearGradient" || el.type == "radialGradient") {
                    tstr = el.node.getAttribute("gradientTransform");
                } else if (el.type == "pattern") {
                    tstr = el.node.getAttribute("patternTransform");
                } else {
                    tstr = el.node.getAttribute("transform");
                }
                if (!tstr) {
                    return new Matrix();
                }
                tstr = svgTransform2string(tstr);
            } else {
                if (!rgTransform.test(tstr)) {
                    tstr = svgTransform2string(tstr);
                } else {
                    tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
                }
                if (is(tstr, "array")) {
                    tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
                }
                el._.transform = tstr;
            }
            var m = transform2matrix(tstr, el.getBBox(1));
            if (doReturn) {
                return m;
            } else {
                el.matrix = m;
            }
        }
        Snap._unit2px = unit2px;
        function getSomeDefs(el) {
            if (Snap._.someDefs) {
                return Snap._.someDefs;
            }
            var p = el.paper || el.node.parentNode && Snap(el.node.parentNode) || Snap.select("svg") || Snap(0, 0), defs = p.select("defs").node;
            if (!defs) {
                defs = make("defs", p.node).node;
            }
            Snap._.someDefs = defs;
            return defs;
        }
        Snap._.getSomeDefs = getSomeDefs;
        function unit2px(el, name, value) {
            var defs = getSomeDefs(el), out = {}, mgr = defs.querySelector(".svg---mgr");
            if (!mgr) {
                mgr = $("rect");
                $(mgr, {
                    width: 10,
                    height: 10,
                    "class": "svg---mgr"
                });
                defs.appendChild(mgr);
            }
            function getW(val) {
                if (val == null) {
                    return E;
                }
                if (val == +val) {
                    return val;
                }
                $(mgr, {
                    width: val
                });
                return mgr.getBBox().width;
            }
            function getH(val) {
                if (val == null) {
                    return E;
                }
                if (val == +val) {
                    return val;
                }
                $(mgr, {
                    height: val
                });
                return mgr.getBBox().height;
            }
            function set(nam, f) {
                if (name == null) {
                    out[nam] = f(el.attr(nam));
                } else if (nam == name) {
                    out = f(value == null ? el.attr(nam) : value);
                }
            }
            switch (el.type) {
              case "rect":
                set("rx", getW);
                set("ry", getH);

              case "image":
                set("width", getW);
                set("height", getH);

              case "text":
                set("x", getW);
                set("y", getH);
                break;

              case "circle":
                set("cx", getW);
                set("cy", getH);
                set("r", getW);
                break;

              case "ellipse":
                set("cx", getW);
                set("cy", getH);
                set("rx", getW);
                set("ry", getH);
                break;

              case "line":
                set("x1", getW);
                set("x2", getW);
                set("y1", getH);
                set("y2", getH);
                break;

              case "marker":
                set("refX", getW);
                set("markerWidth", getW);
                set("refY", getH);
                set("markerHeight", getH);
                break;

              case "radialGradient":
                set("fx", getW);
                set("fy", getH);
                break;

              case "tspan":
                set("dx", getW);
                set("dy", getH);
                break;

              default:
                set(name, getW);
            }
            return out;
        }
        Snap.select = function(query) {
            return wrap(glob.doc.querySelector(query));
        };
        Snap.selectAll = function(query) {
            var nodelist = glob.doc.querySelectorAll(query), set = (Snap.set || Array)();
            for (var i = 0; i < nodelist.length; i++) {
                set.push(wrap(nodelist[i]));
            }
            return set;
        };
        function add2group(list) {
            if (!is(list, "array")) {
                list = Array.prototype.slice.call(arguments, 0);
            }
            var i = 0, j = 0, node = this.node;
            while (this[i]) delete this[i++];
            for (i = 0; i < list.length; i++) {
                if (list[i].type == "set") {
                    list[i].forEach(function(el) {
                        node.appendChild(el.node);
                    });
                } else {
                    node.appendChild(list[i].node);
                }
            }
            var children = node.childNodes;
            for (i = 0; i < children.length; i++) if (children[i].snap) {
                this[j++] = hub[children[i].snap];
            }
        }
        function Element(el) {
            if (el.snap in hub) {
                return hub[el.snap];
            }
            var id = this.id = ID(), svg;
            try {
                svg = el.ownerSVGElement;
            } catch (e) {}
            this.node = el;
            if (svg) {
                this.paper = new Paper(svg);
            }
            this.type = el.tagName;
            this.anims = {};
            this._ = {
                transform: [],
                sx: 1,
                sy: 1,
                deg: 0,
                dx: 0,
                dy: 0,
                dirty: 1
            };
            el.snap = id;
            hub[id] = this;
            if (this.type == "g") {
                this.add = add2group;
                for (var method in Paper.prototype) if (Paper.prototype[has](method)) {
                    this[method] = Paper.prototype[method];
                }
            }
        }
        function arrayFirstValue(arr) {
            var res;
            for (var i = 0, ii = arr.length; i < ii; i++) {
                res = res || arr[i];
                if (res) {
                    return res;
                }
            }
        }
        (function(elproto) {
            elproto.attr = function(params, value) {
                var el = this, node = el.node;
                if (!params) {
                    return el;
                }
                if (is(params, "string")) {
                    if (arguments.length > 1) {
                        var json = {};
                        json[params] = value;
                        params = json;
                    } else {
                        return arrayFirstValue(eve("snap.util.getattr." + params, el));
                    }
                }
                for (var att in params) {
                    if (params[has](att)) {
                        eve("snap.util.attr." + att, el, params[att]);
                    }
                }
                return el;
            };
            elproto.getBBox = function(isWithoutTransform) {
                var el = this;
                if (el.type == "use") {
                    el = el.original;
                }
                if (el.removed) {
                    return {};
                }
                var _ = el._;
                if (isWithoutTransform) {
                    if (_.dirty || !_.bboxwt) {
                        el.realPath = Snap.path.get[el.type](el);
                        _.bboxwt = Snap.path.getBBox(el.realPath);
                        _.bboxwt.toString = x_y_w_h;
                        _.dirty = 0;
                    }
                    return Snap._.box(_.bboxwt);
                }
                if (_.dirty || _.dirtyT || !_.bbox) {
                    if (_.dirty || !el.realPath) {
                        _.bboxwt = 0;
                        el.realPath = Snap.path.get[el.type](el);
                    }
                    _.bbox = Snap.path.getBBox(Snap.path.map(el.realPath, el.matrix));
                    _.bbox.toString = x_y_w_h;
                    _.dirty = _.dirtyT = 0;
                }
                return Snap._.box(_.bbox);
            };
            var propString = function() {
                return this.string;
            };
            elproto.transform = function(tstr) {
                var _ = this._;
                if (tstr == null) {
                    var global = new Matrix(this.node.getCTM()), local = extractTransform(this), localString = local.toTransformString(), string = Str(local) == Str(this.matrix) ? _.transform : localString;
                    return {
                        string: string,
                        globalMatrix: global,
                        localMatrix: local,
                        diffMatrix: global.clone().add(local.invert()),
                        global: global.toTransformString(),
                        local: localString,
                        toString: propString
                    };
                }
                if (tstr instanceof Matrix) {
                    tstr = tstr.toTransformString();
                }
                extractTransform(this, tstr);
                if (this.node) {
                    if (this.type == "linearGradient" || this.type == "radialGradient") {
                        $(this.node, {
                            gradientTransform: this.matrix
                        });
                    } else if (this.type == "pattern") {
                        $(this.node, {
                            patternTransform: this.matrix
                        });
                    } else {
                        $(this.node, {
                            transform: this.matrix
                        });
                    }
                }
                return this;
            };
            elproto.parent = function() {
                return wrap(this.node.parentNode);
            };
            elproto.append = elproto.add = function(el) {
                if (el.type == "set") {
                    var it = this;
                    el.forEach(function(el) {
                        it.append(el);
                    });
                    return this;
                }
                el = wrap(el);
                this.node.appendChild(el.node);
                el.paper = this.paper;
                return this;
            };
            elproto.prepend = function(el) {
                el = wrap(el);
                this.node.insertBefore(el.node, this.node.firstChild);
                el.paper = this.paper;
                return this;
            };
            elproto.before = function(el) {
                el = wrap(el);
                this.node.parentNode.insertBefore(el.node, this.node);
                el.paper = this.paper;
                return this;
            };
            elproto.after = function(el) {
                el = wrap(el);
                this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
                el.paper = this.paper;
                return this;
            };
            elproto.insertBefore = function(el) {
                el = wrap(el);
                el.node.parentNode.insertBefore(this.node, el.node);
                this.paper = el.paper;
                return this;
            };
            elproto.insertAfter = function(el) {
                el = wrap(el);
                el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
                this.paper = el.paper;
                return this;
            };
            elproto.remove = function() {
                this.node.parentNode && this.node.parentNode.removeChild(this.node);
                delete this.paper;
                this.removed = true;
                return this;
            };
            elproto.select = function(query) {
                return wrap(this.node.querySelector(query));
            };
            elproto.selectAll = function(query) {
                var nodelist = this.node.querySelectorAll(query), set = (Snap.set || Array)();
                for (var i = 0; i < nodelist.length; i++) {
                    set.push(wrap(nodelist[i]));
                }
                return set;
            };
            elproto.asPX = function(attr, value) {
                if (value == null) {
                    value = this.attr(attr);
                }
                return unit2px(this, attr, value);
            };
            elproto.use = function() {
                var use, id = this.node.id;
                if (!id) {
                    id = this.id;
                    $(this.node, {
                        id: id
                    });
                }
                if (this.type == "linearGradient" || this.type == "radialGradient" || this.type == "pattern") {
                    use = make(this.type, this.node.parentNode);
                } else {
                    use = make("use", this.node.parentNode);
                }
                $(use.node, {
                    "xlink:href": "#" + id
                });
                use.original = this;
                return use;
            };
            function fixids(el) {
                var els = el.selectAll("*"), it, url = /^\s*url\(("|'|)(.*)\1\)\s*$/, ids = [], uses = {};
                function urltest(it, name) {
                    var val = $(it.node, name);
                    val = val && val.match(url);
                    val = val && val[2];
                    if (val && val.charAt() == "#") {
                        val = val.substring(1);
                    } else {
                        return;
                    }
                    if (val) {
                        uses[val] = (uses[val] || []).concat(function(id) {
                            var attr = {};
                            attr[name] = "url(#" + id + ")";
                            $(it.node, attr);
                        });
                    }
                }
                function linktest(it) {
                    var val = $(it.node, "xlink:href");
                    if (val && val.charAt() == "#") {
                        val = val.substring(1);
                    } else {
                        return;
                    }
                    if (val) {
                        uses[val] = (uses[val] || []).concat(function(id) {
                            it.attr("xlink:href", "#" + id);
                        });
                    }
                }
                for (var i = 0, ii = els.length; i < ii; i++) {
                    it = els[i];
                    urltest(it, "fill");
                    urltest(it, "stroke");
                    urltest(it, "filter");
                    urltest(it, "mask");
                    urltest(it, "clip-path");
                    linktest(it);
                    var oldid = $(it.node, "id");
                    if (oldid) {
                        $(it.node, {
                            id: it.id
                        });
                        ids.push({
                            old: oldid,
                            id: it.id
                        });
                    }
                }
                for (i = 0, ii = ids.length; i < ii; i++) {
                    var fs = uses[ids[i].old];
                    if (fs) {
                        for (var j = 0, jj = fs.length; j < jj; j++) {
                            fs[j](ids[i].id);
                        }
                    }
                }
            }
            elproto.clone = function() {
                var clone = wrap(this.node.cloneNode(true));
                if ($(clone.node, "id")) {
                    $(clone.node, {
                        id: clone.id
                    });
                }
                fixids(clone);
                clone.insertAfter(this);
                return clone;
            };
            elproto.toDefs = function() {
                var defs = getSomeDefs(this);
                defs.appendChild(this.node);
                return this;
            };
            elproto.pattern = function(x, y, width, height) {
                var p = make("pattern", getSomeDefs(this));
                if (x == null) {
                    x = this.getBBox();
                }
                if (x && "x" in x) {
                    y = x.y;
                    width = x.width;
                    height = x.height;
                    x = x.x;
                }
                $(p.node, {
                    x: x,
                    y: y,
                    width: width,
                    height: height,
                    patternUnits: "userSpaceOnUse",
                    id: p.id,
                    viewBox: [ x, y, width, height ].join(" ")
                });
                p.node.appendChild(this.node);
                return p;
            };
            elproto.marker = function(x, y, width, height, refX, refY) {
                var p = make("marker", getSomeDefs(this));
                if (x == null) {
                    x = this.getBBox();
                }
                if (x && "x" in x) {
                    y = x.y;
                    width = x.width;
                    height = x.height;
                    refX = x.refX || x.cx;
                    refY = x.refY || x.cy;
                    x = x.x;
                }
                $(p.node, {
                    viewBox: [ x, y, width, height ].join(S),
                    markerWidth: width,
                    markerHeight: height,
                    orient: "auto",
                    refX: refX || 0,
                    refY: refY || 0,
                    id: p.id
                });
                p.node.appendChild(this.node);
                return p;
            };
            function slice(from, to, f) {
                return function(arr) {
                    var res = arr.slice(from, to);
                    if (res.length == 1) {
                        res = res[0];
                    }
                    return f ? f(res) : res;
                };
            }
            var Animation = function(attr, ms, easing, callback) {
                if (typeof easing == "function" && !easing.length) {
                    callback = easing;
                    easing = mina.linear;
                }
                this.attr = attr;
                this.dur = ms;
                easing && (this.easing = easing);
                callback && (this.callback = callback);
            };
            Snap.animation = function(attr, ms, easing, callback) {
                return new Animation(attr, ms, easing, callback);
            };
            elproto.inAnim = function() {
                var el = this, res = [];
                for (var id in el.anims) if (el.anims[has](id)) {
                    (function(a) {
                        res.push({
                            anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
                            curStatus: a.status(),
                            status: function(val) {
                                return a.status(val);
                            },
                            stop: function() {
                                a.stop();
                            }
                        });
                    })(el.anims[id]);
                }
                return res;
            };
            Snap.animate = function(from, to, setter, ms, easing, callback) {
                if (typeof easing == "function" && !easing.length) {
                    callback = easing;
                    easing = mina.linear;
                }
                var now = mina.time(), anim = mina(from, to, now, now + ms, mina.time, setter, easing);
                callback && eve.once("mina.finish." + anim.id, callback);
                return anim;
            };
            elproto.stop = function() {
                var anims = this.inAnim();
                for (var i = 0, ii = anims.length; i < ii; i++) {
                    anims[i].stop();
                }
                return this;
            };
            elproto.animate = function(attrs, ms, easing, callback) {
                if (typeof easing == "function" && !easing.length) {
                    callback = easing;
                    easing = mina.linear;
                }
                if (attrs instanceof Animation) {
                    callback = attrs.callback;
                    easing = attrs.easing;
                    ms = easing.dur;
                    attrs = attrs.attr;
                }
                var fkeys = [], tkeys = [], keys = {}, from, to, f, eq, el = this;
                for (var key in attrs) if (attrs[has](key)) {
                    if (el.equal) {
                        eq = el.equal(key, Str(attrs[key]));
                        from = eq.from;
                        to = eq.to;
                        f = eq.f;
                    } else {
                        from = +el.attr(key);
                        to = +attrs[key];
                    }
                    var len = is(from, "array") ? from.length : 1;
                    keys[key] = slice(fkeys.length, fkeys.length + len, f);
                    fkeys = fkeys.concat(from);
                    tkeys = tkeys.concat(to);
                }
                var now = mina.time(), anim = mina(fkeys, tkeys, now, now + ms, mina.time, function(val) {
                    var attr = {};
                    for (var key in keys) if (keys[has](key)) {
                        attr[key] = keys[key](val);
                    }
                    el.attr(attr);
                }, easing);
                el.anims[anim.id] = anim;
                anim._attrs = attrs;
                anim._callback = callback;
                eve.once("mina.finish." + anim.id, function() {
                    delete el.anims[anim.id];
                    callback && callback.call(el);
                });
                eve.once("mina.stop." + anim.id, function() {
                    delete el.anims[anim.id];
                });
                return el;
            };
            var eldata = {};
            elproto.data = function(key, value) {
                var data = eldata[this.id] = eldata[this.id] || {};
                if (arguments.length == 1) {
                    if (Snap.is(key, "object")) {
                        for (var i in key) if (key[has](i)) {
                            this.data(i, key[i]);
                        }
                        return this;
                    }
                    eve("snap.data.get." + this.id, this, data[key], key);
                    return data[key];
                }
                data[key] = value;
                eve("snap.data.set." + this.id, this, value, key);
                return this;
            };
            elproto.removeData = function(key) {
                if (key == null) {
                    eldata[this.id] = {};
                } else {
                    eldata[this.id] && delete eldata[this.id][key];
                }
                return this;
            };
            elproto.toString = toString(1);
            elproto.innerSVG = toString();
            function toString(type) {
                return function() {
                    var res = type ? "<" + this.type : "", attr = this.node.attributes, chld = this.node.childNodes;
                    if (type) {
                        for (var i = 0, ii = attr.length; i < ii; i++) {
                            res += " " + attr[i].name + '="' + attr[i].value.replace(/"/g, '\\"') + '"';
                        }
                    }
                    if (chld.length) {
                        type && (res += ">");
                        for (i = 0, ii = chld.length; i < ii; i++) {
                            if (chld[i].nodeType == 3) {
                                res += chld[i].nodeValue;
                            } else if (chld[i].nodeType == 1) {
                                res += wrap(chld[i]).toString();
                            }
                        }
                        type && (res += "</" + this.type + ">");
                    } else {
                        type && (res += "/>");
                    }
                    return res;
                };
            }
        })(Element.prototype);
        Snap.parse = function(svg) {
            var f = glob.doc.createDocumentFragment(), pointer = f;
            eve.on("elemental.tag", function(data, extra, raw) {
                var tag = $(data);
                extra && $(tag, extra);
                pointer.appendChild(tag);
                pointer = tag;
            });
            eve.on("elemental.text", function(text) {
                pointer.appendChild(glob.doc.createTextNode(text));
            });
            eve.on("elemental./tag", function() {
                pointer = pointer.parentNode;
            });
            eve.on("elemental.eof", function() {
                eve.off("elemental.*");
                eve("snap.parsed", f);
            });
            elemental().parse(svg).end();
            return new Fragment(f);
        };
        function Fragment(frag) {
            this.node = frag;
        }
        Fragment.prototype.select = Element.prototype.select;
        Fragment.prototype.selectAll = Element.prototype.selectAll;
        Snap.fragment = function() {
            var args = Array.prototype.slice.call(arguments, 0), f = glob.doc.createDocumentFragment();
            for (var i = 0, ii = args.length; i < ii; i++) {
                var item = args[i];
                if (item.node && item.node.nodeType) {
                    f.appendChild(item.node);
                }
                if (item.nodeType) {
                    f.appendChild(item);
                }
                if (typeof item == "string") {
                    f.appendChild(Snap.parse(item).node);
                }
            }
            return new Fragment(f);
        };
        function make(name, parent) {
            var res = $(name);
            parent.appendChild(res);
            var el = wrap(res);
            el.type = name;
            return el;
        }
        function Paper(w, h) {
            var res, desc, defs, proto = Paper.prototype;
            if (w && w.tagName == "svg") {
                if (w.snap in hub) {
                    return hub[w.snap];
                }
                res = new Element(w);
                desc = w.getElementsByTagName("desc")[0];
                defs = w.getElementsByTagName("defs")[0];
                if (!desc) {
                    desc = $("desc");
                    desc.appendChild(glob.doc.createTextNode("Created with Snap"));
                    res.node.appendChild(desc);
                }
                if (!defs) {
                    defs = $("defs");
                    res.node.appendChild(defs);
                }
                res.defs = defs;
                for (var key in proto) if (proto[has](key)) {
                    res[key] = proto[key];
                }
                res.paper = res.root = res;
            } else {
                res = make("svg", glob.doc.body);
                $(res.node, {
                    height: h,
                    version: 1.1,
                    width: w,
                    xmlns: "http://www.w3.org/2000/svg"
                });
            }
            return res;
        }
        function wrap(dom) {
            if (!dom) {
                return dom;
            }
            if (dom instanceof Element || dom instanceof Fragment) {
                return dom;
            }
            if (dom.tagName == "svg") {
                return new Paper(dom);
            }
            return new Element(dom);
        }
        function Gstops() {
            return this.selectAll("stop");
        }
        function GaddStop(color, offset) {
            var stop = $("stop"), attr = {
                offset: +offset + "%"
            };
            color = Snap.color(color);
            attr["stop-color"] = color.hex;
            if (color.opacity < 1) {
                attr["stop-opacity"] = color.opacity;
            }
            $(stop, attr);
            this.node.appendChild(stop);
            return this;
        }
        function GgetBBox() {
            if (this.type == "linearGradient") {
                var x1 = $(this.node, "x1") || 0, x2 = $(this.node, "x2") || 1, y1 = $(this.node, "y1") || 0, y2 = $(this.node, "y2") || 0;
                return Snap._.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
            } else {
                var cx = this.node.cx || .5, cy = this.node.cy || .5, r = this.node.r || 0;
                return Snap._.box(cx - r, cy - r, r * 2, r * 2);
            }
        }
        function gradient(defs, str) {
            var grad = arrayFirstValue(eve("snap.util.grad.parse", null, str)), el;
            if (!grad) {
                return null;
            }
            grad.params.unshift(defs);
            if (grad.type.toLowerCase() == "l") {
                el = gradientLinear.apply(0, grad.params);
            } else {
                el = gradientRadial.apply(0, grad.params);
            }
            if (grad.type != grad.type.toLowerCase()) {
                $(el.node, {
                    gradientUnits: "userSpaceOnUse"
                });
            }
            var stops = grad.stops, len = stops.length, start = 0, j = 0;
            function seed(i, end) {
                var step = (end - start) / (i - j);
                for (var k = j; k < i; k++) {
                    stops[k].offset = +(+start + step * (k - j)).toFixed(2);
                }
                j = i;
                start = end;
            }
            len--;
            for (var i = 0; i < len; i++) if ("offset" in stops[i]) {
                seed(i, stops[i].offset);
            }
            stops[len].offset = stops[len].offset || 100;
            seed(len, stops[len].offset);
            for (i = 0; i <= len; i++) {
                var stop = stops[i];
                el.addStop(stop.color, stop.offset);
            }
            return el;
        }
        function gradientLinear(defs, x1, y1, x2, y2) {
            var el = make("linearGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (x1 != null) {
                $(el.node, {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2
                });
            }
            return el;
        }
        function gradientRadial(defs, cx, cy, r, fx, fy) {
            var el = make("radialGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (cx != null) {
                $(el.node, {
                    cx: cx,
                    cy: cy,
                    r: r
                });
            }
            if (fx != null && fy != null) {
                $(el.node, {
                    fx: fx,
                    fy: fy
                });
            }
            return el;
        }
        (function(proto) {
            proto.el = function(name, attr) {
                return make(name, this.node).attr(attr);
            };
            proto.rect = function(x, y, w, h, rx, ry) {
                var el = make("rect", this.node);
                if (ry == null) {
                    ry = rx;
                }
                if (is(x, "object") && "x" in x) {
                    el.attr(x);
                } else if (x != null) {
                    el.attr({
                        x: x,
                        y: y,
                        width: w,
                        height: h
                    });
                    if (rx != null) {
                        el.attr({
                            rx: rx,
                            ry: ry
                        });
                    }
                }
                return el;
            };
            proto.circle = function(cx, cy, r) {
                var el = make("circle", this.node);
                if (is(cx, "object") && "cx" in cx) {
                    el.attr(cx);
                } else if (cx != null) {
                    el.attr({
                        cx: cx,
                        cy: cy,
                        r: r
                    });
                }
                return el;
            };
            proto.image = function(src, x, y, width, height) {
                var el = make("image", this.node);
                if (is(src, "object") && "src" in src) {
                    el.attr(src);
                } else if (src != null) {
                    var set = {
                        "xlink:href": src,
                        preserveAspectRatio: "none"
                    };
                    if (x != null && y != null) {
                        set.x = x;
                        set.y = y;
                    }
                    if (width != null && height != null) {
                        set.width = width;
                        set.height = height;
                    } else {
                        preload(src, function() {
                            $(el.node, {
                                width: this.offsetWidth,
                                height: this.offsetHeight
                            });
                        });
                    }
                    $(el.node, set);
                }
                return el;
            };
            proto.ellipse = function(cx, cy, rx, ry) {
                var el = make("ellipse", this.node);
                if (is(cx, "object") && "cx" in cx) {
                    el.attr(cx);
                } else if (cx != null) {
                    el.attr({
                        cx: cx,
                        cy: cy,
                        rx: rx,
                        ry: ry
                    });
                }
                return el;
            };
            proto.path = function(d) {
                var el = make("path", this.node);
                if (is(d, "object") && !is(d, "array")) {
                    el.attr(d);
                } else if (d) {
                    el.attr({
                        d: d
                    });
                }
                return el;
            };
            proto.group = proto.g = function(first) {
                var el = make("g", this.node);
                el.add = add2group;
                for (var method in proto) if (proto[has](method)) {
                    el[method] = proto[method];
                }
                if (arguments.length == 1 && first && !first.type) {
                    el.attr(first);
                } else if (arguments.length) {
                    el.add(Array.prototype.slice.call(arguments, 0));
                }
                return el;
            };
            proto.text = function(x, y, text) {
                var el = make("text", this.node);
                if (is(x, "object")) {
                    el.attr(x);
                } else if (x != null) {
                    el.attr({
                        x: x,
                        y: y,
                        text: text || ""
                    });
                }
                return el;
            };
            proto.line = function(x1, y1, x2, y2) {
                var el = make("line", this.node);
                if (is(x1, "object")) {
                    el.attr(x1);
                } else if (x1 != null) {
                    el.attr({
                        x1: x1,
                        x2: x2,
                        y1: y1,
                        y2: y2
                    });
                }
                return el;
            };
            proto.polyline = function(points) {
                if (arguments.length > 1) {
                    points = Array.prototype.slice.call(arguments, 0);
                }
                var el = make("polyline", this.node);
                if (is(points, "object") && !is(points, "array")) {
                    el.attr(points);
                } else if (points != null) {
                    el.attr({
                        points: points
                    });
                }
                return el;
            };
            proto.polygon = function(points) {
                if (arguments.length > 1) {
                    points = Array.prototype.slice.call(arguments, 0);
                }
                var el = make("polygon", this.node);
                if (is(points, "object") && !is(points, "array")) {
                    el.attr(points);
                } else if (points != null) {
                    el.attr({
                        points: points
                    });
                }
                return el;
            };
            (function() {
                proto.gradient = function(str) {
                    return gradient(this.defs, str);
                };
                proto.gradientLinear = function(x1, y1, x2, y2) {
                    return gradientLinear(this.defs, x1, y1, x2, y2);
                };
                proto.gradientRadial = function(cx, cy, r, fx, fy) {
                    return gradientRadial(this.defs, cx, cy, r, fx, fy);
                };
                proto.toString = function() {
                    var f = glob.doc.createDocumentFragment(), d = glob.doc.createElement("div"), svg = this.node.cloneNode(true), res;
                    f.appendChild(d);
                    d.appendChild(svg);
                    $(svg, {
                        xmlns: "http://www.w3.org/2000/svg"
                    });
                    res = d.innerHTML;
                    f.removeChild(f.firstChild);
                    return res;
                };
                proto.clear = function() {
                    var node = this.node.firstChild, next;
                    while (node) {
                        next = node.nextSibling;
                        if (node.tagName != "defs") {
                            node.parentNode.removeChild(node);
                        }
                        node = next;
                    }
                };
            })();
        })(Paper.prototype);
        Snap.ajax = function(url, postData, callback, scope) {
            var req = new XMLHttpRequest(), id = ID();
            if (req) {
                if (is(postData, "function")) {
                    scope = callback;
                    callback = postData;
                    postData = null;
                } else if (is(postData, "object")) {
                    var pd = [];
                    for (var key in postData) if (postData.hasOwnProperty(key)) {
                        pd.push(encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]));
                    }
                    postData = pd.join("&");
                }
                req.open(postData ? "POST" : "GET", url, true);
                req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                if (postData) {
                    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                }
                if (callback) {
                    eve.once("snap.ajax." + id + ".0", callback);
                    eve.once("snap.ajax." + id + ".200", callback);
                    eve.once("snap.ajax." + id + ".304", callback);
                }
                req.onreadystatechange = function() {
                    if (req.readyState != 4) return;
                    eve("snap.ajax." + id + "." + req.status, scope, req);
                };
                if (req.readyState == 4) {
                    return req;
                }
                req.send(postData);
                return req;
            }
        };
        Snap.load = function(url, callback, scope) {
            Snap.ajax(url, function(req) {
                var f = Snap.parse(req.responseText);
                scope ? callback.call(scope, f) : callback(f);
            });
        };
        eve.on("snap.util.attr.mask", function(value) {
            if (value instanceof Element || value instanceof Fragment) {
                eve.stop();
                if (value instanceof Fragment && value.node.childNodes.length == 1) {
                    value = value.node.firstChild;
                    getSomeDefs(this).appendChild(value);
                    value = wrap(value);
                }
                if (value.type == "mask") {
                    var mask = value;
                } else {
                    mask = make("mask", getSomeDefs(this));
                    mask.node.appendChild(value.node);
                    !mask.node.id && $(mask.node, {
                        id: mask.id
                    });
                }
                $(this.node, {
                    mask: "url(#" + mask.id + ")"
                });
            }
        });
        (function(clipIt) {
            eve.on("snap.util.attr.clip", clipIt);
            eve.on("snap.util.attr.clip-path", clipIt);
            eve.on("snap.util.attr.clipPath", clipIt);
        })(function(value) {
            if (value instanceof Element || value instanceof Fragment) {
                eve.stop();
                if (value.type == "clipPath") {
                    var clip = value;
                } else {
                    clip = make("clipPath", getSomeDefs(this));
                    clip.node.appendChild(value.node);
                    !clip.node.id && $(clip.node, {
                        id: clip.id
                    });
                }
                $(this.node, {
                    "clip-path": "url(#" + clip.id + ")"
                });
            }
        });
        function fillStroke(name) {
            return function(value) {
                eve.stop();
                if (value instanceof Fragment && value.node.childNodes.length == 1 && (value.node.firstChild.tagName == "radialGradient" || value.node.firstChild.tagName == "linearGradient" || value.node.firstChild.tagName == "pattern")) {
                    value = value.node.firstChild;
                    getSomeDefs(this).appendChild(value);
                    value = wrap(value);
                }
                if (value instanceof Element) {
                    if (value.type == "radialGradient" || value.type == "linearGradient" || value.type == "pattern") {
                        if (!value.node.id) {
                            $(value.node, {
                                id: value.id
                            });
                        }
                        var fill = "url(#" + value.node.id + ")";
                    } else {
                        fill = value.attr(name);
                    }
                } else {
                    fill = Snap.color(value);
                    if (fill.error) {
                        var grad = gradient(getSomeDefs(this), value);
                        if (grad) {
                            if (!grad.node.id) {
                                $(grad.node, {
                                    id: grad.id
                                });
                            }
                            fill = "url(#" + grad.node.id + ")";
                        } else {
                            fill = value;
                        }
                    } else {
                        fill = Str(fill);
                    }
                }
                var attrs = {};
                attrs[name] = fill;
                $(this.node, attrs);
                this.node.style[name] = E;
            };
        }
        eve.on("snap.util.attr.fill", fillStroke("fill"));
        eve.on("snap.util.attr.stroke", fillStroke("stroke"));
        var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
        eve.on("snap.util.grad.parse", function parseGrad(string) {
            string = Str(string);
            var tokens = string.match(gradrg);
            if (!tokens) {
                return null;
            }
            var type = tokens[1], params = tokens[2], stops = tokens[3];
            params = params.split(/\s*,\s*/).map(function(el) {
                return +el == el ? +el : el;
            });
            if (params.length == 1 && params[0] == 0) {
                params = [];
            }
            stops = stops.split("-");
            stops = stops.map(function(el) {
                el = el.split(":");
                var out = {
                    color: el[0]
                };
                if (el[1]) {
                    out.offset = el[1];
                }
                return out;
            });
            return {
                type: type,
                params: params,
                stops: stops
            };
        });
        eve.on("snap.util.attr.d", function(value) {
            eve.stop();
            if (is(value, "array") && is(value[0], "array")) {
                value = Snap.path.toString.call(value);
            }
            value = Str(value);
            if (value.match(/[ruo]/i)) {
                value = Snap.path.toAbsolute(value);
            }
            $(this.node, {
                d: value
            });
        })(-1);
        eve.on("snap.util.attr.#text", function(value) {
            eve.stop();
            value = Str(value);
            var txt = glob.doc.createTextNode(value);
            while (this.node.firstChild) {
                this.node.removeChild(this.node.firstChild);
            }
            this.node.appendChild(txt);
        })(-1);
        eve.on("snap.util.attr.path", function(value) {
            eve.stop();
            this.attr({
                d: value
            });
        })(-1);
        eve.on("snap.util.attr.viewBox", function(value) {
            var vb;
            if (is(value, "object") && "x" in value) {
                vb = [ value.x, value.y, value.width, value.height ].join(" ");
            } else if (is(value, "array")) {
                vb = value.join(" ");
            } else {
                vb = value;
            }
            $(this.node, {
                viewBox: vb
            });
            eve.stop();
        })(-1);
        eve.on("snap.util.attr.transform", function(value) {
            this.transform(value);
            eve.stop();
        })(-1);
        eve.on("snap.util.attr.r", function(value) {
            if (this.type == "rect") {
                eve.stop();
                $(this.node, {
                    rx: value,
                    ry: value
                });
            }
        })(-1);
        eve.on("snap.util.attr.text", function(value) {
            if (this.type == "text") {
                var i = 0, node = this.node, tuner = function(chunk) {
                    var out = $("tspan");
                    if (is(chunk, "array")) {
                        for (var i = 0; i < chunk.length; i++) {
                            out.appendChild(tuner(chunk[i]));
                        }
                    } else {
                        out.appendChild(glob.doc.createTextNode(chunk));
                    }
                    out.normalize && out.normalize();
                    return out;
                };
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }
                var tuned = tuner(value);
                while (tuned.firstChild) {
                    node.appendChild(tuned.firstChild);
                }
            }
            eve.stop();
        })(-1);
        var availableAttributes = {
            rect: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                rx: 0,
                ry: 0,
                "class": 0
            },
            circle: {
                cx: 0,
                cy: 0,
                r: 0,
                "class": 0
            },
            ellipse: {
                cx: 0,
                cy: 0,
                rx: 0,
                ry: 0,
                "class": 0
            },
            line: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
                "class": 0
            },
            polyline: {
                points: "",
                "class": 0
            },
            polygon: {
                points: "",
                "class": 0
            },
            text: {
                x: 0,
                y: 0,
                dx: 0,
                dy: 0,
                rotate: 0,
                textLength: 0,
                lengthAdjust: 0,
                "class": 0
            },
            tspan: {
                x: 0,
                y: 0,
                dx: 0,
                dy: 0,
                rotate: 0,
                textLength: 0,
                lengthAdjust: 0,
                "class": 0
            },
            textPath: {
                "xlink:href": 0,
                startOffset: 0,
                method: 0,
                spacing: 0,
                "class": 0
            },
            marker: {
                viewBox: 0,
                preserveAspectRatio: 0,
                refX: 0,
                refY: 0,
                markerUnits: 0,
                markerWidth: 0,
                markerHeight: 0,
                orient: 0,
                "class": 0
            },
            use: {
                "class": 0,
                externalResourcesRequired: 0,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                "xlink:href": 0
            },
            linearGradient: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
                gradientUnits: 0,
                gradientTransform: 0,
                spreadMethod: 0,
                "xlink:href": 0,
                "class": 0
            },
            radialGradient: {
                cx: 0,
                cy: 0,
                r: 0,
                fx: 0,
                fy: 0,
                gradientUnits: 0,
                gradientTransform: 0,
                spreadMethod: 0,
                "xlink:href": 0,
                "class": 0
            },
            stop: {
                offset: 0,
                "class": 0
            },
            pattern: {
                viewBox: 0,
                preserveAspectRatio: 0,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                patternUnits: 0,
                patternContentUnits: 0,
                patternTransform: 0,
                "xlink:href": 0,
                "class": 0
            },
            clipPath: {
                transform: 0,
                clipPathUnits: 0,
                "class": 0
            },
            mask: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                maskUnits: 0,
                maskContentUnits: 0,
                "class": 0
            },
            image: {
                preserveAspectRatio: 0,
                transform: 0,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                "xlink:href": 0,
                "class": 0
            },
            path: {
                d: "",
                "class": 0
            },
            g: {
                "class": 0
            },
            feDistantLight: {
                azimuth: 0,
                elevation: 0
            },
            fePointLight: {
                x: 0,
                y: 0,
                z: 0
            },
            feSpotLight: {
                x: 0,
                y: 0,
                z: 0,
                pointsAtX: 0,
                pointsAtY: 0,
                pointsAtZ: 0,
                specularExponent: 0,
                limitingConeAngle: 0
            },
            feBlend: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                in2: 0,
                mode: 0
            },
            feColorMatrix: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                type: 0,
                values: 0
            },
            feComponentTransfer: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0
            },
            feComposite: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                in2: 0,
                operator: 0,
                k1: 0,
                k2: 0,
                k3: 0,
                k4: 0
            },
            feConvolveMatrix: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                order: 0,
                kernelMatrix: 0,
                divisor: 0,
                bias: 0,
                targetX: 0,
                targetY: 0,
                edgeMode: 0,
                kernelUnitLength: 0,
                preserveAlpha: 0
            },
            feDiffuseLighting: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                surfaceScale: 0,
                diffuseConstant: 0,
                kernelUnitLength: 0
            },
            feDisplacementMap: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                in2: 0,
                scale: 0,
                xChannelSelector: 0,
                yChannelSelector: 0
            },
            feFlood: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "flood-color": 0,
                "flood-opacity": 0
            },
            feGaussianBlur: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                stdDeviation: 0
            },
            feImage: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                externalResourcesRequired: 0,
                preserveAspectRatio: 0,
                "xlink:href": 0
            },
            feMerge: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0
            },
            feMergeNode: {
                "in": 0
            },
            feMorphology: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                operator: 0,
                radius: 0
            },
            feOffset: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                dx: 0,
                dy: 0
            },
            feSpecularLighting: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0,
                surfaceScale: 0,
                specularConstant: 0,
                specularExponent: 0,
                kernelUnitLength: 0
            },
            feTile: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                "in": 0
            },
            feTurbulence: {
                height: 0,
                result: 0,
                width: 0,
                x: 0,
                y: 0,
                "class": 0,
                style: 0,
                baseFrequency: 0,
                numOctaves: 0,
                seed: 0,
                stitchTiles: 0,
                type: 0
            }
        };
        availableAttributes.feFuncR = availableAttributes.feFuncG = availableAttributes.feFuncB = availableAttributes.feFuncA = {
            type: 0,
            tableValues: 0,
            slope: 0,
            intercept: 0,
            amplitude: 0,
            exponent: 0,
            offset: 0
        };
        eve.on("snap.util.attr", function(value) {
            var att = eve.nt();
            att = att.substring(att.lastIndexOf(".") + 1);
            var style = att.replace(/-(\w)/gi, function(all, letter) {
                return letter.toUpperCase();
            });
            if (availableAttributes[has](this.type) && availableAttributes[this.type][has](att)) {
                value == null ? this.node.removeAttribute(att) : this.node.setAttribute(att, value);
            } else {
                this.node.style[style] = value == null ? E : value;
            }
        });
        eve.on("snap.util.getattr.transform", function() {
            eve.stop();
            return this.transform();
        })(-1);
        (function() {
            function getter(end) {
                return function() {
                    eve.stop();
                    var style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
                    if (style == "none") {
                        return style;
                    } else {
                        return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
                    }
                };
            }
            function setter(end) {
                return function(value) {
                    eve.stop();
                    var name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
                    if (value == "" || !value) {
                        this.node.style[name] = "none";
                        return;
                    }
                    if (value.type == "marker") {
                        var id = value.node.id;
                        if (!id) {
                            $(value.node, {
                                id: value.id
                            });
                        }
                        this.node.style[name] = "url(#" + id + ")";
                        return;
                    }
                };
            }
            eve.on("snap.util.getattr.marker-end", getter("end"))(-1);
            eve.on("snap.util.getattr.markerEnd", getter("end"))(-1);
            eve.on("snap.util.getattr.marker-start", getter("start"))(-1);
            eve.on("snap.util.getattr.markerStart", getter("start"))(-1);
            eve.on("snap.util.getattr.marker-mid", getter("mid"))(-1);
            eve.on("snap.util.getattr.markerMid", getter("mid"))(-1);
            eve.on("snap.util.attr.marker-end", setter("end"))(-1);
            eve.on("snap.util.attr.markerEnd", setter("end"))(-1);
            eve.on("snap.util.attr.marker-start", setter("start"))(-1);
            eve.on("snap.util.attr.markerStart", setter("start"))(-1);
            eve.on("snap.util.attr.marker-mid", setter("mid"))(-1);
            eve.on("snap.util.attr.markerMid", setter("mid"))(-1);
        })();
        eve.on("snap.util.getattr.r", function() {
            if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
                eve.stop();
                return $(this.node, "rx");
            }
        })(-1);
        function textExtract(node) {
            var out = [];
            var children = node.childNodes;
            for (var i = 0, ii = children.length; i < ii; i++) {
                var chi = children[i];
                if (chi.nodeType == 3) {
                    out.push(chi.nodeValue);
                }
                if (chi.tagName == "tspan") {
                    if (chi.childNodes.length == 1 && chi.firstChild.nodeType == 3) {
                        out.push(chi.firstChild.nodeValue);
                    } else {
                        out.push(textExtract(chi));
                    }
                }
            }
            return out;
        }
        eve.on("snap.util.getattr.text", function() {
            if (this.type == "text" || this.type == "tspan") {
                eve.stop();
                var out = textExtract(this.node);
                return out.length == 1 ? out[0] : out;
            }
        })(-1);
        eve.on("snap.util.getattr.#text", function() {
            return this.node.textContent;
        })(-1);
        eve.on("snap.util.getattr.viewBox", function() {
            eve.stop();
            var vb = $(this.node, "viewBox").split(separator);
            return Snap._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
        })(-1);
        eve.on("snap.util.getattr.points", function() {
            var p = $(this.node, "points");
            eve.stop();
            return p.split(separator);
        });
        eve.on("snap.util.getattr.path", function() {
            var p = $(this.node, "d");
            eve.stop();
            return p;
        });
        eve.on("snap.util.getattr", function() {
            var att = eve.nt();
            att = att.substring(att.lastIndexOf(".") + 1);
            if (availableAttributes[has](this.type) && availableAttributes[this.type][has](att)) {
                return this.node.getAttribute(att);
            } else {
                return glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue(att);
            }
        });
        Snap.plugin = function(f) {
            f(Snap, Element, Paper, glob);
        };
        glob.win.Snap = Snap;
        return Snap;
    }();
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var elproto = Element.prototype, is = Snap.is, clone = Snap._.clone, has = "hasOwnProperty", p2s = /,?([a-z]),?/gi, toFloat = parseFloat, math = Math, PI = math.PI, mmin = math.min, mmax = math.max, pow = math.pow, abs = math.abs;
        function paths(ps) {
            var p = paths.ps = paths.ps || {};
            if (p[ps]) {
                p[ps].sleep = 100;
            } else {
                p[ps] = {
                    sleep: 100
                };
            }
            setTimeout(function() {
                for (var key in p) if (p[has](key) && key != ps) {
                    p[key].sleep--;
                    !p[key].sleep && delete p[key];
                }
            });
            return p[ps];
        }
        function box(x, y, width, height) {
            if (x == null) {
                x = y = width = height = 0;
            }
            if (y == null) {
                y = x.y;
                width = x.width;
                height = x.height;
                x = x.x;
            }
            return {
                x: x,
                y: y,
                width: width,
                w: width,
                height: height,
                h: height,
                x2: x + width,
                y2: y + height,
                cx: x + width / 2,
                cy: y + height / 2,
                r1: math.min(width, height) / 2,
                r2: math.max(width, height) / 2,
                r0: math.sqrt(width * width + height * height) / 2,
                path: rectPath(x, y, width, height),
                vb: [ x, y, width, height ].join(" ")
            };
        }
        function toString() {
            return this.join(",").replace(p2s, "$1");
        }
        function pathClone(pathArray) {
            var res = clone(pathArray);
            res.toString = toString;
            return res;
        }
        function getPointAtSegmentLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
            if (length == null) {
                return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
            } else {
                return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
            }
        }
        function getLengthFactory(istotal, subpath) {
            function O(val) {
                return +(+val).toFixed(3);
            }
            return Snap._.cacher(function(path, length, onlystart) {
                if (path instanceof Element) {
                    path = path.attr("d");
                }
                path = path2curve(path);
                var x, y, p, l, sp = "", subpaths = {}, point, len = 0;
                for (var i = 0, ii = path.length; i < ii; i++) {
                    p = path[i];
                    if (p[0] == "M") {
                        x = +p[1];
                        y = +p[2];
                    } else {
                        l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                        if (len + l > length) {
                            if (subpath && !subpaths.start) {
                                point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                                sp += [ "C" + O(point.start.x), O(point.start.y), O(point.m.x), O(point.m.y), O(point.x), O(point.y) ];
                                if (onlystart) {
                                    return sp;
                                }
                                subpaths.start = sp;
                                sp = [ "M" + O(point.x), O(point.y) + "C" + O(point.n.x), O(point.n.y), O(point.end.x), O(point.end.y), O(p[5]), O(p[6]) ].join();
                                len += l;
                                x = +p[5];
                                y = +p[6];
                                continue;
                            }
                            if (!istotal && !subpath) {
                                point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                                return point;
                            }
                        }
                        len += l;
                        x = +p[5];
                        y = +p[6];
                    }
                    sp += p.shift() + p;
                }
                subpaths.end = sp;
                point = istotal ? len : subpath ? subpaths : findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
                return point;
            }, null, Snap._.clone);
        }
        var getTotalLength = getLengthFactory(1), getPointAtLength = getLengthFactory(), getSubpathsAtLength = getLengthFactory(0, 1);
        function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t, t13 = pow(t1, 3), t12 = pow(t1, 2), t2 = t * t, t3 = t2 * t, x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x, y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y, mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x), my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y), nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x), ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y), ax = t1 * p1x + t * c1x, ay = t1 * p1y + t * c1y, cx = t1 * c2x + t * p2x, cy = t1 * c2y + t * p2y, alpha = 90 - math.atan2(mx - nx, my - ny) * 180 / PI;
            return {
                x: x,
                y: y,
                m: {
                    x: mx,
                    y: my
                },
                n: {
                    x: nx,
                    y: ny
                },
                start: {
                    x: ax,
                    y: ay
                },
                end: {
                    x: cx,
                    y: cy
                },
                alpha: alpha
            };
        }
        function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
            if (!Snap.is(p1x, "array")) {
                p1x = [ p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y ];
            }
            var bbox = curveDim.apply(null, p1x);
            return box(bbox.min.x, bbox.min.y, bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
        }
        function isPointInsideBBox(bbox, x, y) {
            return x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height;
        }
        function isBBoxIntersect(bbox1, bbox2) {
            bbox1 = box(bbox1);
            bbox2 = box(bbox2);
            return isPointInsideBBox(bbox2, bbox1.x, bbox1.y) || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y) || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2) || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2) || isPointInsideBBox(bbox1, bbox2.x, bbox2.y) || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y) || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2) || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2) || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x) && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
        }
        function base3(t, p1, p2, p3, p4) {
            var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4, t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
            return t * t2 - 3 * p1 + 3 * p2;
        }
        function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
            if (z == null) {
                z = 1;
            }
            z = z > 1 ? 1 : z < 0 ? 0 : z;
            var z2 = z / 2, n = 12, Tvalues = [ -.1252, .1252, -.3678, .3678, -.5873, .5873, -.7699, .7699, -.9041, .9041, -.9816, .9816 ], Cvalues = [ .2491, .2491, .2335, .2335, .2032, .2032, .1601, .1601, .1069, .1069, .0472, .0472 ], sum = 0;
            for (var i = 0; i < n; i++) {
                var ct = z2 * Tvalues[i] + z2, xbase = base3(ct, x1, x2, x3, x4), ybase = base3(ct, y1, y2, y3, y4), comb = xbase * xbase + ybase * ybase;
                sum += Cvalues[i] * math.sqrt(comb);
            }
            return z2 * sum;
        }
        function getTotLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
            if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
                return;
            }
            var t = 1, step = t / 2, t2 = t - step, l, e = .01;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
            while (abs(l - ll) > e) {
                step /= 2;
                t2 += (l < ll ? 1 : -1) * step;
                l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
            }
            return t2;
        }
        function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
            if (mmax(x1, x2) < mmin(x3, x4) || mmin(x1, x2) > mmax(x3, x4) || mmax(y1, y2) < mmin(y3, y4) || mmin(y1, y2) > mmax(y3, y4)) {
                return;
            }
            var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4), ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4), denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (!denominator) {
                return;
            }
            var px = nx / denominator, py = ny / denominator, px2 = +px.toFixed(2), py2 = +py.toFixed(2);
            if (px2 < +mmin(x1, x2).toFixed(2) || px2 > +mmax(x1, x2).toFixed(2) || px2 < +mmin(x3, x4).toFixed(2) || px2 > +mmax(x3, x4).toFixed(2) || py2 < +mmin(y1, y2).toFixed(2) || py2 > +mmax(y1, y2).toFixed(2) || py2 < +mmin(y3, y4).toFixed(2) || py2 > +mmax(y3, y4).toFixed(2)) {
                return;
            }
            return {
                x: px,
                y: py
            };
        }
        function inter(bez1, bez2) {
            return interHelper(bez1, bez2);
        }
        function interCount(bez1, bez2) {
            return interHelper(bez1, bez2, 1);
        }
        function interHelper(bez1, bez2, justCount) {
            var bbox1 = bezierBBox(bez1), bbox2 = bezierBBox(bez2);
            if (!isBBoxIntersect(bbox1, bbox2)) {
                return justCount ? 0 : [];
            }
            var l1 = bezlen.apply(0, bez1), l2 = bezlen.apply(0, bez2), n1 = ~~(l1 / 5), n2 = ~~(l2 / 5), dots1 = [], dots2 = [], xy = {}, res = justCount ? 0 : [];
            for (var i = 0; i < n1 + 1; i++) {
                var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
                dots1.push({
                    x: p.x,
                    y: p.y,
                    t: i / n1
                });
            }
            for (i = 0; i < n2 + 1; i++) {
                p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
                dots2.push({
                    x: p.x,
                    y: p.y,
                    t: i / n2
                });
            }
            for (i = 0; i < n1; i++) {
                for (var j = 0; j < n2; j++) {
                    var di = dots1[i], di1 = dots1[i + 1], dj = dots2[j], dj1 = dots2[j + 1], ci = abs(di1.x - di.x) < .001 ? "y" : "x", cj = abs(dj1.x - dj.x) < .001 ? "y" : "x", is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                    if (is) {
                        if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                            continue;
                        }
                        xy[is.x.toFixed(4)] = is.y.toFixed(4);
                        var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t), t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                            if (justCount) {
                                res++;
                            } else {
                                res.push({
                                    x: is.x,
                                    y: is.y,
                                    t1: t1,
                                    t2: t2
                                });
                            }
                        }
                    }
                }
            }
            return res;
        }
        function pathIntersection(path1, path2) {
            return interPathHelper(path1, path2);
        }
        function pathIntersectionNumber(path1, path2) {
            return interPathHelper(path1, path2, 1);
        }
        function interPathHelper(path1, path2, justCount) {
            path1 = path2curve(path1);
            path2 = path2curve(path2);
            var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2, res = justCount ? 0 : [];
            for (var i = 0, ii = path1.length; i < ii; i++) {
                var pi = path1[i];
                if (pi[0] == "M") {
                    x1 = x1m = pi[1];
                    y1 = y1m = pi[2];
                } else {
                    if (pi[0] == "C") {
                        bez1 = [ x1, y1 ].concat(pi.slice(1));
                        x1 = bez1[6];
                        y1 = bez1[7];
                    } else {
                        bez1 = [ x1, y1, x1, y1, x1m, y1m, x1m, y1m ];
                        x1 = x1m;
                        y1 = y1m;
                    }
                    for (var j = 0, jj = path2.length; j < jj; j++) {
                        var pj = path2[j];
                        if (pj[0] == "M") {
                            x2 = x2m = pj[1];
                            y2 = y2m = pj[2];
                        } else {
                            if (pj[0] == "C") {
                                bez2 = [ x2, y2 ].concat(pj.slice(1));
                                x2 = bez2[6];
                                y2 = bez2[7];
                            } else {
                                bez2 = [ x2, y2, x2, y2, x2m, y2m, x2m, y2m ];
                                x2 = x2m;
                                y2 = y2m;
                            }
                            var intr = interHelper(bez1, bez2, justCount);
                            if (justCount) {
                                res += intr;
                            } else {
                                for (var k = 0, kk = intr.length; k < kk; k++) {
                                    intr[k].segment1 = i;
                                    intr[k].segment2 = j;
                                    intr[k].bez1 = bez1;
                                    intr[k].bez2 = bez2;
                                }
                                res = res.concat(intr);
                            }
                        }
                    }
                }
            }
            return res;
        }
        function isPointInsidePath(path, x, y) {
            var bbox = pathBBox(path);
            return isPointInsideBBox(bbox, x, y) && interPathHelper(path, [ [ "M", x, y ], [ "H", bbox.x2 + 10 ] ], 1) % 2 == 1;
        }
        function pathBBox(path) {
            var pth = paths(path);
            if (pth.bbox) {
                return clone(pth.bbox);
            }
            if (!path) {
                return box();
            }
            path = path2curve(path);
            var x = 0, y = 0, X = [], Y = [], p;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = p[1];
                    y = p[2];
                    X.push(x);
                    Y.push(y);
                } else {
                    var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    X = X.concat(dim.min.x, dim.max.x);
                    Y = Y.concat(dim.min.y, dim.max.y);
                    x = p[5];
                    y = p[6];
                }
            }
            var xmin = mmin.apply(0, X), ymin = mmin.apply(0, Y), xmax = mmax.apply(0, X), ymax = mmax.apply(0, Y), bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
            pth.bbox = clone(bb);
            return bb;
        }
        function rectPath(x, y, w, h, r) {
            if (r) {
                return [ [ "M", x + r, y ], [ "l", w - r * 2, 0 ], [ "a", r, r, 0, 0, 1, r, r ], [ "l", 0, h - r * 2 ], [ "a", r, r, 0, 0, 1, -r, r ], [ "l", r * 2 - w, 0 ], [ "a", r, r, 0, 0, 1, -r, -r ], [ "l", 0, r * 2 - h ], [ "a", r, r, 0, 0, 1, r, -r ], [ "z" ] ];
            }
            var res = [ [ "M", x, y ], [ "l", w, 0 ], [ "l", 0, h ], [ "l", -w, 0 ], [ "z" ] ];
            res.toString = toString;
            return res;
        }
        function ellipsePath(x, y, rx, ry, a) {
            if (a == null && ry == null) {
                ry = rx;
            }
            if (a != null) {
                var rad = Math.PI / 180, x1 = x + rx * Math.cos(-ry * rad), x2 = x + rx * Math.cos(-a * rad), y1 = y + rx * Math.sin(-ry * rad), y2 = y + rx * Math.sin(-a * rad), res = [ [ "M", x1, y1 ], [ "A", rx, rx, 0, +(a - ry > 180), 0, x2, y2 ] ];
            } else {
                res = [ [ "M", x, y ], [ "m", 0, -ry ], [ "a", rx, ry, 0, 1, 1, 0, 2 * ry ], [ "a", rx, ry, 0, 1, 1, 0, -2 * ry ], [ "z" ] ];
            }
            res.toString = toString;
            return res;
        }
        var unit2px = Snap._unit2px, getPath = {
            path: function(el) {
                return el.attr("path");
            },
            circle: function(el) {
                var attr = unit2px(el);
                return ellipsePath(attr.cx, attr.cy, attr.r);
            },
            ellipse: function(el) {
                var attr = unit2px(el);
                return ellipsePath(attr.cx, attr.cy, attr.rx, attr.ry);
            },
            rect: function(el) {
                var attr = unit2px(el);
                return rectPath(attr.x, attr.y, attr.width, attr.height, attr.rx, attr.ry);
            },
            image: function(el) {
                var attr = unit2px(el);
                return rectPath(attr.x, attr.y, attr.width, attr.height);
            },
            text: function(el) {
                var bbox = el.node.getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            },
            g: function(el) {
                var bbox = el.node.getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            },
            symbol: function(el) {
                var bbox = el.getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            },
            polyline: function(el) {
                return "M" + el.attr("points");
            },
            polygon: function(el) {
                return "M" + el.attr("points") + "z";
            }
        };
        function pathToRelative(pathArray) {
            var pth = paths(pathArray), lowerCase = String.prototype.toLowerCase;
            if (pth.rel) {
                return pathClone(pth.rel);
            }
            if (!Snap.is(pathArray, "array") || !Snap.is(pathArray && pathArray[0], "array")) {
                pathArray = Snap.parsePathString(pathArray);
            }
            var res = [], x = 0, y = 0, mx = 0, my = 0, start = 0;
            if (pathArray[0][0] == "M") {
                x = pathArray[0][1];
                y = pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res.push([ "M", x, y ]);
            }
            for (var i = start, ii = pathArray.length; i < ii; i++) {
                var r = res[i] = [], pa = pathArray[i];
                if (pa[0] != lowerCase.call(pa[0])) {
                    r[0] = lowerCase.call(pa[0]);
                    switch (r[0]) {
                      case "a":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] - x).toFixed(3);
                        r[7] = +(pa[7] - y).toFixed(3);
                        break;

                      case "v":
                        r[1] = +(pa[1] - y).toFixed(3);
                        break;

                      case "m":
                        mx = pa[1];
                        my = pa[2];

                      default:
                        for (var j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +(pa[j] - (j % 2 ? x : y)).toFixed(3);
                        }
                    }
                } else {
                    r = res[i] = [];
                    if (pa[0] == "m") {
                        mx = pa[1] + x;
                        my = pa[2] + y;
                    }
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        res[i][k] = pa[k];
                    }
                }
                var len = res[i].length;
                switch (res[i][0]) {
                  case "z":
                    x = mx;
                    y = my;
                    break;

                  case "h":
                    x += +res[i][len - 1];
                    break;

                  case "v":
                    y += +res[i][len - 1];
                    break;

                  default:
                    x += +res[i][len - 2];
                    y += +res[i][len - 1];
                }
            }
            res.toString = toString;
            pth.rel = pathClone(res);
            return res;
        }
        function pathToAbsolute(pathArray) {
            var pth = paths(pathArray);
            if (pth.abs) {
                return pathClone(pth.abs);
            }
            if (!is(pathArray, "array") || !is(pathArray && pathArray[0], "array")) {
                pathArray = Snap.parsePathString(pathArray);
            }
            if (!pathArray || !pathArray.length) {
                return [ [ "M", 0, 0 ] ];
            }
            var res = [], x = 0, y = 0, mx = 0, my = 0, start = 0, pa0;
            if (pathArray[0][0] == "M") {
                x = +pathArray[0][1];
                y = +pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res[0] = [ "M", x, y ];
            }
            var crz = pathArray.length == 3 && pathArray[0][0] == "M" && pathArray[1][0].toUpperCase() == "R" && pathArray[2][0].toUpperCase() == "Z";
            for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
                res.push(r = []);
                pa = pathArray[i];
                pa0 = pa[0];
                if (pa0 != pa0.toUpperCase()) {
                    r[0] = pa0.toUpperCase();
                    switch (r[0]) {
                      case "A":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] + x);
                        r[7] = +(pa[7] + y);
                        break;

                      case "V":
                        r[1] = +pa[1] + y;
                        break;

                      case "H":
                        r[1] = +pa[1] + x;
                        break;

                      case "R":
                        var dots = [ x, y ].concat(pa.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        res.pop();
                        res = res.concat(catmullRom2bezier(dots, crz));
                        break;

                      case "O":
                        res.pop();
                        dots = ellipsePath(x, y, pa[1], pa[2]);
                        dots.push(dots[0]);
                        res = res.concat(dots);
                        break;

                      case "U":
                        res.pop();
                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                        r = [ "U" ].concat(res[res.length - 1].slice(-2));
                        break;

                      case "M":
                        mx = +pa[1] + x;
                        my = +pa[2] + y;

                      default:
                        for (j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +pa[j] + (j % 2 ? x : y);
                        }
                    }
                } else if (pa0 == "R") {
                    dots = [ x, y ].concat(pa.slice(1));
                    res.pop();
                    res = res.concat(catmullRom2bezier(dots, crz));
                    r = [ "R" ].concat(pa.slice(-2));
                } else if (pa0 == "O") {
                    res.pop();
                    dots = ellipsePath(x, y, pa[1], pa[2]);
                    dots.push(dots[0]);
                    res = res.concat(dots);
                } else if (pa0 == "U") {
                    res.pop();
                    res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                    r = [ "U" ].concat(res[res.length - 1].slice(-2));
                } else {
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        r[k] = pa[k];
                    }
                }
                pa0 = pa0.toUpperCase();
                if (pa0 != "O") {
                    switch (r[0]) {
                      case "Z":
                        x = mx;
                        y = my;
                        break;

                      case "H":
                        x = r[1];
                        break;

                      case "V":
                        y = r[1];
                        break;

                      case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];

                      default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                    }
                }
            }
            res.toString = toString;
            pth.abs = pathClone(res);
            return res;
        }
        function l2c(x1, y1, x2, y2) {
            return [ x1, y1, x2, y2, x2, y2 ];
        }
        function q2c(x1, y1, ax, ay, x2, y2) {
            var _13 = 1 / 3, _23 = 2 / 3;
            return [ _13 * x1 + _23 * ax, _13 * y1 + _23 * ay, _13 * x2 + _23 * ax, _13 * y2 + _23 * ay, x2, y2 ];
        }
        function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
            var _120 = PI * 120 / 180, rad = PI / 180 * (+angle || 0), res = [], xy, rotate = Snap._.cacher(function(x, y, rad) {
                var X = x * math.cos(rad) - y * math.sin(rad), Y = x * math.sin(rad) + y * math.cos(rad);
                return {
                    x: X,
                    y: Y
                };
            });
            if (!recursive) {
                xy = rotate(x1, y1, -rad);
                x1 = xy.x;
                y1 = xy.y;
                xy = rotate(x2, y2, -rad);
                x2 = xy.x;
                y2 = xy.y;
                var cos = math.cos(PI / 180 * angle), sin = math.sin(PI / 180 * angle), x = (x1 - x2) / 2, y = (y1 - y2) / 2;
                var h = x * x / (rx * rx) + y * y / (ry * ry);
                if (h > 1) {
                    h = math.sqrt(h);
                    rx = h * rx;
                    ry = h * ry;
                }
                var rx2 = rx * rx, ry2 = ry * ry, k = (large_arc_flag == sweep_flag ? -1 : 1) * math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))), cx = k * rx * y / ry + (x1 + x2) / 2, cy = k * -ry * x / rx + (y1 + y2) / 2, f1 = math.asin(((y1 - cy) / ry).toFixed(9)), f2 = math.asin(((y2 - cy) / ry).toFixed(9));
                f1 = x1 < cx ? PI - f1 : f1;
                f2 = x2 < cx ? PI - f2 : f2;
                f1 < 0 && (f1 = PI * 2 + f1);
                f2 < 0 && (f2 = PI * 2 + f2);
                if (sweep_flag && f1 > f2) {
                    f1 = f1 - PI * 2;
                }
                if (!sweep_flag && f2 > f1) {
                    f2 = f2 - PI * 2;
                }
            } else {
                f1 = recursive[0];
                f2 = recursive[1];
                cx = recursive[2];
                cy = recursive[3];
            }
            var df = f2 - f1;
            if (abs(df) > _120) {
                var f2old = f2, x2old = x2, y2old = y2;
                f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
                x2 = cx + rx * math.cos(f2);
                y2 = cy + ry * math.sin(f2);
                res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [ f2, f2old, cx, cy ]);
            }
            df = f2 - f1;
            var c1 = math.cos(f1), s1 = math.sin(f1), c2 = math.cos(f2), s2 = math.sin(f2), t = math.tan(df / 4), hx = 4 / 3 * rx * t, hy = 4 / 3 * ry * t, m1 = [ x1, y1 ], m2 = [ x1 + hx * s1, y1 - hy * c1 ], m3 = [ x2 + hx * s2, y2 - hy * c2 ], m4 = [ x2, y2 ];
            m2[0] = 2 * m1[0] - m2[0];
            m2[1] = 2 * m1[1] - m2[1];
            if (recursive) {
                return [ m2, m3, m4 ].concat(res);
            } else {
                res = [ m2, m3, m4 ].concat(res).join().split(",");
                var newres = [];
                for (var i = 0, ii = res.length; i < ii; i++) {
                    newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
                }
                return newres;
            }
        }
        function findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t;
            return {
                x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
                y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
            };
        }
        function curveDim(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
            var a = c2x - 2 * c1x + p1x - (p2x - 2 * c2x + c1x), b = 2 * (c1x - p1x) - 2 * (c2x - c1x), c = p1x - c1x, t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a, t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a, y = [ p1y, p2y ], x = [ p1x, p2x ], dot;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            a = c2y - 2 * c1y + p1y - (p2y - 2 * c2y + c1y);
            b = 2 * (c1y - p1y) - 2 * (c2y - c1y);
            c = p1y - c1y;
            t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a;
            t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            return {
                min: {
                    x: mmin.apply(0, x),
                    y: mmin.apply(0, y)
                },
                max: {
                    x: mmax.apply(0, x),
                    y: mmax.apply(0, y)
                }
            };
        }
        function path2curve(path, path2) {
            var pth = !path2 && paths(path);
            if (!path2 && pth.curve) {
                return pathClone(pth.curve);
            }
            var p = pathToAbsolute(path), p2 = path2 && pathToAbsolute(path2), attrs = {
                x: 0,
                y: 0,
                bx: 0,
                by: 0,
                X: 0,
                Y: 0,
                qx: null,
                qy: null
            }, attrs2 = {
                x: 0,
                y: 0,
                bx: 0,
                by: 0,
                X: 0,
                Y: 0,
                qx: null,
                qy: null
            }, processPath = function(path, d) {
                var nx, ny;
                if (!path) {
                    return [ "C", d.x, d.y, d.x, d.y, d.x, d.y ];
                }
                !(path[0] in {
                    T: 1,
                    Q: 1
                }) && (d.qx = d.qy = null);
                switch (path[0]) {
                  case "M":
                    d.X = path[1];
                    d.Y = path[2];
                    break;

                  case "A":
                    path = [ "C" ].concat(a2c.apply(0, [ d.x, d.y ].concat(path.slice(1))));
                    break;

                  case "S":
                    nx = d.x + (d.x - (d.bx || d.x));
                    ny = d.y + (d.y - (d.by || d.y));
                    path = [ "C", nx, ny ].concat(path.slice(1));
                    break;

                  case "T":
                    d.qx = d.x + (d.x - (d.qx || d.x));
                    d.qy = d.y + (d.y - (d.qy || d.y));
                    path = [ "C" ].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                    break;

                  case "Q":
                    d.qx = path[1];
                    d.qy = path[2];
                    path = [ "C" ].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                    break;

                  case "L":
                    path = [ "C" ].concat(l2c(d.x, d.y, path[1], path[2]));
                    break;

                  case "H":
                    path = [ "C" ].concat(l2c(d.x, d.y, path[1], d.y));
                    break;

                  case "V":
                    path = [ "C" ].concat(l2c(d.x, d.y, d.x, path[1]));
                    break;

                  case "Z":
                    path = [ "C" ].concat(l2c(d.x, d.y, d.X, d.Y));
                    break;
                }
                return path;
            }, fixArc = function(pp, i) {
                if (pp[i].length > 7) {
                    pp[i].shift();
                    var pi = pp[i];
                    while (pi.length) {
                        pp.splice(i++, 0, [ "C" ].concat(pi.splice(0, 6)));
                    }
                    pp.splice(i, 1);
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            }, fixM = function(path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                    path2.splice(i, 0, [ "M", a2.x, a2.y ]);
                    a1.bx = 0;
                    a1.by = 0;
                    a1.x = path1[i][1];
                    a1.y = path1[i][2];
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            };
            for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
                p[i] = processPath(p[i], attrs);
                fixArc(p, i);
                p2 && (p2[i] = processPath(p2[i], attrs2));
                p2 && fixArc(p2, i);
                fixM(p, p2, attrs, attrs2, i);
                fixM(p2, p, attrs2, attrs, i);
                var seg = p[i], seg2 = p2 && p2[i], seglen = seg.length, seg2len = p2 && seg2.length;
                attrs.x = seg[seglen - 2];
                attrs.y = seg[seglen - 1];
                attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
                attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
                attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
                attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
                attrs2.x = p2 && seg2[seg2len - 2];
                attrs2.y = p2 && seg2[seg2len - 1];
            }
            if (!p2) {
                pth.curve = pathClone(p);
            }
            return p2 ? [ p, p2 ] : p;
        }
        function mapPath(path, matrix) {
            if (!matrix) {
                return path;
            }
            var x, y, i, j, ii, jj, pathi;
            path = path2curve(path);
            for (i = 0, ii = path.length; i < ii; i++) {
                pathi = path[i];
                for (j = 1, jj = pathi.length; j < jj; j += 2) {
                    x = matrix.x(pathi[j], pathi[j + 1]);
                    y = matrix.y(pathi[j], pathi[j + 1]);
                    pathi[j] = x;
                    pathi[j + 1] = y;
                }
            }
            return path;
        }
        function catmullRom2bezier(crp, z) {
            var d = [];
            for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
                var p = [ {
                    x: +crp[i - 2],
                    y: +crp[i - 1]
                }, {
                    x: +crp[i],
                    y: +crp[i + 1]
                }, {
                    x: +crp[i + 2],
                    y: +crp[i + 3]
                }, {
                    x: +crp[i + 4],
                    y: +crp[i + 5]
                } ];
                if (z) {
                    if (!i) {
                        p[0] = {
                            x: +crp[iLen - 2],
                            y: +crp[iLen - 1]
                        };
                    } else if (iLen - 4 == i) {
                        p[3] = {
                            x: +crp[0],
                            y: +crp[1]
                        };
                    } else if (iLen - 2 == i) {
                        p[2] = {
                            x: +crp[0],
                            y: +crp[1]
                        };
                        p[3] = {
                            x: +crp[2],
                            y: +crp[3]
                        };
                    }
                } else {
                    if (iLen - 4 == i) {
                        p[3] = p[2];
                    } else if (!i) {
                        p[0] = {
                            x: +crp[i],
                            y: +crp[i + 1]
                        };
                    }
                }
                d.push([ "C", (-p[0].x + 6 * p[1].x + p[2].x) / 6, (-p[0].y + 6 * p[1].y + p[2].y) / 6, (p[1].x + 6 * p[2].x - p[3].x) / 6, (p[1].y + 6 * p[2].y - p[3].y) / 6, p[2].x, p[2].y ]);
            }
            return d;
        }
        Snap.path = paths;
        Snap.path.getTotalLength = getTotalLength;
        Snap.path.getPointAtLength = getPointAtLength;
        Snap.path.getSubpath = function(path, from, to) {
            if (this.getTotalLength(path) - to < 1e-6) {
                return getSubpathsAtLength(path, from).end;
            }
            var a = getSubpathsAtLength(path, to, 1);
            return from ? getSubpathsAtLength(a, from).end : a;
        };
        elproto.getTotalLength = function() {
            if (this.node.getTotalLength) {
                return this.node.getTotalLength();
            }
        };
        elproto.getPointAtLength = function(length) {
            return getPointAtLength(this.attr("d"), length);
        };
        elproto.getSubpath = function(from, to) {
            return Snap.path.getSubpath(this.attr("d"), from, to);
        };
        Snap._.box = box;
        Snap.path.findDotsAtSegment = findDotsAtSegment;
        Snap.path.bezierBBox = bezierBBox;
        Snap.path.isPointInsideBBox = isPointInsideBBox;
        Snap.path.isBBoxIntersect = isBBoxIntersect;
        Snap.path.intersection = pathIntersection;
        Snap.path.intersectionNumber = pathIntersectionNumber;
        Snap.path.isPointInside = isPointInsidePath;
        Snap.path.getBBox = pathBBox;
        Snap.path.get = getPath;
        Snap.path.toRelative = pathToRelative;
        Snap.path.toAbsolute = pathToAbsolute;
        Snap.path.toCubic = path2curve;
        Snap.path.map = mapPath;
        Snap.path.toString = toString;
        Snap.path.clone = pathClone;
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var mmax = Math.max, mmin = Math.min;
        var Set = function(items) {
            this.items = [];
            this.length = 0;
            this.type = "set";
            if (items) {
                for (var i = 0, ii = items.length; i < ii; i++) {
                    if (items[i]) {
                        this[this.items.length] = this.items[this.items.length] = items[i];
                        this.length++;
                    }
                }
            }
        }, setproto = Set.prototype;
        setproto.push = function() {
            var item, len;
            for (var i = 0, ii = arguments.length; i < ii; i++) {
                item = arguments[i];
                if (item) {
                    len = this.items.length;
                    this[len] = this.items[len] = item;
                    this.length++;
                }
            }
            return this;
        };
        setproto.pop = function() {
            this.length && delete this[this.length--];
            return this.items.pop();
        };
        setproto.forEach = function(callback, thisArg) {
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                if (callback.call(thisArg, this.items[i], i) === false) {
                    return this;
                }
            }
            return this;
        };
        setproto.attr = function(value) {
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                this.items[i].attr(value);
            }
            return this;
        };
        setproto.clear = function() {
            while (this.length) {
                this.pop();
            }
        };
        setproto.splice = function(index, count, insertion) {
            index = index < 0 ? mmax(this.length + index, 0) : index;
            count = mmax(0, mmin(this.length - index, count));
            var tail = [], todel = [], args = [], i;
            for (i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            for (i = 0; i < count; i++) {
                todel.push(this[index + i]);
            }
            for (;i < this.length - index; i++) {
                tail.push(this[index + i]);
            }
            var arglen = args.length;
            for (i = 0; i < arglen + tail.length; i++) {
                this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
            }
            i = this.items.length = this.length -= count - arglen;
            while (this[i]) {
                delete this[i++];
            }
            return new Set(todel);
        };
        setproto.exclude = function(el) {
            for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
                this.splice(i, 1);
                return true;
            }
            return false;
        };
        setproto.insertAfter = function(el) {
            var i = this.items.length;
            while (i--) {
                this.items[i].insertAfter(el);
            }
            return this;
        };
        setproto.getBBox = function() {
            var x = [], y = [], x2 = [], y2 = [];
            for (var i = this.items.length; i--; ) if (!this.items[i].removed) {
                var box = this.items[i].getBBox();
                x.push(box.x);
                y.push(box.y);
                x2.push(box.x + box.width);
                y2.push(box.y + box.height);
            }
            x = mmin.apply(0, x);
            y = mmin.apply(0, y);
            x2 = mmax.apply(0, x2);
            y2 = mmax.apply(0, y2);
            return {
                x: x,
                y: y,
                x2: x2,
                y2: y2,
                width: x2 - x,
                height: y2 - y,
                cx: x + (x2 - x) / 2,
                cy: y + (y2 - y) / 2
            };
        };
        setproto.clone = function(s) {
            s = new Set();
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                s.push(this.items[i].clone());
            }
            return s;
        };
        setproto.toString = function() {
            return "Snap‘s set";
        };
        setproto.type = "set";
        Snap.set = function() {
            var set = new Set();
            if (arguments.length) {
                set.push.apply(set, Array.prototype.slice.call(arguments, 0));
            }
            return set;
        };
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var names = {}, reUnit = /[a-z]+$/i, Str = String;
        names.stroke = names.fill = "colour";
        function getEmpty(item) {
            var l = item[0];
            switch (l.toLowerCase()) {
              case "t":
                return [ l, 0, 0 ];

              case "m":
                return [ l, 1, 0, 0, 1, 0, 0 ];

              case "r":
                if (item.length == 4) {
                    return [ l, 0, item[2], item[3] ];
                } else {
                    return [ l, 0 ];
                }

              case "s":
                if (item.length == 5) {
                    return [ l, 1, 1, item[3], item[4] ];
                } else if (item.length == 3) {
                    return [ l, 1, 1 ];
                } else {
                    return [ l, 1 ];
                }
            }
        }
        function equaliseTransform(t1, t2, getBBox) {
            t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
            t1 = Snap.parseTransformString(t1) || [];
            t2 = Snap.parseTransformString(t2) || [];
            var maxlength = Math.max(t1.length, t2.length), from = [], to = [], i = 0, j, jj, tt1, tt2;
            for (;i < maxlength; i++) {
                tt1 = t1[i] || getEmpty(t2[i]);
                tt2 = t2[i] || getEmpty(tt1);
                if (tt1[0] != tt2[0] || tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3]) || tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4])) {
                    t1 = Snap._.transform2matrix(t1, getBBox());
                    t2 = Snap._.transform2matrix(t2, getBBox());
                    from = [ [ "m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f ] ];
                    to = [ [ "m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f ] ];
                    break;
                }
                from[i] = [];
                to[i] = [];
                for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
                    j in tt1 && (from[i][j] = tt1[j]);
                    j in tt2 && (to[i][j] = tt2[j]);
                }
            }
            return {
                from: path2array(from),
                to: path2array(to),
                f: getPath(from)
            };
        }
        function getNumber(val) {
            return val;
        }
        function getUnit(unit) {
            return function(val) {
                return +val.toFixed(3) + unit;
            };
        }
        function getColour(clr) {
            return Snap.rgb(clr[0], clr[1], clr[2]);
        }
        function getPath(path) {
            var k = 0, i, ii, j, jj, out, a, b = [];
            for (i = 0, ii = path.length; i < ii; i++) {
                out = "[";
                a = [ '"' + path[i][0] + '"' ];
                for (j = 1, jj = path[i].length; j < jj; j++) {
                    a[j] = "val[" + k++ + "]";
                }
                out += a + "]";
                b[i] = out;
            }
            return Function("val", "return Snap.path.toString.call([" + b + "])");
        }
        function path2array(path) {
            var out = [];
            for (var i = 0, ii = path.length; i < ii; i++) {
                for (var j = 1, jj = path[i].length; j < jj; j++) {
                    out.push(path[i][j]);
                }
            }
            return out;
        }
        Element.prototype.equal = function(name, b) {
            var A, B, a = Str(this.attr(name) || ""), el = this;
            if (a == +a && b == +b) {
                return {
                    from: +a,
                    to: +b,
                    f: getNumber
                };
            }
            if (names[name] == "colour") {
                A = Snap.color(a);
                B = Snap.color(b);
                return {
                    from: [ A.r, A.g, A.b, A.opacity ],
                    to: [ B.r, B.g, B.b, B.opacity ],
                    f: getColour
                };
            }
            if (name == "transform" || name == "gradientTransform" || name == "patternTransform") {
                return equaliseTransform(a, b, function() {
                    return el.getBBox(1);
                });
            }
            if (name == "d" || name == "path") {
                A = Snap.path.toCubic(a, b);
                return {
                    from: path2array(A[0]),
                    to: path2array(A[1]),
                    f: getPath(A[0])
                };
            }
            var aUnit = a.match(reUnit), bUnit = b.match(reUnit);
            if (aUnit && aUnit == bUnit) {
                return {
                    from: parseFloat(a),
                    to: parseFloat(b),
                    f: getUnit(aUnit)
                };
            } else {
                return {
                    from: this.asPX(name),
                    to: this.asPX(name, b),
                    f: getNumber
                };
            }
        };
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var elproto = Element.prototype, has = "hasOwnProperty", supportsTouch = "createTouch" in glob.doc, events = [ "click", "dblclick", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "touchstart", "touchmove", "touchend", "touchcancel" ], touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        }, getScroll = function(xy) {
            var name = xy == "y" ? "scrollTop" : "scrollLeft";
            return glob.doc.documentElement[name] || glob.doc.body[name];
        }, preventDefault = function() {
            this.returnValue = false;
        }, preventTouch = function() {
            return this.originalEvent.preventDefault();
        }, stopPropagation = function() {
            this.cancelBubble = true;
        }, stopTouch = function() {
            return this.originalEvent.stopPropagation();
        }, addEvent = function() {
            if (glob.doc.addEventListener) {
                return function(obj, type, fn, element) {
                    var realName = supportsTouch && touchMap[type] ? touchMap[type] : type, f = function(e) {
                        var scrollY = getScroll("y"), scrollX = getScroll("x"), x = e.clientX + scrollX, y = e.clientY + scrollY;
                        if (supportsTouch && touchMap[has](type)) {
                            for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                                if (e.targetTouches[i].target == obj) {
                                    var olde = e;
                                    e = e.targetTouches[i];
                                    e.originalEvent = olde;
                                    e.preventDefault = preventTouch;
                                    e.stopPropagation = stopTouch;
                                    break;
                                }
                            }
                        }
                        return fn.call(element, e, x, y);
                    };
                    obj.addEventListener(realName, f, false);
                    return function() {
                        obj.removeEventListener(realName, f, false);
                        return true;
                    };
                };
            } else if (glob.doc.attachEvent) {
                return function(obj, type, fn, element) {
                    var f = function(e) {
                        e = e || glob.win.event;
                        var scrollY = getScroll("y"), scrollX = getScroll("x"), x = e.clientX + scrollX, y = e.clientY + scrollY;
                        e.preventDefault = e.preventDefault || preventDefault;
                        e.stopPropagation = e.stopPropagation || stopPropagation;
                        return fn.call(element, e, x, y);
                    };
                    obj.attachEvent("on" + type, f);
                    var detacher = function() {
                        obj.detachEvent("on" + type, f);
                        return true;
                    };
                    return detacher;
                };
            }
        }(), drag = [], dragMove = function(e) {
            var x = e.clientX, y = e.clientY, scrollY = getScroll("y"), scrollX = getScroll("x"), dragi, j = drag.length;
            while (j--) {
                dragi = drag[j];
                if (supportsTouch) {
                    var i = e.touches.length, touch;
                    while (i--) {
                        touch = e.touches[i];
                        if (touch.identifier == dragi.el._drag.id) {
                            x = touch.clientX;
                            y = touch.clientY;
                            (e.originalEvent ? e.originalEvent : e).preventDefault();
                            break;
                        }
                    }
                } else {
                    e.preventDefault();
                }
                var node = dragi.el.node, o, glob = Snap._.glob, next = node.nextSibling, parent = node.parentNode, display = node.style.display;
                x += scrollX;
                y += scrollY;
                eve("snap.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
            }
        }, dragUp = function(e) {
            Snap.unmousemove(dragMove).unmouseup(dragUp);
            var i = drag.length, dragi;
            while (i--) {
                dragi = drag[i];
                dragi.el._drag = {};
                eve("snap.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
            }
            drag = [];
        };
        for (var i = events.length; i--; ) {
            (function(eventName) {
                Snap[eventName] = elproto[eventName] = function(fn, scope) {
                    if (Snap.is(fn, "function")) {
                        this.events = this.events || [];
                        this.events.push({
                            name: eventName,
                            f: fn,
                            unbind: addEvent(this.shape || this.node || glob.doc, eventName, fn, scope || this)
                        });
                    }
                    return this;
                };
                Snap["un" + eventName] = elproto["un" + eventName] = function(fn) {
                    var events = this.events || [], l = events.length;
                    while (l--) if (events[l].name == eventName && (events[l].f == fn || !fn)) {
                        events[l].unbind();
                        events.splice(l, 1);
                        !events.length && delete this.events;
                        return this;
                    }
                    return this;
                };
            })(events[i]);
        }
        elproto.hover = function(f_in, f_out, scope_in, scope_out) {
            return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
        };
        elproto.unhover = function(f_in, f_out) {
            return this.unmouseover(f_in).unmouseout(f_out);
        };
        var draggable = [];
        elproto.drag = function(onmove, onstart, onend, move_scope, start_scope, end_scope) {
            if (!arguments.length) {
                var origTransform;
                return this.drag(function(dx, dy) {
                    this.attr({
                        transform: origTransform + (origTransform ? "T" : "t") + [ dx, dy ]
                    });
                }, function() {
                    origTransform = this.transform().local;
                });
            }
            function start(e) {
                (e.originalEvent || e).preventDefault();
                var scrollY = getScroll("y"), scrollX = getScroll("x");
                this._drag.x = e.clientX + scrollX;
                this._drag.y = e.clientY + scrollY;
                this._drag.id = e.identifier;
                !drag.length && Snap.mousemove(dragMove).mouseup(dragUp);
                drag.push({
                    el: this,
                    move_scope: move_scope,
                    start_scope: start_scope,
                    end_scope: end_scope
                });
                onstart && eve.on("snap.drag.start." + this.id, onstart);
                onmove && eve.on("snap.drag.move." + this.id, onmove);
                onend && eve.on("snap.drag.end." + this.id, onend);
                eve("snap.drag.start." + this.id, start_scope || move_scope || this, e.clientX + scrollX, e.clientY + scrollY, e);
            }
            this._drag = {};
            draggable.push({
                el: this,
                start: start
            });
            this.mousedown(start);
            return this;
        };
        elproto.undrag = function() {
            var i = draggable.length;
            while (i--) if (draggable[i].el == this) {
                this.unmousedown(draggable[i].start);
                draggable.splice(i, 1);
                eve.unbind("snap.drag.*." + this.id);
            }
            !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
            return this;
        };
    });
    Snap.plugin(function(Snap, Element, Paper, glob) {
        var elproto = Element.prototype, pproto = Paper.prototype, rgurl = /^\s*url\((.+)\)/, Str = String, $ = Snap._.$;
        Snap.filter = {};
        pproto.filter = function(filstr) {
            var paper = this;
            if (paper.type != "svg") {
                paper = paper.paper;
            }
            var f = Snap.parse(Str(filstr)), id = Snap._.id(), width = paper.node.offsetWidth, height = paper.node.offsetHeight, filter = $("filter");
            $(filter, {
                id: id,
                filterUnits: "userSpaceOnUse",
                x: 0,
                y: 0,
                width: width,
                height: height
            });
            filter.appendChild(f.node);
            paper.defs.appendChild(filter);
            return new Element(filter);
        };
        eve.on("snap.util.getattr.filter", function() {
            eve.stop();
            var p = $(this.node, "filter");
            if (p) {
                var match = Str(p).match(rgurl);
                return match && Snap.select(match[1]);
            }
        });
        eve.on("snap.util.attr.filter", function(value) {
            if (value instanceof Element && value.type == "filter") {
                eve.stop();
                var id = value.node.id;
                if (!id) {
                    $(value.node, {
                        id: value.id
                    });
                    id = value.id;
                }
                $(this.node, {
                    filter: "url(#" + id + ")"
                });
            }
            if (!value || value == "none") {
                eve.stop();
                this.node.removeAttribute("filter");
            }
        });
        Snap.filter.blur = function(x, y) {
            if (x == null) {
                x = 2;
            }
            var def = y == null ? x : [ x, y ];
            return Snap.format('<feGaussianBlur stdDeviation="{def}"/>', {
                def: def
            });
        };
        Snap.filter.blur.toString = function() {
            return this();
        };
        Snap.filter.shadow = function(dx, dy, blur, color) {
            color = color || "#000";
            if (blur == null) {
                blur = 4;
            }
            if (typeof blur == "string") {
                color = blur;
                blur = 4;
            }
            if (dx == null) {
                dx = 0;
                dy = 2;
            }
            if (dy == null) {
                dy = dx;
            }
            color = Snap.color(color);
            return Snap.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>', {
                color: color,
                dx: dx,
                dy: dy,
                blur: blur
            });
        };
        Snap.filter.shadow.toString = function() {
            return this();
        };
        Snap.filter.grayscale = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>', {
                a: .2126 + .7874 * (1 - amount),
                b: .7152 - .7152 * (1 - amount),
                c: .0722 - .0722 * (1 - amount),
                d: .2126 - .2126 * (1 - amount),
                e: .7152 + .2848 * (1 - amount),
                f: .0722 - .0722 * (1 - amount),
                g: .2126 - .2126 * (1 - amount),
                h: .0722 + .9278 * (1 - amount)
            });
        };
        Snap.filter.grayscale.toString = function() {
            return this();
        };
        Snap.filter.sepia = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>', {
                a: .393 + .607 * (1 - amount),
                b: .769 - .769 * (1 - amount),
                c: .189 - .189 * (1 - amount),
                d: .349 - .349 * (1 - amount),
                e: .686 + .314 * (1 - amount),
                f: .168 - .168 * (1 - amount),
                g: .272 - .272 * (1 - amount),
                h: .534 - .534 * (1 - amount),
                i: .131 + .869 * (1 - amount)
            });
        };
        Snap.filter.sepia.toString = function() {
            return this();
        };
        Snap.filter.saturate = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feColorMatrix type="saturate" values="{amount}"/>', {
                amount: 1 - amount
            });
        };
        Snap.filter.saturate.toString = function() {
            return this();
        };
        Snap.filter.hueRotate = function(angle) {
            angle = angle || 0;
            return Snap.format('<feColorMatrix type="hueRotate" values="{angle}"/>', {
                angle: angle
            });
        };
        Snap.filter.hueRotate.toString = function() {
            return this();
        };
        Snap.filter.invert = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>', {
                amount: amount,
                amount2: 1 - amount
            });
        };
        Snap.filter.invert.toString = function() {
            return this();
        };
        Snap.filter.brightness = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>', {
                amount: amount
            });
        };
        Snap.filter.brightness.toString = function() {
            return this();
        };
        Snap.filter.contrast = function(amount) {
            if (amount == null) {
                amount = 1;
            }
            return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>', {
                amount: amount,
                amount2: .5 - amount / 2
            });
        };
        Snap.filter.contrast.toString = function() {
            return this();
        };
    });
    return Snap;
});

(function(window) {
    "use strict";
    function classReg(className) {
        return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
    }
    function hasClass(el, c) {
        return "classList" in document.documentElement ? el.classList.contains(c) : classReg(c).test(el.className);
    }
    function extend(a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    }
    function mobilecheck() {
        var check = false;
        (function(a) {
            if (/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    }
    function isMouseLeaveOrEnter(e, handler) {
        if (e.type != "mouseout" && e.type != "mouseover") return false;
        var reltg = e.relatedTarget ? e.relatedTarget : e.type == "mouseout" ? e.toElement : e.fromElement;
        while (reltg && reltg != handler) reltg = reltg.parentNode;
        return reltg != handler;
    }
    function svgIcon(el, config, options) {
        this.el = el;
        this.options = extend({}, this.options);
        extend(this.options, options);
        this.svg = Snap(this.options.size.w, this.options.size.h);
        this.svg.attr("viewBox", "0 0 64 64");
        this.el.appendChild(this.svg.node);
        this.toggled = false;
        this.clickevent = mobilecheck() ? "touchstart" : "click";
        this.config = config[this.el.getAttribute("data-icon-name")];
        if (hasClass(this.el, "si-icon-reverse")) {
            this.reverse = true;
        }
        if (!this.config) return;
        var self = this;
        Snap.load(this.config.url, function(f) {
            var g = f.select("g");
            self.svg.append(g);
            self.options.onLoad();
            self._initEvents();
            if (self.reverse) {
                self.toggle();
            }
        });
    }
    svgIcon.prototype.options = {
        speed: 200,
        evtoggle: "click",
        size: {
            w: 64,
            h: 64
        },
        onLoad: function() {
            return false;
        },
        onToggle: function() {
            return false;
        }
    };
    svgIcon.prototype._initEvents = function() {
        var self = this, toggleFn = function(ev) {
            if ((ev.type.toLowerCase() === "mouseover" || ev.type.toLowerCase() === "mouseout") && isMouseLeaveOrEnter(ev, this) || ev.type.toLowerCase() === self.clickevent) {
                self.toggle(true);
                self.options.onToggle();
            }
        };
        if (this.options.evtoggle === "mouseover") {
            this.el.addEventListener("mouseover", toggleFn);
            this.el.addEventListener("mouseout", toggleFn);
        } else {
            this.el.addEventListener(this.clickevent, toggleFn);
        }
    };
    svgIcon.prototype.toggle = function(motion) {
        if (!this.config.animation) return;
        var self = this;
        for (var i = 0, len = this.config.animation.length; i < len; ++i) {
            var a = this.config.animation[i], el = this.svg.select(a.el), animProp = this.toggled ? a.animProperties.from : a.animProperties.to, val = animProp.val, timeout = motion && animProp.delayFactor ? animProp.delayFactor : 0;
            if (animProp.before) {
                el.attr(JSON.parse(animProp.before));
            }
            if (motion) {
                setTimeout(function(el, val, animProp) {
                    return function() {
                        el.animate(JSON.parse(val), self.options.speed, self.options.easing, function() {
                            if (animProp.after) {
                                this.attr(JSON.parse(animProp.after));
                            }
                            if (animProp.animAfter) {
                                this.animate(JSON.parse(animProp.animAfter), self.options.speed, self.options.easing);
                            }
                        });
                    };
                }(el, val, animProp), timeout * self.options.speed);
            } else {
                el.attr(JSON.parse(val));
            }
        }
        this.toggled = !this.toggled;
    };
    window.svgIcon = svgIcon;
})(window);