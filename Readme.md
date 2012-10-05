
_ansi2html_ is a simple library for converting text embedded with ANSI terminal color commands into HTML spans that render the proper coloring. This is compliant with AMD (require.js). This code has been used in production since early 2012. This is a new project, but I will actively maintain it and welcome all feedback. Thanks for reading. 

Turn this:

    ESC[1;Foreground
    [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [1;30m 30  [0m
    [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [1;31m 31  [0m
    [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [1;32m 32  [0m
    ...

Into this:

![](http://github.com/drudru/ansi2html/raw/master/sample.png) 

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
