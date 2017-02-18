/*! ansi_up.js
 *  author : Dru Nelson
 *  license : MIT
 *  http://github.com/drudru/ansi_up
 */
export default class AnsiUp {
    VERSION: string;
    ansi_colors: {
        rgb: number[];
        class_name: string;
    }[][];
    private palette_256;
    private fg;
    private bg;
    private bright;
    private _use_classes;
    private _ignore_invalid;
    private _sgr_regex;
    constructor();
    use_classes: boolean;
    ignore_invalid: boolean;
    private setup_256_palette();
    escape_for_html(txt: string): string;
    linkify(txt: string): string;
    ansi_to_html(pkt: string): string;
    ansi_to_text(txt: string): string;
    private wrap_text(txt);
    private process_ansi(block);
}
