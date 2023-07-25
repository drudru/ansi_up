export interface AU_Color {
    rgb: number[];
    class_name: string;
}
export interface TextWithAttr {
    fg: AU_Color;
    bg: AU_Color;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    text: string;
}
declare enum PacketKind {
    EOS = 0,
    Text = 1,
    Incomplete = 2,
    ESC = 3,
    Unknown = 4,
    SGR = 5,
    OSCURL = 6
}
export interface TextPacket {
    kind: PacketKind;
    text: string;
    url: string;
}export class AnsiUp {
    ansi_colors: { rgb: number[]; class_name: string }[][];
    _useClasses: boolean;
    _escapeForHtml: boolean;
    bright: boolean;
    fg: null | { rgb: number[]; class_name: string };
    bg: null | { rgb: number[]; class_name: string };
    _buffer: string;
    palette_256: { rgb: number[]; class_name: string }[];
  
    constructor();
  
    setup_256_palette(): void;
  
    doEscape(txt: string): string;
  
    old_linkify(txt: string): string;
  
    detect_incomplete_ansi(txt: string): boolean;
  
    detect_incomplete_link(txt: string): number;
  
    ansi_to_html(txt: string): string;
  
    ansi_to_text(txt: string): string;
  
    wrap_text(txt: string): string;
  
    process_ansi(block: string): string;
  }
declare function rgx(tmplObj: any, ...subst: any[]): RegExp;
declare function rgxG(tmplObj: any, ...subst: any[]): RegExp;
