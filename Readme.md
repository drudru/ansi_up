
_ansi2html_ is a simple library for converting text embedded with ANSI terminal color commands into HTML spans that render the proper coloring. This is compliant with AMD (require.js).

Turn this:

    ESC[1;Foreground
    [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [0m
    [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [0m
    [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [0m
    [1;33m 33  [1;33m 33  [1;33m 33  [1;33m 33  [1;33m 33  [1;33m 33  [1;33m 33  [1;33m 33  [0m
    [1;34m 34  [1;34m 34  [1;34m 34  [1;34m 34  [1;34m 34  [1;34m 34  [1;34m 34  [1;34m 34  [0m
    [1;35m 35  [1;35m 35  [1;35m 35  [1;35m 35  [1;35m 35  [1;35m 35  [1;35m 35  [1;35m 35  [0m
    [1;36m 36  [1;36m 36  [1;36m 36  [1;36m 36  [1;36m 36  [1;36m 36  [1;36m 36  [1;36m 36  [0m
    [1;37m 37  [1;37m 37  [1;37m 37  [1;37m 37  [1;37m 37  [1;37m 37  [1;37m 37  [1;37m 37  [0m
    ----------------------------------------------------------------
    ESC[0;Background
    [0;40m 40  [0;40m 40  [0;40m 40  [0;40m 40  [0;40m 40  [0;40m 40  [0;40m 40  [0;40m 40  [0m
    [0;41m 41  [0;41m 41  [0;41m 41  [0;41m 41  [0;41m 41  [0;41m 41  [0;41m 41  [0;41m 41  [0m
    [0;42m 42  [0;42m 42  [0;42m 42  [0;42m 42  [0;42m 42  [0;42m 42  [0;42m 42  [0;42m 42  [0m
    [0;43m 43  [0;43m 43  [0;43m 43  [0;43m 43  [0;43m 43  [0;43m 43  [0;43m 43  [0;43m 43  [0m
    [0;44m 44  [0;44m 44  [0;44m 44  [0;44m 44  [0;44m 44  [0;44m 44  [0;44m 44  [0;44m 44  [0m
    [0;45m 45  [0;45m 45  [0;45m 45  [0;45m 45  [0;45m 45  [0;45m 45  [0;45m 45  [0;45m 45  [0m
    [0;46m 46  [0;46m 46  [0;46m 46  [0;46m 46  [0;46m 46  [0;46m 46  [0;46m 46  [0;46m 46  [0m
    [0;47m 47  [0;47m 47  [0;47m 47  [0;47m 47  [0;47m 47  [0;47m 47  [0;47m 47  [0;47m 47  [0m
    ----------------------------------------------------------------

Into this:

![](http://github.com/brightroll/ansi2html/raw/master/sample.png) 

## Browser Example

    <script src="ansi2html.js" type="text/javascript"></script>
    <script type="text/javascript">

    var txt  = "\n\n\033[1;33;40m 33;40  \033[1;33;41m 33;41  \033[1;33;42m 33;42  \033[1;33;43m 33;43  \033[1;33;44m 33;44  \033[1;33;45m 33;45  \033[1;33;46m 33;46  \033[1m\033[0\n\n\033[1;33;42m >> Tests OK\n\n"

    var html = ansi2html.ansi_to_html(txt);

    var cdiv = document.getElementById("console");

    cdiv.innerHTML = html;

    </script>

There are examples in the repo that demonstrate this as well as a require.js and jQuery example.

## Installation

    $ npm install ansi2html

## API

_ansi2html_ should be called via the functions defined on the module. It is recommended that the HTML is rendered with a monospace font and black background. See the examples, for a basic CSS definition.

#### escape_for_html (txt)

This does the minimum escaping of text to make it compliant with HTML. In particular, the '&','<', and '>' characters are escaped.

#### linkify (txt)

This replaces any links in the text with anchor tags that display the link. The links should have at least one whitespace character surrounding it.

#### ansi_to_html (txt)

This replaces ANSI terminal escape codes with SPAN tags that wrap the content. The styles are inline on the SPAN tags.
## Building

Currently we are not using a build system, so there is just one file. Feel free to include the file in your asset minification process.

## Running tests

To run the tests for _ansi2html_, run `npm install` to install dependencies and then:

    $ make test

## License 

(The MIT License)

Copyright (c) 2011 Dru Nelson 

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WIT
