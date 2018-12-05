export interface AU_Color {
    rgb: number[];
    class_name: string;
}
export interface TextWithAttr {
    fg: AU_Color;
    bg: AU_Color;
    bold: boolean;
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
}
export interface Formatter {
    transform(fragment: TextWithAttr, instance: AnsiUp): any;
}
declare function rgx(tmplObj: any, ...subst: any[]): RegExp;
declare function rgxG(tmplObj: any, ...subst: any[]): RegExp;
export default class AnsiUp {
    VERSION: string;
    ansi_colors: {
        rgb: number[];
        class_name: string;
    }[][];
    htmlFormatter: Formatter;
    private palette_256;
    private fg;
    private bg;
    private bold;
    private _use_classes;
    private _escape_for_html;
    private _csi_regex;
    private _osc_st;
    private _osc_regex;
    private _url_whitelist;
    private _buffer;
    constructor();
    use_classes: boolean;
    escape_for_html: boolean;
    private setup_256_palette;
    private old_escape_for_html;
    append_buffer(txt: string): void;
    get_next_packet(): TextPacket;
    private ansi_to;
    ansi_to_html(txt: string): string;
    private with_state;
    private process_ansi;
    private process_hyperlink;
}
