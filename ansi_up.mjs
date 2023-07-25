export class AnsiUp {
    constructor() {
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
      this._useClasses = false;
      this._escapeForHtml = true;
      this.bright = false;
      this.fg = this.bg = null;
      this._buffer = '';
    }
  
    setup_256_palette() {
        var _this = this;
        this.palette_256 = [];
        // Index 0..15 : Ansi-Colors
        this.ansi_colors.forEach(function (palette) {
            palette.forEach(function (rec) {
                _this.palette_256.push(rec);
            });
        });
        // Index 16..231 : RGB 6x6x6
        // https://gist.github.com/jasonm23/2868981#file-xterm-256color-yaml
        var levels = [0, 95, 135, 175, 215, 255];
        for (var r = 0; r < 6; ++r) {
            for (var g = 0; g < 6; ++g) {
                for (var b = 0; b < 6; ++b) {
                    var c = { rgb: [levels[r], levels[g], levels[b]], class_name: 'truecolor' };
                    this.palette_256.push(c);
                }
            }
        }
        // Index 232..255 : Grayscale
        var grey_level = 8;
        for (var i = 0; i < 24; ++i, grey_level += 10) {
            var c = { rgb: [grey_level, grey_level, grey_level], class_name: 'truecolor' };
            this.palette_256.push(c);
        }    }

    doEscape(txt) {
        return txt.replace(/[&<>]/gm, function (str) {
            if (str === "&")
                return "&amp;";
            if (str === "<")
                return "&lt;";
            if (str === ">")
                return "&gt;";
        });
    }

    old_linkify(txt) {
        return txt.replace(/(https?:\/\/[^\s]+)/gm, function (str) {
            return "<a href=\"" + str + "\">" + str + "</a>";
        });
    }

    detect_incomplete_ansi(txt) {
        return !(/.*?[\x40-\x7e]/.test(txt));
    }

    detect_incomplete_link(txt) {
        var found = false;
        for (var i = txt.length - 1; i > 0; i--) {
            if (/\s|\x1B/.test(txt[i])) {
                found = true;
                break;
            }
        }
        if (!found) {
            // Handle one other case
            // Maybe the whol is a URL?
            if (/(https?:\/\/[^\s]+)/.test(txt)) {
                return 0;
            }
            else
                return -1;
        }
        // Test if possible prefix
        var prefix = txt.substr(i + 1, 4);
        if (prefix.length === 0)
            return -1;
        if ("http".indexOf(prefix) === 0) {
            return (i + 1);
        }
    }

    ansi_to_html(txt) {
        var _this = this;
        var pkt = this._buffer + txt;
        this._buffer = '';
        var raw_text_pkts = pkt.split(/\x1B\[/);
        if (raw_text_pkts.length === 1)
            raw_text_pkts.push('');
        // COMPLEX - BEGIN
        // Validate the last chunks for:
        // - incomplete ANSI sequence
        // - incomplete ESC
        // If any of these occur, we may have to buffer
        var last_pkt = raw_text_pkts[raw_text_pkts.length - 1];
        // - incomplete ANSI sequence
        if ((last_pkt.length > 0) && this.detect_incomplete_ansi(last_pkt)) {
            this._buffer = '\x1B\[' + last_pkt;
            raw_text_pkts.pop();
            raw_text_pkts.push('');
        }
        else {
            // - incomplete ESC
            if (last_pkt.slice(-1) === '\x1B') {
                this._buffer = '\x1B';
                console.log("raw", raw_text_pkts);
                raw_text_pkts.pop();
                raw_text_pkts.push(last_pkt.substr(0, last_pkt.length - 1));
                console.log(raw_text_pkts);
                console.log(last_pkt);
            }
            // - Incomplete ESC, only one packet
            if (raw_text_pkts.length === 2 && (raw_text_pkts[1] == '') && (raw_text_pkts[0].slice(-1) == "\x1B")) {
                this._buffer = "\x1B";
                last_pkt = raw_text_pkts.shift();
                raw_text_pkts.unshift(last_pkt.substr(0, last_pkt.length - 1));
            }
        }
        // COMPLEX - END
        var first_txt = this.wrap_text(raw_text_pkts.shift()); // the first pkt is not the result of the split
        var blocks = raw_text_pkts.map(function (block) { return _this.wrap_text(_this.process_ansi(block)); });
        if (first_txt.length > 0)
            blocks.unshift(first_txt);
        return blocks.join('');
    };

    ansi_to_text(txt) {
        var _this = this;
        var raw_text_pkts = txt.split(/\x1B\[/);
        var first_txt = raw_text_pkts.shift(); // the first pkt is not the result of the split
        var blocks = raw_text_pkts.map(function (block) { return _this.process_ansi(block); });
        if (first_txt.length > 0)
            blocks.unshift(first_txt);
        return blocks.join('');
    };

    wrap_text(txt) {
        if (txt.length === 0)
        return txt;
    if (this._escapeForHtml)
        txt = this.doEscape(txt);
    if (!this.bright && this.fg === null && this.bg === null)
        return txt;
    var styles = [];
    var classes = [];
    var fg = this.fg;
    var bg = this.bg;
    // Handle the case where we are told to be bright, but without a color
    if (fg === null && this.bright)
        fg = this.ansi_colors[1][7];
    if (!this._useClasses) {
        // USE INLINE STYLES
        if (fg)
            styles.push("color:rgb(" + fg.rgb.join(',') + ")");
        if (bg)
            styles.push("background-color:rgb(" + bg.rgb + ")");
    }
    else {
        // USE CLASSES
        if (fg) {
            if (fg.class_name !== 'truecolor') {
                classes.push(fg.class_name + "-fg");
            }
            else {
                styles.push("color:rgb(" + fg.rgb.join(',') + ")");
            }
        }
        if (bg) {
            if (bg.class_name !== 'truecolor') {
                classes.push(bg.class_name + "-bg");
            }
            else {
                styles.push("background-color:rgb(" + bg.rgb.join(',') + ")");
            }
        }
    }
    var clas = '';
    var styl = '';
    if (classes.length)
        clas = " class=\"" + classes.join(' ') + "\"";
    if (styles.length)
        styl = " style=\"" + styles.join(';') + "\"";
    return "<span" + clas + styl + ">" + txt + "</span>";
};

    process_ansi(block) {
        // This must only be called with  that started with a CSI (th split above)
        // The CSI must not be in th. We consider thi to be a 'block'.
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
        // Lazy regex creation to keep nicely commented code here
        // NOTE: default is multiline (workaround for now til I can
        // determine flags inline)
        if (!this._sgr_regex) {
            this._sgr_regex = (_a = ["\n              ^                           # beginning of line\n              ([!<-?]?)             # a private-mode char (!, <, =, >, ?)\n              ([d;]*)                    # any digits or semicolons\n              ([ -/]?               # an intermediate modifier\n               [@-~])               # the command\n              ([sS]*)                   # any text following this CSI sequence\n              "], _a.raw = ["\n              ^                           # beginning of line\n              ([!\\x3c-\\x3f]?)             # a private-mode char (!, <, =, >, ?)\n              ([\\d;]*)                    # any digits or semicolons\n              ([\\x20-\\x2f]?               # an intermediate modifier\n               [\\x40-\\x7e])               # the command\n              ([\\s\\S]*)                   # any text following this CSI sequence\n              "], this.rgx(_a));
        }
        var matches = block.match(this._sgr_regex);
        // The regex should have handled all cases!
        if (!matches)
            return block;
        var orig_txt = matches[4];
        if (matches[1] !== '' || matches[3] !== 'm')
            return orig_txt;
        // Ok - we have a valid "SGR" (Select Graphic Rendition)
        var sgr_cmds = matches[2].split(';');
        // Each of these params affects the SGR state
        // Why do we shift through the array instead of a forEach??
        // ... because some commands consume the params that follow !
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
            else if (num === 22) {
                this.bright = false;
            }
            else if (num === 39) {
                this.fg = null;
            }
            else if (num === 49) {
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
                // extended set foreground/background color
                // validate that param exists
                if (sgr_cmds.length > 0) {
                    // extend color (38=fg, 48=bg)
                    var is_foreground = (num === 38);
                    var mode_cmd = sgr_cmds.shift();
                    // MODE '5' - 256 color palette
                    if (mode_cmd === '5' && sgr_cmds.length > 0) {
                        var palette_index = parseInt(sgr_cmds.shift(), 10);
                        if (palette_index >= 0 && palette_index <= 255) {
                            if (is_foreground)
                                this.fg = this.palette_256[palette_index];
                            else
                                this.bg = this.palette_256[palette_index];
                        }
                    }
                    // MODE '2' - True Color
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

    rgx(tmplObj) {
        var subst = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            subst[_i - 1] = arguments[_i];
        }
        // Use the 'raw' value so we don't have to double backslash in a templat
        var regexText = tmplObj.raw[0];
        // Remove white-space and comments
        var wsrgx = /^\s+|\s+\n|\s+#[\s\S]+?\n/gm;
        var txt2 = regexText.replace(wsrgx, '');
        return new RegExp(txt2, 'm');
    }; 
}
