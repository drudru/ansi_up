// ansi_up.js
// author : Dru Nelson
// license : MIT
// http://github.com/drudru/ansi_up

interface SGR
{
    fg:AU_Color;
    bg:AU_Color;
    txt:string;
}

interface AU_Color
{
    rgb:number[];
    class_name:string;
}

function rgx(tmplObj, ...subst) {
    // Use the 'raw' value so we don't have to double backslash in a template string
    let regexText:string = tmplObj.raw[0];

    // Remove white-space and comments
    let wsrgx = /^\s+|\s+\n|\s+#[\s\S]+?\n/gm;
    let txt2 = regexText.replace(wsrgx, '');
    return new RegExp(txt2);
}

export default class AnsiUp
{
    VERSION = "2.0.0";

    ansi_colors =
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

    // 256 Colors Palette
    // CSS RGB strings - ex. "255, 255, 255"
    palette_256:AU_Color[];

    fg:AU_Color = null;
    bg:AU_Color = null;
    bright:boolean = false;

    private _use_classes:boolean = false;
    private _ignore_invalid:boolean = true;
    private _sgr_regex:RegExp;

    constructor()
    {
        this.setup_256_palette();
       
    }
    
    set use_classes(arg:boolean)
    {
        this._use_classes = arg;
    }
    
    get use_classes():boolean
    {
        return this._use_classes;
    }
    
    set ignore_invalid(arg:boolean)
    {
        this._ignore_invalid = arg;
    }
    
    get ignore_invalid():boolean
    {
        return this._ignore_invalid;
    }

    private setup_256_palette():void
    {
        this.palette_256 = [];

        // Index 0..15 : Ansi-Colors
        this.ansi_colors.forEach( palette => {
            palette.forEach( rec => {
                this.palette_256.push(rec);
            });
        });

        // Index 16..231 : RGB 6x6x6
        // https://gist.github.com/jasonm23/2868981#file-xterm-256color-yaml
        let levels = [0, 95, 135, 175, 215, 255];
        for (let r = 0; r < 6; ++r) {
            for (let g = 0; g < 6; ++g) {
                for (let b = 0; b < 6; ++b) {
                    let c = {rgb:[levels[r], levels[g], levels[b]], class_name:'truecolor'};
                    this.palette_256.push(c);
                }
            }
        }

        // Index 232..255 : Grayscale
        let grey_level = 8;
        for (let i = 0; i < 24; ++i, grey_level += 10) {
            let c = {rgb:[grey_level, grey_level, grey_level], class_name:'truecolor'};
            this.palette_256.push(c);
        }
    }
    
    escape_for_html(txt:string):string
    {
      return txt.replace(/[&<>]/gm, (str) => {
        if (str == "&") return "&amp;";
        if (str == "<") return "&lt;";
        if (str == ">") return "&gt;";
      });
    }
    
    linkify(txt:string):string
    {
      return txt.replace(/(https?:\/\/[^\s]+)/gm, (str) => {
        return `<a href="${str}">${str}</a>`;
      });
    };

    ansi_to_html(pkt:string):string
    {
        var raw_text_pktks = pkt.split(/\033\[/);
        var first_txt = this.wrap_text(raw_text_pktks.shift()); // the first pkt is not the result of the split

        let blocks = raw_text_pktks.map( (block) => this.wrap_text(this.process_ansi(block)) );

         if (first_txt.length > 0)
            blocks.unshift(first_txt);

        return blocks.join('');
    }

    ansi_to_text(txt:string):string
    {
        var raw_text_pktks = txt.split(/\033\[/);
        var first_txt = raw_text_pktks.shift(); // the first pkt is not the result of the split
        
        let blocks = raw_text_pktks.map( (block) => this.process_ansi(block) );

        if (first_txt.length > 0)
            blocks.unshift(first_txt);
            
        return blocks.join('');
    }
    
    private wrap_text(txt:string):string
    {
        if (txt.length == 0)
            return txt;

        // If colors not set, default style is used
        if (this.fg == null && this.bg == null)
            return txt;
            
        let styles:string[] = [];
        let classes:string[] = [];

        if (this._use_classes == false) {
            // USE INLINE STYLES
            if (this.fg)
                styles.push(`color:rgb(${this.fg.rgb.join(',')})`);
            if (this.bg)
                styles.push(`background-color:rgb(${this.bg.rgb})`);
        } else {
            // USE CLASSES
            if (this.fg) {
                if (this.fg.class_name != 'truecolor') {
                    classes.push(`${this.fg.class_name}-fg`);
                } else {
                    styles.push(`color:rgb(${this.fg.rgb.join(',')})`);
                }
            }
            if (this.bg) {
                if (this.bg.class_name != 'truecolor') {
                    classes.push(`${this.bg.class_name}-bg`);
                } else {
                    styles.push(`background-color:rgb(${this.bg.rgb.join(',')})`);
                }
            }
        }

        let class_string = '';
        let style_string = '';
        
        if (classes.length)
            class_string = ` class="${classes.join(' ')}"`;

        if (styles.length)
            style_string = ` style="${styles.join(';')}"`;

        return `<span${class_string}${style_string}>${txt}</span>`;
    }

    private process_ansi(block:string):string
    {
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

      // Lazy regex creation to keep nicely commented code here
      if (!this._sgr_regex) {
          this._sgr_regex = rgx`
              ^                           # beginning of line
              ([!\x3c-\x3f]?)             # a private-mode char (!, <, =, >, ?)
              ([\d;]*)                    # any digits or semicolons
              ([\x20-\x2f]?               # an intermediate modifier
               [\x40-\x7e])               # the command
              ([\s\S]*)                   # any text following this CSI sequence
              `;
          this._sgr_regex.multiline = true;
      }
      
      let matches = block.match(this._sgr_regex);

      // The regex should have handled all cases!
      if (!matches) {
          if (this._ignore_invalid)
            return block;  
          throw new Error("should never happen");
      }

      let orig_txt = matches[4];
      
      if (matches[1] !== '' || matches[3] !== 'm')
        return orig_txt;

      // Ok - we have a valid "SGR" (Select Graphic Rendition)
      
      let sgr_cmds = matches[2].split(';');
      
      // Each of these params affects the SGR state
      
      // Why do we shift through the array instead of a forEach??
      // ... because some commands consume the params that follow !
      while (sgr_cmds.length > 0) {
          let sgr_cmd_str = sgr_cmds.shift();
          let num = parseInt(sgr_cmd_str, 10);

          if (isNaN(num) || num === 0) {
              this.fg = this.bg = null;
              this.bright = false;
          } else if (num === 1) {
              this.bright = true;
          } else if (num == 39) {
              this.fg = null;
          } else if (num == 49) {
              this.bg = null;
          } else if ((num >= 30) && (num < 38)) {
              let bidx = this.bright ? 1 : 0;
              this.fg = this.ansi_colors[bidx][(num - 30)];
          } else if ((num >= 90) && (num < 98)) {
              this.fg = this.ansi_colors[1][(num - 90)];
          } else if ((num >= 40) && (num < 48)) {
              this.bg = this.ansi_colors[0][(num - 40)];
          } else if ((num >= 100) && (num < 108)) {
              this.bg = this.ansi_colors[1][(num - 100)];
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
                        let c = { rgb: [r,g,b], class_name: 'truecolor'};
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
    }
}
