// ansi_up.js
// author : Dru Nelson
// license : MIT
// http://github.com/drudru/ansi_up
function rgx(tmplObj) {
    var subst = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        subst[_i - 1] = arguments[_i];
    }
    var regexText = tmplObj.raw[0];
    var wsrgx = /^\s+|\s+\n|\s+#[\s\S]+?\n/gm;
    var txt2 = regexText.replace(wsrgx, '');
    return new RegExp(txt2);
}
var AnsiUp = (function () {
    function AnsiUp() {
        this.VERSION = "2.0.0";
        this.ansi_colors = [
            [
                { rgb: [0, 0, 0], class_name: "ansi-black" },
                { rgb: [187, 0, 0], class_name: "ansi-red" },
                { rgb: [0, 187, 0], class_name: "ansi-green" },
                { rgb: [187, 187, 0], class_name: "ansi-yellow" },
                { rgb: [0, 0, 187], class_name: "ansi-blue" },
                { rgb: [187, 0, 187], class_name: "ansi-magenta" },
                { rgb: [0, 187, 187], class_name: "ansi-cyan" },
                { rgb: [255, 255, 255], class_name: "ansi-white" }
            ],
            [
                { rgb: [85, 85, 85], class_name: "ansi-bright-black" },
                { rgb: [255, 85, 85], class_name: "ansi-bright-red" },
                { rgb: [0, 255, 0], class_name: "ansi-bright-green" },
                { rgb: [255, 255, 85], class_name: "ansi-bright-yellow" },
                { rgb: [85, 85, 255], class_name: "ansi-bright-blue" },
                { rgb: [255, 85, 255], class_name: "ansi-bright-magenta" },
                { rgb: [85, 255, 255], class_name: "ansi-bright-cyan" },
                { rgb: [255, 255, 255], class_name: "ansi-bright-white" }
            ]
        ];
        this.setup_256_palette();
        this._use_classes = false;
        this.bright = false;
        this.fg = this.bg = null;
        this._ignore_invalid = true;
    }
    Object.defineProperty(AnsiUp.prototype, "use_classes", {
        get: function () {
            return this._use_classes;
        },
        set: function (arg) {
            this._use_classes = true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AnsiUp.prototype, "ignore_invalid", {
        get: function () {
            return this._ignore_invalid;
        },
        set: function (arg) {
            this._ignore_invalid = true;
        },
        enumerable: true,
        configurable: true
    });
    AnsiUp.prototype.setup_256_palette = function () {
        var _this = this;
        this.palette_256 = [];
        this.ansi_colors.forEach(function (palette) {
            palette.forEach(function (rec) {
                _this.palette_256.push(rec);
            });
        });
        var levels = [0, 95, 135, 175, 215, 255];
        for (var r = 0; r < 6; ++r) {
            for (var g = 0; g < 6; ++g) {
                for (var b = 0; b < 6; ++b) {
                    var c = { rgb: [levels[r], levels[g], levels[b]], class_name: 'truecolor' };
                    this.palette_256.push(c);
                }
            }
        }
        var grey_level = 8;
        for (var i = 0; i < 24; ++i, grey_level += 10) {
            var c = { rgb: [grey_level, grey_level, grey_level], class_name: 'truecolor' };
            this.palette_256.push(c);
        }
    };
    AnsiUp.prototype.escape_for_html = function (txt) {
        return txt.replace(/[&<>]/gm, function (str) {
            if (str == "&")
                return "&amp;";
            if (str == "<")
                return "&lt;";
            if (str == ">")
                return "&gt;";
        });
    };
    AnsiUp.prototype.linkify = function (txt) {
        return txt.replace(/(https?:\/\/[^\s]+)/gm, function (str) {
            return "<a href=\"" + str + "\">" + str + "</a>";
        });
    };
    ;
    AnsiUp.prototype.ansi_to_html = function (pkt) {
        var _this = this;
        var raw_text_pktks = pkt.split(/\033\[/);
        var first_txt = this.wrap_text(raw_text_pktks.shift());
        var blocks = raw_text_pktks.map(function (block) { return _this.wrap_text(_this.process_ansi(block)); });
        if (first_txt.length > 0)
            blocks.unshift(first_txt);
        return blocks.join('');
    };
    AnsiUp.prototype.ansi_to_text = function (txt) {
        var _this = this;
        var raw_text_pktks = txt.split(/\033\[/);
        var first_txt = raw_text_pktks.shift();
        var blocks = raw_text_pktks.map(function (block) { return _this.process_ansi(block); });
        if (first_txt.length > 0)
            blocks.unshift(first_txt);
        return blocks.join('');
    };
    AnsiUp.prototype.wrap_text = function (txt) {
        if (txt.length == 0)
            return txt;
        if (this.fg == null && this.bg == null)
            return txt;
        var styles = [];
        var classes = [];
        if (this._use_classes == false) {
            if (this.fg)
                styles.push("color:rgb(" + this.fg.rgb.join(',') + ")");
            if (this.bg)
                styles.push("background-color:rgb(" + this.bg.rgb + ")");
        }
        else {
            if (this.fg) {
                if (this.fg.class_name != 'truecolor') {
                    classes.push(this.fg.class_name + "-fg");
                }
                else {
                    styles.push("color:rgb(" + this.fg.rgb.join(',') + ")");
                }
            }
            if (this.bg) {
                if (this.bg.class_name != 'truecolor') {
                    classes.push(this.bg.class_name + "-bg");
                }
                else {
                    styles.push("background-color:rgb(" + this.bg.rgb.join(',') + ")");
                }
            }
        }
        var class_string = '';
        var style_string = '';
        if (classes.length)
            class_string = " class=\"" + classes.join(' ') + "\"";
        if (styles.length)
            style_string = " style=\"" + styles.join(';') + "\"";
        return "<span" + class_string + style_string + ">" + txt + "</span>";
    };
    AnsiUp.prototype.process_ansi = function (block) {
        // This must only be called with a string that started with a CSI (the string split above)
        // The CSI must not be in the string. We consider this string to be a 'block'.
        // It has an ANSI command at the front that affects the text that follows it.
        //
        // This regex is designed to parse an ANSI terminal CSI command. To be more specific,
        // we follow the XTERM conventions vs. the various other "standards".
        // http://invisible-island.net/xterm/ctlseqs/ctlseqs.html
        //
        // All ansi codes are typically in the following format. We parse it and focus
        // specifically on the graphics commands (SGR)
        //
        // CONTROL-SEQUENCE-INTRODUCER CSI             (ESC, '[') 
        // PRIVATE-MODE-CHAR                           (!, <, >, ?)
        // Numeric parameters separated by semicolons  ('0' - '9', ';')
        // Intermediate-modifiers                      (0x20 - 0x2f)
        // COMMAND-CHAR                                (0x40 - 0x7e)
        // 
        // We use a regex to parse into capture groups the PRIVATE-MODE-CHAR to the COMMAND
        // and the following text
        //
        if (!this._sgr_regex) {
            this._sgr_regex = (_a = ["\n              ^                           # beginning of line\n              ([!<-?]?)             # a private-mode char (!, <, =, >, ?)\n              ([d;]*)                    # any digits or semicolons\n              ([ -/]?               # an intermediate modifier\n               [@-~])               # the command\n              ([sS]*)                   # any text following this CSI sequence\n              "], _a.raw = ["\n              ^                           # beginning of line\n              ([!\\x3c-\\x3f]?)             # a private-mode char (!, <, =, >, ?)\n              ([\\d;]*)                    # any digits or semicolons\n              ([\\x20-\\x2f]?               # an intermediate modifier\n               [\\x40-\\x7e])               # the command\n              ([\\s\\S]*)                   # any text following this CSI sequence\n              "], rgx(_a));
            this._sgr_regex.multiline = true;
        }
        var matches = block.match(this._sgr_regex);
        if (!matches) {
            if (this._ignore_invalid)
                return block;
            throw new Error("should never happen");
        }
        var orig_txt = matches[4];
        if (matches[1] !== '' || matches[3] !== 'm')
            return orig_txt;
        var sgr_cmds = matches[2].split(';');
        while (sgr_cmds.length > 0) {
            var sgr_cmd_str = sgr_cmds.shift();
            var num = parseInt(sgr_cmd_str, 10);
            if (isNaN(num) || num === 0) {
                this.fg = this.bg = null;
                this.bright = false;
            }
            else if (num === 1) {
                this.bright = true;
            }
            else if (num == 39) {
                this.fg = null;
            }
            else if (num == 49) {
                this.bg = null;
            }
            else if ((num >= 30) && (num < 38)) {
                var bidx = this.bright ? 1 : 0;
                this.fg = this.ansi_colors[bidx][(num - 30)];
            }
            else if ((num >= 90) && (num < 98)) {
                this.fg = this.ansi_colors[1][(num - 90)];
            }
            else if ((num >= 40) && (num < 48)) {
                this.bg = this.ansi_colors[0][(num - 40)];
            }
            else if ((num >= 100) && (num < 108)) {
                this.bg = this.ansi_colors[1][(num - 100)];
            }
            else if (num === 38 || num === 48) {
                if (sgr_cmds.length > 0) {
                    var is_foreground = (num === 38);
                    var mode_cmd = sgr_cmds.shift();
                    if (mode_cmd === '5' && sgr_cmds.length > 0) {
                        var palette_index = parseInt(sgr_cmds.shift(), 10);
                        if (palette_index >= 0 && palette_index <= 255) {
                            if (is_foreground)
                                this.fg = this.palette_256[palette_index];
                            else
                                this.bg = this.palette_256[palette_index];
                        }
                    }
                    if (mode_cmd === '2' && sgr_cmds.length > 2) {
                        var r = parseInt(sgr_cmds.shift(), 10);
                        var g = parseInt(sgr_cmds.shift(), 10);
                        var b = parseInt(sgr_cmds.shift(), 10);
                        if ((r >= 0 && r <= 255) && (g >= 0 && g <= 255) && (b >= 0 && b <= 255)) {
                            var c = { rgb: [r, g, b], class_name: 'truecolor' };
                            if (is_foreground)
                                this.fg = c;
                            else
                                this.bg = c;
                        }
                    }
                }
            }
        }
        return orig_txt;
        var _a;
    };
    return AnsiUp;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AnsiUp;
