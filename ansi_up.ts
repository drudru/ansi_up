/* ansi_up.js
 * author : http://github.com/drudru/
 * license : MIT
 * http://github.com/drudru/ansi_up
 */

"use strict";

//
// INTERFACES
//

interface AU_Color
{
    rgb:number[];
    class_name:string;
    fg_style?:string;
    bg_style?:string;
    fg_span?:string;
}

// Represents the output of process_ansi(): a snapshot of the AnsiUp state machine
// at a given point in time, which wraps a fragment of text. This would allow deferred
// processing of text fragments and colors, if ever needed.
interface TextWithAttr {
    fg:AU_Color;
    bg:AU_Color;
    bold:boolean;
    faint:boolean;
    italic: boolean;
    underline: boolean;
    text:string;
}

// Used internally when breaking up the raw text into packets

enum PacketKind {
    EOS,
    Text,
    Incomplete,         // An Incomplete ESC sequence
    ESC,                // A single ESC char - random
    Unknown,            // A valid CSI but not an SGR code
    SGR,                // Select Graphic Rendition
    OSCURL,             // Operating System Command
}

interface TextPacket {
    kind:PacketKind;
    text:string;
     url:string;
}

//
// MAIN CLASS
//

export class AnsiUp
{
    VERSION = "6.0.6";

    //
    // *** SEE README ON GITHUB FOR PUBLIC API ***
    //

    // 256 Colors Palette
    // CSS RGB strings - ex. "255, 255, 255"
    private ansi_colors:AU_Color[][];
    private palette_256:AU_Color[];

    private fg:AU_Color;
    private bg:AU_Color;
    private bold:boolean;
    private faint:boolean;
    private italic: boolean;
    private underline:boolean;
    private _use_classes:boolean;

    private _csi_regex:RegExp;

    private _osc_st:RegExp;
    private _osc_regex:RegExp;

    private _url_allowlist:{};
    private _escape_html:boolean;

    private _buffer:string;

    private _boldStyle:string;
    private _faintStyle:string;
    private _italicStyle:string;
    private _underlineStyle:string;


    constructor()
    {
        // All construction occurs here
        this.setup_palettes();
        this._use_classes = false;

        this.bold = false;
        this.faint = false;
        this.italic = false;
        this.underline = false;
        this.fg = this.bg = null;

        this._buffer = '';

        this._url_allowlist = { 'http':1, 'https':1 };
        this._escape_html = true;

        this.boldStyle        = 'font-weight:bold';
        this.faintStyle       = 'opacity:0.7';
        this.italicStyle      = 'font-style:italic';
        this.underlineStyle   = 'text-decoration:underline'
    }

    set use_classes(arg:boolean)
    {
        this._use_classes = arg;
    }

    get use_classes():boolean
    {
        return this._use_classes;
    }

    set url_allowlist(arg:{})
    {
        this._url_allowlist = arg;
    }

    get url_allowlist():{}
    {
        return this._url_allowlist;
    }

    set escape_html(arg:boolean)
    {
        this._escape_html = arg;
    }

    get escape_html():boolean
    {
        return this._escape_html;
    }

    set boldStyle(arg:string)      {        this._boldStyle      = arg; }
    get boldStyle():string         { return this._boldStyle;            }
    set faintStyle(arg:string)     {        this._faintStyle     = arg; }
    get faintStyle():string        { return this._faintStyle;           }
    set italicStyle(arg:string)    {        this._italicStyle    = arg; }
    get italicStyle():string       { return this._italicStyle;          }
    set underlineStyle(arg:string) {        this._underlineStyle = arg; }
    get underlineStyle():string    { return this._underlineStyle;       }


    private setup_palettes():void
    {
        this.ansi_colors =
        [
            // Normal colors
            [
                { rgb: [  0,   0,   0],  class_name: "ansi-black"   },
                { rgb: [187,   0,   0],  class_name: "ansi-red"     },
                { rgb: [  0, 187,   0],  class_name: "ansi-green"   },
                { rgb: [187, 187,   0],  class_name: "ansi-yellow"  },
                { rgb: [  0,   0, 187],  class_name: "ansi-blue"    },
                { rgb: [187,   0, 187],  class_name: "ansi-magenta" },
                { rgb: [  0, 187, 187],  class_name: "ansi-cyan"    },
                { rgb: [255, 255, 255],  class_name: "ansi-white"   }
            ],

            // Bright colors
            [
                { rgb: [ 85,  85,  85],  class_name: "ansi-bright-black"   },
                { rgb: [255,  85,  85],  class_name: "ansi-bright-red"     },
                { rgb: [  0, 255,   0],  class_name: "ansi-bright-green"   },
                { rgb: [255, 255,  85],  class_name: "ansi-bright-yellow"  },
                { rgb: [ 85,  85, 255],  class_name: "ansi-bright-blue"    },
                { rgb: [255,  85, 255],  class_name: "ansi-bright-magenta" },
                { rgb: [ 85, 255, 255],  class_name: "ansi-bright-cyan"    },
                { rgb: [255, 255, 255],  class_name: "ansi-bright-white"   }
            ]
        ];

        this.palette_256 = [];

        // Index 0..15 : Ansi-Colors
        this.ansi_colors.forEach( palette => {
            palette.forEach( rec => {
                var s = rec.rgb[0]+','+rec.rgb[1]+','+rec.rgb[2];
                rec.fg_style = 'color:rgb('+s+')';
                rec.bg_style = 'background-color:rgb('+s+')';
                rec.fg_span = '<span style="color:rgb('+s+')">';
                this.palette_256.push(rec);
            });
        });

        // Index 16..231 : RGB 6x6x6
        // https://gist.github.com/jasonm23/2868981#file-xterm-256color-yaml
        let levels = [0, 95, 135, 175, 215, 255];
        for (let r = 0; r < 6; ++r) {
            for (let g = 0; g < 6; ++g) {
                for (let b = 0; b < 6; ++b) {
                    var s = levels[r]+','+levels[g]+','+levels[b];
                    let col = {rgb:[levels[r], levels[g], levels[b]], class_name:'truecolor',
                               fg_style:'color:rgb('+s+')', bg_style:'background-color:rgb('+s+')',
                               fg_span:'<span style="color:rgb('+s+')">'};
                    this.palette_256.push(col);
                }
            }
        }

        // Index 232..255 : Grayscale
        let grey_level = 8;
        for (let i = 0; i < 24; ++i, grey_level += 10) {
            var s = grey_level+','+grey_level+','+grey_level;
            let gry = {rgb:[grey_level, grey_level, grey_level], class_name:'truecolor',
                       fg_style:'color:rgb('+s+')', bg_style:'background-color:rgb('+s+')',
                       fg_span:'<span style="color:rgb('+s+')">'};
            this.palette_256.push(gry);
        }
    }

    private static _escMap:{[key:string]:string} = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'};
    private static _escRe = /[&<>"']/g;
    private static _escReplacer = (s:string) => AnsiUp._escMap[s];

    private escape_txt_for_html(txt:string):string
    {
      if (!this._escape_html)
          return txt;
      var tlen = txt.length;
      if (tlen < 64) {
          var needsEscape = false;
          for (var ei = 0; ei < tlen; ei++) {
              var ec = txt.charCodeAt(ei);
              if (ec === 38 || ec === 60 || ec === 62 || ec === 34 || ec === 39) { needsEscape = true; break; }
          }
          if (!needsEscape) return txt;
      }
      return txt.replace(AnsiUp._escRe, AnsiUp._escReplacer);
    }

    private append_buffer(txt:string) {

        var str = this._buffer + txt;
        this._buffer = str;
    }

    private get_next_packet():TextPacket {

        var pkt =
            {
                kind: PacketKind.EOS,
                text: '',
                 url: ''
            } ;

        var len = this._buffer.length;
        if (len == 0)
            return pkt;

        var pos = this._buffer.indexOf("\x1B");

        // The most common case, no ESC codes
        if (pos == -1)
        {
            pkt.kind = PacketKind.Text;
            pkt.text = this._buffer;
            this._buffer = '';
            return pkt;
        }

        if (pos > 0)
        {
            pkt.kind = PacketKind.Text;
            pkt.text = this._buffer.slice(0, pos);
            this._buffer = this._buffer.slice(pos);
            return pkt;
        }

        // NOW WE HANDLE ESCAPES
        if (pos == 0)
        {
            // All of the sequences typically need at least 3 characters
            // So, wait until we have at least that many
            if (len < 3)
            {
                pkt.kind = PacketKind.Incomplete;
                return pkt;
            }

            var next_char = this._buffer.charAt(1);

            // We treat this as a single ESC
            // No transformation
            if ((next_char != '[') && (next_char != ']') && (next_char != '('))
            {
                pkt.kind = PacketKind.ESC;
                pkt.text = this._buffer.slice(0, 1);
                this._buffer = this._buffer.slice(1);
                return pkt;
            }

            // OK is this an SGR or OSC that we handle

            // SGR CHECK
            if (next_char == '[')
            {
                var buf = this._buffer;

                if (len >= 4 && buf.charCodeAt(2) === 0x30 && buf.charCodeAt(3) === 0x6d) {
                    pkt.kind = PacketKind.SGR;
                    pkt.text = '0';
                    this._buffer = buf.slice(4);
                    return pkt;
                }

                if (len >= 3 && buf.charCodeAt(2) === 0x6d) {
                    pkt.kind = PacketKind.SGR;
                    pkt.text = '';
                    this._buffer = buf.slice(3);
                    return pkt;
                }

                var spos = 2;

                var hasPrivateMode = false;
                if (spos < len) {
                    var code = buf.charCodeAt(spos);
                    if (code >= 0x3c && code <= 0x3f) {
                        hasPrivateMode = true;
                        spos++;
                    }
                }

                var paramStart = spos;
                while (spos < len) {
                    var code = buf.charCodeAt(spos);
                    if ((code >= 0x30 && code <= 0x39) || code === 0x3b) {
                        spos++;
                    } else {
                        break;
                    }
                }
                var paramEnd = spos;

                var savePos = spos;
                var hasIntermediate = false;
                if (spos < len) {
                    var code = buf.charCodeAt(spos);
                    if (code >= 0x20 && code <= 0x2f) {
                        hasIntermediate = true;
                        spos++;
                    }
                }

                if (spos < len) {
                    var code = buf.charCodeAt(spos);
                    if (code >= 0x40 && code <= 0x7e) {
                        spos++;

                        if (hasPrivateMode || hasIntermediate || buf.charCodeAt(spos - 1) !== 0x6d)
                            pkt.kind = PacketKind.Unknown;
                        else
                            pkt.kind = PacketKind.SGR;

                        pkt.text = buf.substring(paramStart, paramEnd);
                        this._buffer = buf.slice(spos);
                        return pkt;
                    }
                }

                spos = savePos;
                while (spos < len) {
                    var code = buf.charCodeAt(spos);
                    if (code >= 0x20 && code <= 0x7e) {
                        spos++;
                    } else {
                        break;
                    }
                }

                if (spos < len) {
                    var code = buf.charCodeAt(spos);
                    if (code <= 0x1f || code === 0x3a) {
                        pkt.kind = PacketKind.ESC;
                        pkt.text = buf.slice(0, 1);
                        this._buffer = buf.slice(1);
                        return pkt;
                    }
                }

                pkt.kind = PacketKind.Incomplete;
                return pkt;
            }
            else
            // OSC CHECK
            if (next_char == ']')
            {
                if (len < 4)
                {
                        pkt.kind = PacketKind.Incomplete;
                        return pkt;
                }

                if (    (this._buffer.charAt(2) != '8')
                     || (this._buffer.charAt(3) != ';') )
                {
                    // This is not a match, so we'll just treat it as ESC
                    pkt.kind = PacketKind.ESC;
                    pkt.text = this._buffer.slice(0, 1);
                    this._buffer = this._buffer.slice(1);
                    return pkt;
                }

                // We do this regex initialization here so
                // we can keep the regex close to its use (Readability)

                // Matching a Hyperlink OSC with a regex is difficult
                // because Javascript's regex engine doesn't support
                // 'partial match' support.
                //
                // Therefore, we require the system to match the
                // string-terminator(ST) before attempting a match.
                // Once we find it, we attempt the Hyperlink-Begin
                // match.
                // If that goes ok, we scan forward for the next
                // ST.
                // Finally, we try to match it all and return
                // the sequence.
                // Also, it is important to note that we consider
                // certain control characters as an invalidation of
                // the entire sequence.

                // We do regex initializations here so
                // we can keep the regex close to its use (Readability)


                // STRING-TERMINATOR
                // This is likely to terminate in most scenarios
                // because it will terminate on a newline

                if (!this._osc_st) {

                    this._osc_st = rgxG`
                        (?:                         # legal sequence
                          (\x1b\\)                    # ESC \
                          |                           # alternate
                          (\x07)                      # BEL (what xterm did)
                        )
                        |                           # alternate (second attempt)
                        (                           # illegal sequence
                          [\x00-\x06]                 # anything illegal
                          |                           # alternate
                          [\x08-\x1a]                 # anything illegal
                          |                           # alternate
                          [\x1c-\x1f]                 # anything illegal
                        )
                    `;
                }

                // VERY IMPORTANT
                // We do a stateful regex match with exec.
                // If the regex is global, and it used with 'exec',
                // then it will search starting at the 'lastIndex'
                // If it matches, the regex can be used again to
                // find the next match.
                this._osc_st.lastIndex = 0;


                {
                    let match = this._osc_st.exec( this._buffer );

                    if (match === null)
                    {
                        pkt.kind = PacketKind.Incomplete;
                        return pkt;
                    }

                    // If an illegal character was found, bail on the match
                    if (match[3])
                    {
                        // Illegal sequence, just remove the ESC
                        pkt.kind = PacketKind.ESC;
                        pkt.text = this._buffer.slice(0, 1);
                        this._buffer = this._buffer.slice(1);
                        return pkt;
                    }
                }



                // OK - we might have the prefix and URI
                // Lets start our search for the next ST
                // past this index

                {
                    let match = this._osc_st.exec( this._buffer );

                    if (match === null)
                    {
                        pkt.kind = PacketKind.Incomplete;
                        return pkt;
                    }

                    // If an illegal character was found, bail on the match
                    if (match[3])
                    {
                        // Illegal sequence, just remove the ESC
                        pkt.kind = PacketKind.ESC;
                        pkt.text = this._buffer.slice(0, 1);
                        this._buffer = this._buffer.slice(1);
                        return pkt;
                    }
                }

                // OK, at this point we should have a FULL match!
                //
                // Lets try to match that now

                if (!this._osc_regex) {

                    this._osc_regex = rgx`
                        ^                           # beginning of line
                                                    #
                        \x1b\]8;                    # OSC Hyperlink
                        [\x20-\x3a\x3c-\x7e]*       # params (excluding ;)
                        ;                           # end of params
                        ([\x21-\x7e]{0,512})        # URL capture
                        (?:                         # ST
                          (?:\x1b\\)                  # ESC \
                          |                           # alternate
                          (?:\x07)                    # BEL (what xterm did)
                        )
                        ([\x20-\x7e]+)              # TEXT capture
                        \x1b\]8;;                   # OSC Hyperlink End
                        (?:                         # ST
                          (?:\x1b\\)                  # ESC \
                          |                           # alternate
                          (?:\x07)                    # BEL (what xterm did)
                        )
                    `;
                }

                let match = this._buffer.match(this._osc_regex);

                if (match === null)
                {
                    // Illegal sequence, just remove the ESC
                    pkt.kind = PacketKind.ESC;
                    pkt.text = this._buffer.slice(0, 1);
                    this._buffer = this._buffer.slice(1);
                    return pkt;
                }

                // match is an array
                // 0 - total match
                // 1 - URL
                // 2 - Text

                // If a valid SGR
                pkt.kind = PacketKind.OSCURL;
                pkt.url  = match[1];
                pkt.text = match[2];

                var rpos = match[0].length;
                this._buffer = this._buffer.slice(rpos);
                return pkt;
            }
            else
            // Other ESC CHECK
            if (next_char == '(')
            {
                // This specifies the character set, which
                // should just be ignored

                // We have at least 3, so drop the sequence
                pkt.kind = PacketKind.Unknown;
                this._buffer = this._buffer.slice(3);
                return pkt;
            }
        }
    }

    ansi_to_html(txt:string):string {

        var buf:string;
        if (this._buffer.length === 0) {
            buf = txt;
        } else {
            buf = this._buffer + txt;
        }
        this._buffer = '';

        if (buf.indexOf('\x1B') === -1) {
            if (!this.bold && !this.faint && !this.italic && !this.underline && this.fg === null && this.bg === null)
                return this.escape_txt_for_html(buf);
            return this.transform_to_html({ bold: this.bold, faint: this.faint, italic: this.italic, underline: this.underline, fg: this.fg, bg: this.bg, text: buf });
        }

        var blocks:string[] = [];
        var len = buf.length;
        var pos = 0;

        while (pos < len) {
            var escIdx = buf.indexOf('\x1B', pos);

            if (escIdx === -1) {
                this._push_text(blocks, buf.substring(pos));
                pos = len;
                break;
            }

            if (escIdx > pos) {
                this._push_text(blocks, buf.substring(pos, escIdx));
            }

            var remaining = len - escIdx;

            if (remaining < 2) {
                this._buffer = buf.substring(escIdx);
                break;
            }

            var nextCh = buf.charCodeAt(escIdx + 1);

            if (nextCh === 0x5b) {
                if (remaining < 3) {
                    this._buffer = buf.substring(escIdx);
                    break;
                }

                var spos = escIdx + 2;
                var code = buf.charCodeAt(spos);

                var hasPrivateMode = false;
                if (code >= 0x3c && code <= 0x3f) {
                    hasPrivateMode = true;
                    spos++;
                    if (spos >= len) { this._buffer = buf.substring(escIdx); break; }
                    code = buf.charCodeAt(spos);
                }

                var paramStart = spos;
                while (code >= 0x30 && code <= 0x39 || code === 0x3b) {
                    spos++;
                    if (spos >= len) break;
                    code = buf.charCodeAt(spos);
                }
                var paramEnd = spos;

                if (spos >= len) {
                    this._buffer = buf.substring(escIdx);
                    break;
                }

                var hasIntermediate = false;
                if (code >= 0x20 && code <= 0x2f) {
                    hasIntermediate = true;
                    spos++;
                    if (spos >= len) { this._buffer = buf.substring(escIdx); break; }
                    code = buf.charCodeAt(spos);
                }

                if (code >= 0x40 && code <= 0x7e) {
                    spos++;
                    if (!hasPrivateMode && !hasIntermediate && code === 0x6d) {
                        var plen = paramEnd - paramStart;
                        if (plen === 0 || (plen === 1 && buf.charCodeAt(paramStart) === 0x30)) {
                            this.fg = null; this.bg = null;
                            this.bold = false; this.faint = false;
                            this.italic = false; this.underline = false;
                        } else if (plen === 1) {
                            var d = buf.charCodeAt(paramStart) - 0x30;
                            if (d === 1) this.bold = true;
                            else if (d === 2) this.faint = true;
                            else if (d === 3) this.italic = true;
                            else if (d === 4) this.underline = true;
                            else this.process_ansi_text(buf.substring(paramStart, paramEnd));
                        } else if (plen === 2 && buf.charCodeAt(paramStart + 1) !== 0x3b) {
                            var n = (buf.charCodeAt(paramStart) - 0x30) * 10 + (buf.charCodeAt(paramStart + 1) - 0x30);
                            if      (n >= 30 && n < 38)  this.fg = this.ansi_colors[0][(n - 30)];
                            else if (n >= 40 && n < 48)  this.bg = this.ansi_colors[0][(n - 40)];
                            else if (n >= 90 && n < 98)  this.fg = this.ansi_colors[1][(n - 90)];
                            else if (n === 39)           this.fg = null;
                            else if (n === 49)           this.bg = null;
                            else if (n === 21)           this.bold = false;
                            else if (n === 22)         { this.faint = false; this.bold = false; }
                            else if (n === 23)           this.italic = false;
                            else if (n === 24)           this.underline = false;
                            else this.process_ansi_text(buf.substring(paramStart, paramEnd));
                        } else if (plen === 4 && buf.charCodeAt(paramStart) === 0x30 && buf.charCodeAt(paramStart + 1) === 0x3b) {
                            this.fg = null; this.bg = null;
                            this.bold = false; this.faint = false;
                            this.italic = false; this.underline = false;
                            var n = (buf.charCodeAt(paramStart + 2) - 0x30) * 10 + (buf.charCodeAt(paramStart + 3) - 0x30);
                            if      (n >= 30 && n < 38)  this.fg = this.ansi_colors[0][(n - 30)];
                            else if (n >= 40 && n < 48)  this.bg = this.ansi_colors[0][(n - 40)];
                            else if (n >= 90 && n < 98)  this.fg = this.ansi_colors[1][(n - 90)];
                            else if (n === 1) this.bold = true;
                            else if (n === 2) this.faint = true;
                            else if (n === 3) this.italic = true;
                            else if (n === 4) this.underline = true;
                        } else if (plen === 4 && buf.charCodeAt(paramStart + 1) === 0x3b) {
                            var d0 = buf.charCodeAt(paramStart) - 0x30;
                            var n2 = (buf.charCodeAt(paramStart + 2) - 0x30) * 10 + (buf.charCodeAt(paramStart + 3) - 0x30);
                            if (d0 === 0) {
                                this.fg = null; this.bg = null;
                                this.bold = false; this.faint = false;
                                this.italic = false; this.underline = false;
                            } else if (d0 === 1) this.bold = true;
                            else if (d0 === 2) this.faint = true;
                            else if (d0 === 3) this.italic = true;
                            else if (d0 === 4) this.underline = true;
                            if      (n2 >= 30 && n2 < 38) this.fg = this.ansi_colors[0][(n2 - 30)];
                            else if (n2 >= 40 && n2 < 48) this.bg = this.ansi_colors[0][(n2 - 40)];
                            else if (n2 >= 90 && n2 < 98) this.fg = this.ansi_colors[1][(n2 - 90)];
                            else if (n2 === 0) { this.fg = null; this.bg = null; this.bold = false; this.faint = false; this.italic = false; this.underline = false; }
                            else if (n2 === 1) this.bold = true;
                            else if (n2 === 2) this.faint = true;
                            else if (n2 === 3) this.italic = true;
                            else if (n2 === 4) this.underline = true;
                            else if (n2 === 39) this.fg = null;
                            else if (n2 === 49) this.bg = null;
                        } else if (plen >= 6 && buf.charCodeAt(paramStart + 2) === 0x3b) {
                            var d01 = (buf.charCodeAt(paramStart) - 0x30) * 10 + (buf.charCodeAt(paramStart + 1) - 0x30);
                            if ((d01 === 38 || d01 === 48) && buf.charCodeAt(paramStart + 4) === 0x3b) {
                                var modeC = buf.charCodeAt(paramStart + 3);
                                if (modeC === 0x35) {
                                    var palV = 0;
                                    var pp = paramStart + 5;
                                    while (pp < paramEnd && buf.charCodeAt(pp) !== 0x3b) {
                                        palV = palV * 10 + (buf.charCodeAt(pp) - 0x30);
                                        pp++;
                                    }
                                    if (palV >= 0 && palV <= 255) {
                                        if (d01 === 38) this.fg = this.palette_256[palV];
                                        else this.bg = this.palette_256[palV];
                                    }
                                    if (pp < paramEnd) {
                                        this.process_ansi_text(buf.substring(pp + 1, paramEnd));
                                    }
                                } else if (modeC === 0x32) {
                                    var rv = 0, gv = 0, bv = 0, pp = paramStart + 5, stg = 0;
                                    while (pp < paramEnd) {
                                        var cc = buf.charCodeAt(pp);
                                        if (cc === 0x3b) { stg++; pp++; continue; }
                                        if (stg === 0) rv = rv * 10 + (cc - 0x30);
                                        else if (stg === 1) gv = gv * 10 + (cc - 0x30);
                                        else if (stg === 2) bv = bv * 10 + (cc - 0x30);
                                        else break;
                                        pp++;
                                    }
                                    if (rv <= 255 && gv <= 255 && bv <= 255) {
                                        var cstr = rv+','+gv+','+bv;
                                        var col = { rgb: [rv,gv,bv], class_name: 'truecolor',
                                                    fg_style:'color:rgb('+cstr+')', bg_style:'background-color:rgb('+cstr+')'};
                                        if (d01 === 38) this.fg = col;
                                        else this.bg = col;
                                    }
                                    if (stg > 2 && pp < paramEnd) {
                                        this.process_ansi_text(buf.substring(pp, paramEnd));
                                    }
                                } else {
                                    this.process_ansi_text(buf.substring(paramStart, paramEnd));
                                }
                            } else {
                                this.process_ansi_text(buf.substring(paramStart, paramEnd));
                            }
                        } else {
                            this.process_ansi_text(buf.substring(paramStart, paramEnd));
                        }
                    }
                    pos = spos;
                    continue;
                }

                while (spos < len) {
                    code = buf.charCodeAt(spos);
                    if (code >= 0x20 && code <= 0x7e) { spos++; } else { break; }
                }
                if (spos < len) {
                    pos = escIdx + 1;
                    continue;
                }
                this._buffer = buf.substring(escIdx);
                break;
            }
            else if (nextCh === 0x5d) {
                this._buffer = buf.substring(escIdx);
                this._handle_osc_fallback(blocks);
                buf = '';
                len = 0;
                pos = 0;
                break;
            }
            else if (nextCh === 0x28) {
                if (remaining < 3) {
                    this._buffer = buf.substring(escIdx);
                    break;
                }
                pos = escIdx + 3;
                continue;
            }
            else {
                pos = escIdx + 1;
                continue;
            }
        }

        return blocks.join("");
    }

    private _push_text(blocks:string[], text:string):void {
        if (text.length === 0) return;
        if (!this.bold && !this.faint && !this.italic && !this.underline && this.fg === null && this.bg === null)
            blocks.push(this.escape_txt_for_html(text));
        else if (!this._use_classes && !this.bold && !this.faint && !this.italic && !this.underline && this.fg !== null && this.fg.fg_span && this.bg === null)
            blocks.push(this.fg.fg_span + this.escape_txt_for_html(text) + '</span>');
        else
            blocks.push(this.transform_to_html({ bold: this.bold, faint: this.faint, italic: this.italic, underline: this.underline, fg: this.fg, bg: this.bg, text: text }));
    }

    private _handle_osc_fallback(blocks:string[]):void {
        while (true) {
            var packet = this.get_next_packet();
            if (packet.kind == PacketKind.EOS || packet.kind == PacketKind.Incomplete) break;
            if (packet.kind == PacketKind.ESC || packet.kind == PacketKind.Unknown) continue;
            if (packet.kind == PacketKind.Text)
                blocks.push(this.transform_to_html(this.with_state(packet)));
            else if (packet.kind == PacketKind.SGR)
                this.process_ansi_text(packet.text);
            else if (packet.kind == PacketKind.OSCURL)
                blocks.push(this.process_hyperlink(packet));
        }
    }

    private with_state(pkt:TextPacket):TextWithAttr {
        return { bold: this.bold, faint: this.faint, italic: this.italic, underline: this.underline, fg: this.fg, bg: this.bg, text: pkt.text };
    }

    private process_ansi(pkt:TextPacket) { this.process_ansi_text(pkt.text); }

    private process_ansi_text(text:string)
    {
      if (text.length === 0 || text === '0') {
          this.fg = null; this.bg = null;
          this.bold = false; this.faint = false;
          this.italic = false; this.underline = false;
          return;
      }

      let sgr_cmds = text.split(';');

      // Each of these params affects the SGR state

      // Why do we shift through the array instead of a forEach??
      // ... because some commands consume the params that follow !

      while (sgr_cmds.length > 0) {
          let sgr_cmd_str = sgr_cmds.shift();
          let num = parseInt(sgr_cmd_str, 10);

      // TODO
      // AT SOME POINT, JUST CONVERT TO A LOOKUP TABLE
          if (isNaN(num) || num === 0) {
              this.fg        = null;
              this.bg        = null;
              this.bold      = false;
              this.faint     = false;
              this.italic    = false;
              this.underline = false;

          } else if (num ===  1) { this.bold      = true;
          } else if (num ===  2) { this.faint     = true;
          } else if (num ===  3) { this.italic    = true;
          } else if (num ===  4) { this.underline = true;
          } else if (num === 21) { this.bold      = false;
          } else if (num === 22) { this.faint     = false; this.bold = false;
          } else if (num === 23) { this.italic    = false;
          } else if (num === 24) { this.underline = false;

          } else if (num === 39) { this.fg = null;
          } else if (num === 49) { this.bg = null;

          } else if ((num >=  30) && (num <  38)) { this.fg = this.ansi_colors[0][(num -  30)];
          } else if ((num >=  40) && (num <  48)) { this.bg = this.ansi_colors[0][(num -  40)];
          } else if ((num >=  90) && (num <  98)) { this.fg = this.ansi_colors[1][(num -  90)];
          } else if ((num >= 100) && (num < 108)) { this.bg = this.ansi_colors[1][(num - 100)];

          } else if (num === 38 || num === 48) {

              // extended set foreground/background color

              // validate that param exists
              if (sgr_cmds.length > 0) {
                  // extend color (38=fg, 48=bg)
                  let is_foreground = (num === 38);

                  let mode_cmd = sgr_cmds.shift();

                  // MODE '5' - 256 color palette
                  if (mode_cmd === '5' && sgr_cmds.length > 0) {
                      let palette_index = parseInt(sgr_cmds.shift(), 10);
                      if (palette_index >= 0 && palette_index <= 255) {
                          if (is_foreground)
                              this.fg = this.palette_256[palette_index];
                          else
                              this.bg = this.palette_256[palette_index];
                      }
                  }

                  // MODE '2' - True Color
                  if (mode_cmd === '2' && sgr_cmds.length > 2) {
                      let r = parseInt(sgr_cmds.shift(), 10);
                      let g = parseInt(sgr_cmds.shift(), 10);
                      let b = parseInt(sgr_cmds.shift(), 10);

                      if ((r >= 0 && r <= 255) && (g >= 0 && g <= 255) && (b >= 0 && b <= 255)) {
                          var cs = r+','+g+','+b;
                          let c = { rgb: [r,g,b], class_name: 'truecolor',
                                    fg_style:'color:rgb('+cs+')', bg_style:'background-color:rgb('+cs+')'};
                          if (is_foreground)
                              this.fg = c;
                          else
                              this.bg = c;
                      }
                  }
              }
          }
      }
    }

    private transform_to_html(fragment:TextWithAttr):string {
        let txt = fragment.text;

        if (txt.length === 0)
            return txt;

        txt = this.escape_txt_for_html(txt);

        if (!fragment.bold && !fragment.italic && !fragment.faint && !fragment.underline && fragment.fg === null && fragment.bg === null)
            return txt;

        let fg = fragment.fg;
        let bg = fragment.bg;

        if (!this._use_classes) {
            var s = '';
            if (fragment.bold)      s = this._boldStyle;
            if (fragment.faint)     s = s ? s + ';' + this._faintStyle : this._faintStyle;
            if (fragment.italic)    s = s ? s + ';' + this._italicStyle : this._italicStyle;
            if (fragment.underline) s = s ? s + ';' + this._underlineStyle : this._underlineStyle;
            if (fg) s = s ? s + ';' + fg.fg_style : fg.fg_style;
            if (bg) s = s ? s + ';' + bg.bg_style : bg.bg_style;
            return '<span style="' + s + '">' + txt + '</span>';
        }

        let styles:string[] = [];
        let classes:string[] = [];

        if (fragment.bold)      styles.push(this._boldStyle);
        if (fragment.faint)     styles.push(this._faintStyle);
        if (fragment.italic)    styles.push(this._italicStyle);
        if (fragment.underline) styles.push(this._underlineStyle);

        if (fg) {
            if (fg.class_name !== 'truecolor') {
                classes.push(fg.class_name + '-fg');
            } else {
                styles.push(fg.fg_style);
            }
        }
        if (bg) {
            if (bg.class_name !== 'truecolor') {
                classes.push(bg.class_name + '-bg');
            } else {
                styles.push(bg.bg_style);
            }
        }

        let class_string = '';
        let style_string = '';

        if (classes.length)
            class_string = ` class="${classes.join(' ')}"`;

        if (styles.length)
            style_string = ` style="${styles.join(';')}"`;

        return `<span${style_string}${class_string}>${txt}</span>`;
    };

    private process_hyperlink(pkt:TextPacket):string
    {
        // Check URL scheme
        let parts = pkt.url.split(':');
        if (parts.length < 1)
            return '';

        if (! this._url_allowlist[parts[0]])
            return '';

        let result = `<a href="${this.escape_txt_for_html(pkt.url)}">${this.escape_txt_for_html(pkt.text)}</a>`;
        return result;
    }
}

//
// PRIVATE FUNCTIONS
//

// ES5 template string transformer
function rgx(tmplObj, ...subst) {
    // Use the 'raw' value so we don't have to double backslash in a template string
    let regexText:string = tmplObj.raw[0];

    // Remove white-space and comments
    let wsrgx = /^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm;
    let txt2 = regexText.replace(wsrgx, '');
    return new RegExp(txt2);
}

// ES5 template string transformer
// Multi-Line On
function rgxG(tmplObj, ...subst) {
    // Use the 'raw' value so we don't have to double backslash in a template string
    let regexText:string = tmplObj.raw[0];

    // Remove white-space and comments
    let wsrgx = /^\s+|\s+\n|\s*#[\s\S]*?\n|\n/gm;
    let txt2 = regexText.replace(wsrgx, '');
    return new RegExp(txt2, 'g');
}

