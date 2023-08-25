
import { AnsiUp } from '../ansi_up.js';

describe('ansi_up', function () {

  describe('escape_for_html on', function () {

    describe('ampersands', function () {

      it('should escape a single ampersand', function () {
        var start = "&";
        var expected = "&amp;";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should escape some text with ampersands', function () {
        var start = "abcd&efgh";
        var expected = "abcd&amp;efgh";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should escape multiple ampersands', function () {
        var start = " & & ";
        var expected = " &amp; &amp; ";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should escape an already escaped ampersand', function () {
        var start = " &amp; ";
        var expected = " &amp;amp; ";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });
    });

    describe('less-than', function () {

      it('should escape a single less-than', function () {
        var start = "<";
        var expected = "&lt;";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should escape some text with less-thans', function () {
        var start = "abcd<efgh";
        var expected = "abcd&lt;efgh";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should escape multiple less-thans', function () {
        var start = " < < ";
        var expected = " &lt; &lt; ";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

    });

    describe('greater-than', function () {

      it('should escape a single greater-than', function () {
        var start = ">";
        var expected = "&gt;";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should escape some text with greater-thans', function () {
        var start = "abcd>efgh";
        var expected = "abcd&gt;efgh";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should escape multiple greater-thans', function () {
        var start = " > > ";
        var expected = " &gt; &gt; ";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

    });

    describe('mixed characters', function () {

      it('should escape a mix of characters that require escaping', function () {
        var start = "<&>/\\'\"";
        var expected = "&lt;&amp;&gt;/\\&#x27;&quot;";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

    });

  });

  describe('hyperlinks', function () {

    it('should create an anchor tag with ST', function () {
      var start = "ABC \x1b]8;;http://example.com\x1b\\EXAMPLE\x1b]8;;\x1b\\ DEF"
      var expected = "ABC <a href=\"http://example.com\">EXAMPLE</a> DEF";

      var au = new AnsiUp();
      var l = au.ansi_to_html(start);
      l.should.eql(expected);
    });

    it('should create an anchor tag with BEL', function () {
      var start = "ABC \x1b]8;;http://example.com\x07EXAMPLE\x1b]8;;\x07 DEF"
      var expected = "ABC <a href=\"http://example.com\">EXAMPLE</a> DEF";

      var au = new AnsiUp();
      var l = au.ansi_to_html(start);
      l.should.eql(expected);
    });

    it('should handle two in a row (state testing)', function () {
      var start  = "ABC \x1b]8;;http://1.example.com\x07EXAMPLE1\x1b]8;;\x07 DEF"
          start += "GHI \x1b]8;;http://2.example.com\x07EXAMPLE2\x1b]8;;\x07 JKL"
      var expected  = "ABC <a href=\"http://1.example.com\">EXAMPLE1</a> DEF";
          expected += "GHI <a href=\"http://2.example.com\">EXAMPLE2</a> JKL";

      var au = new AnsiUp();
      var l = au.ansi_to_html(start);
      l.should.eql(expected);
    });

    it('should allow spaces in anchor text', function () {
      var start = "ABC \x1b]8;;http://example.com\x1b\\A Link\x1b]8;;\x1b\\ DEF"
      var expected = "ABC <a href=\"http://example.com\">A Link</a> DEF";

      var au = new AnsiUp();
      var l = au.ansi_to_html(start);
      l.should.eql(expected);
    });

  });

  /*
  describe("ansi_to()", function() {

    // Prove that interaction between AnsiUp and the formatter is correct and that formatters
    // can be completely isolated code.
    it("accepts an arbitrary formatter and provides ANSI information related to text segments", function() {
      var attr = 1; // bold
      var fg = 32; // green fg
      var bg = 41; // red bg
      var lines = [
        "should have no color",
        "\x1B[" + attr + ";" + fg + "m " + "should be bold with green foreground" + "\x1B[0m",
        "\x1B[" + attr + ";" + bg + ";" + fg + "m " + "should have bold with red background with green foreground" + "\x1B[0m",
        "\x1B[" +              bg + ";" + fg + "m " + "should have red background with green foreground" + "\x1B[0m"
      ];

      var stats = {};

      // A silly formatter that collects statistics about the text it receives.
      var statsFormatter = {
        transform: function(data) {
          var text = data.text.replace(/^\s+|\s+$/, "");

          if (text.length) {
            if (!stats[text]) {
              stats[text] = [];
            }

            if (data.bold) stats[text].push('bold');
            if (data.fg)   stats[text].push(data.fg.class_name);
            if (data.bg)   stats[text].push(data.bg.class_name);
          }

          return text;
        },

        compose: function(segments) {
          return "processed: " + segments.filter(function (s) { return s.length; }).join(", ");
        }
      };

      var au = new AnsiUp();
      au.use_classes = true;

      var plainText = au.ansi_to(lines.join(""), statsFormatter);

      plainText.should.eql("processed: should have no color, should be bold with green foreground, should have bold with red background with green foreground, should have red background with green foreground");

      stats.should.eql({
        "should have no color": [],
        "should be bold with green foreground": ["bold", "ansi-green"],
        "should have bold with red background with green foreground": ["bold", "ansi-green", "ansi-red"],
        "should have red background with green foreground": ["ansi-green", "ansi-red"]
      });
    });
  });
  */

  describe('ansi to html', function () {

    describe('default colors', function () {
      it('should transform a foreground to html', function () {
        var attr = 0;
        var fg = 32;
        var start = "\x1B[" + fg + "m " + fg + " \x1B[0m";

        var expected = "<span style=\"color:rgb(0,187,0)\"> " + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });


      it('should transform a attr;foreground to html', function () {
        var attr = 0;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + "m " + fg + "  \x1B[0m";

        var expected = "<span style=\"color:rgb(0,187,0)\"> " + fg + "  </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform an empty code to a normal/reset html', function () {
        var attr = 0;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + "m " + fg + "  \x1B[m x";

        var expected = "<span style=\"color:rgb(0,187,0)\"> " + fg + "  </span> x";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a bold attr;foreground to html', function () {
        var attr = 1;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + "m " + attr + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"font-weight:bold;color:rgb(0,187,0)\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a faint attr;foreground to html', function () {
        var attr = 2;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + "m " + attr + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"opacity:0.7;color:rgb(0,187,0)\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should reset a bold attr to html', function () {
        var attr = 1;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + ";21m " + attr + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"color:rgb(0,187,0)\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should reset a faint attr to html', function () {
        var attr = 2;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + ";22m " + attr + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"color:rgb(0,187,0)\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should reset a bold and faint attr to just faint html', function () {
        var attr = "1;2";
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + ";21m " + attr + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"opacity:0.7;color:rgb(0,187,0)\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should reset a bold and faint attr to just html', function () {
        var attr = "1;2";
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + ";22m " + attr + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"color:rgb(0,187,0)\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });


      it('should transform an italic attr;foreground to html', function () {
        var attr = 3;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + "m " + attr + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"font-style:italic;color:rgb(0,187,0)\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform an underline attr;foreground to html', function () {
        var attr = 4;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + "m " + attr + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"text-decoration:underline;color:rgb(0,187,0)\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a bright-foreground to html', function () {
        var fg = 92;
        var start = "\x1B[" + fg + "m " + fg + " \x1B[0m";

        var expected = "<span style=\"color:rgb(0,255,0)\"> " + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a bold attr;background;foreground to html', function () {
        var attr = 1;
        var fg = 33;
        var bg = 42;
        var start = "\x1B[" + attr + ";" + bg + ";" + fg + "m " + attr + ";" + bg + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"font-weight:bold;color:rgb(187,187,0);background-color:rgb(0,187,0)\"> " + attr + ";" + bg + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a bright-background;foreground to html', function () {
        var fg = 33;
        var bg = 102;
        var start = "\x1B[" + bg + ";" + fg + "m " + bg + ";" + fg + " \x1B[0m";

        var expected = "<span style=\"color:rgb(187,187,0);background-color:rgb(0,255,0)\"> " + bg + ";" + fg + " </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });


      it('should transform a complex multi-line sequence to html', function () {
        var attr = 1;
        var fg = 32;
        var bg = 42;
        var start = "\n \x1B[" + fg + "m " + fg + "  \x1B[0m \n  \x1B[" + bg + "m " + bg + "  \x1B[0m \n zimpper ";

        var expected = "\n <span style=\"color:rgb(0,187,0)\"> " + fg + "  </span> \n  <span style=\"background-color:rgb(0,187,0)\"> " + bg + "  </span> \n zimpper ";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a foreground and background and reset foreground to html', function () {
        var fg = 37;
        var bg = 42;
        var start = "\n\x1B[40m \x1B[49m\x1B[" + fg + ";" + bg + "m " + bg + " \x1B[39m foobar ";

        var expected = "\n<span style=\"background-color:rgb(0,0,0)\"> </span><span style=\"color:rgb(255,255,255);background-color:rgb(0,187,0)\"> " + bg + " </span><span style=\"background-color:rgb(0,187,0)\"> foobar </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a foreground and background and reset background to html', function () {
        var fg = 37;
        var bg = 42;
        var start = "\n\x1B[40m \x1B[49m\x1B[" + fg + ";" + bg + "m " + fg + " \x1B[49m foobar ";

        var expected = "\n<span style=\"background-color:rgb(0,0,0)\"> </span><span style=\"color:rgb(255,255,255);background-color:rgb(0,187,0)\"> " + fg + " </span><span style=\"color:rgb(255,255,255)\"> foobar </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a foreground and background and reset them to html', function () {
        var fg = 37;
        var bg = 42;
        var start = "\n\x1B[40m \x1B[49m\x1B[" + fg + ";" + bg + "m " + fg + ';' + bg + " \x1B[39;49m foobar ";

        var expected = "\n<span style=\"background-color:rgb(0,0,0)\"> </span><span style=\"color:rgb(255,255,255);background-color:rgb(0,187,0)\"> " + fg + ';' + bg + " </span> foobar ";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      describe('transform extended colors (palette)', function () {
        it('system color, foreground', function () {
          var start = "\x1B[38;5;1m" + "red" + "\x1B[0m";
          var expected = '<span style="color:rgb(187,0,0)">red</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('system color, foreground (bright)', function () {
          var start = "\x1B[38;5;9m" + "red" + "\x1B[0m";
          var expected = '<span style="color:rgb(255,85,85)">red</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('system color, background', function () {
          var start = "\x1B[48;5;1m" + "red" + "\x1B[0m";
          var expected = '<span style="background-color:rgb(187,0,0)">red</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('system color, background (bright)', function () {
          var start = "\x1B[48;5;9m" + "red" + "\x1B[0m";
          var expected = '<span style="background-color:rgb(255,85,85)">red</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('palette, foreground', function () {
          var start = "\x1B[38;5;171m" + "foo" + "\x1B[0m";
          var expected = '<span style="color:rgb(215,95,255)">foo</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('palette, background', function () {
          var start = "\x1B[48;5;171m" + "foo" + "\x1B[0m";
          var expected = '<span style="background-color:rgb(215,95,255)">foo</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('combination of bold and palette', function () {
          var start = "\x1B[1;38;5;171m" + "foo" + "\x1B[0m";
          var expected = '<span style="font-weight:bold;color:rgb(215,95,255)">foo</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('combination of palette and bold', function () {
          var start = "\x1B[38;5;171;1m" + "foo" + "\x1B[0m";
          var expected = '<span style="font-weight:bold;color:rgb(215,95,255)">foo</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });
      });

      describe('transform extended colors (true color)', function () {
        it('foreground', function () {
          var start = "\x1B[38;2;42;142;242m" + "foo" + "\x1B[0m";
          var expected = '<span style="color:rgb(42,142,242)">foo</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });
        it('background', function () {
          var start = "\x1B[48;2;42;142;242m" + "foo" + "\x1B[0m";
          var expected = '<span style="background-color:rgb(42,142,242)">foo</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });
        it('both foreground and background', function () {
          var start = "\x1B[38;2;42;142;242;48;2;1;2;3m" + "foo" + "\x1B[0m";
          var expected = '<span style="color:rgb(42,142,242);background-color:rgb(1,2,3)">foo</span>';
          var au = new AnsiUp();
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });
      });
    });

    describe('themed colors', function () {
      it('should transform a foreground to html', function () {
        var attr = 0;
        var fg = 32;
        var start = "\x1B[" + fg + "m " + fg + " \x1B[0m";

        var expected = "<span class=\"ansi-green-fg\"> " + fg + " </span>";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a attr;foreground to html', function () {
        var attr = 0;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + "m " + fg + "  \x1B[0m";

        var expected = "<span class=\"ansi-green-fg\"> " + fg + "  </span>";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a bold attr;foreground to html', function () {
        var attr = 1;
        var fg = 32;
        var start = "\x1B[" + attr + ";" + fg + "m " + attr + ";" + fg + " \x1B[0m";

        var expected = '<span style="font-weight:bold"' + " class=\"ansi-green-fg\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a bold attr;bright-foreground to html', function () {
        var attr = 1;
        var fg = 92;
        var start = "\x1B[" + attr + ";" + fg + "m " + attr + ";" + fg + " \x1B[0m";

        var expected = '<span style="font-weight:bold"' + " class=\"ansi-bright-green-fg\"> " + attr + ";" + fg + " </span>";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a bold attr;background;foreground to html', function () {
        var attr = 1;
        var fg = 33;
        var bg = 42;
        var start = "\x1B[" + attr + ";" + bg + ";" + fg + "m " + attr + ";" + bg + ";" + fg + " \x1B[0m";

        var expected = '<span style="font-weight:bold"' + " class=\"ansi-yellow-fg ansi-green-bg\"> " + attr + ";" + bg + ";" + fg + " </span>";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a bold attr;background;bright-foreground to html', function () {
        var attr = 1;
        var fg = 33;
        var bg = 102;
        var start = "\x1B[" + attr + ";" + bg + ";" + fg + "m " + attr + ";" + bg + ";" + fg + " \x1B[0m";

        var expected = '<span style="font-weight:bold"' + " class=\"ansi-yellow-fg ansi-bright-green-bg\"> " + attr + ";" + bg + ";" + fg + " </span>";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform an italic attr;background;bright-foreground to html', function () {
        var attr = 3;
        var fg = 33;
        var bg = 102;
        var start = "\x1B[" + attr + ";" + bg + ";" + fg + "m " + attr + ";" + bg + ";" + fg + " \x1B[0m";

        var expected = '<span style="font-style:italic"' + " class=\"ansi-yellow-fg ansi-bright-green-bg\"> " + attr + ";" + bg + ";" + fg + " </span>";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform an underline attr;background;bright-foreground to html', function () {
        var attr = 4;
        var fg = 33;
        var bg = 102;
        var start = "\x1B[" + attr + ";" + bg + ";" + fg + "m " + attr + ";" + bg + ";" + fg + " \x1B[0m";

        var expected = '<span style="text-decoration:underline"' + " class=\"ansi-yellow-fg ansi-bright-green-bg\"> " + attr + ";" + bg + ";" + fg + " </span>";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      it('should transform a complex multi-line sequence to html', function () {
        var attr = 1;
        var fg = 32;
        var bg = 42;
        var start = "\n \x1B[" + fg + "m " + fg + "  \x1B[0m \n  \x1B[" + bg + "m " + bg + "  \x1B[0m \n zimpper ";

        var expected = "\n <span class=\"ansi-green-fg\"> " + fg + "  </span> \n  <span class=\"ansi-green-bg\"> " + bg + "  </span> \n zimpper ";

        var au = new AnsiUp();
        au.use_classes = true;
        var l = au.ansi_to_html(start);
        l.should.eql(expected);
      });

      describe('transform extended colors (palette)', function () {
        it('system color, foreground', function () {
          var start = "\x1B[38;5;1m" + "red" + "\x1B[0m";
          var expected = '<span class="ansi-red-fg">red</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('system color, foreground (bright)', function () {
          var start = "\x1B[38;5;9m" + "red" + "\x1B[0m";
          var expected = '<span class="ansi-bright-red-fg">red</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('system color, background', function () {
          var start = "\x1B[48;5;1m" + "red" + "\x1B[0m";
          var expected = '<span class="ansi-red-bg">red</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('system color, background (bright)', function () {
          var start = "\x1B[48;5;9m" + "red" + "\x1B[0m";
          var expected = '<span class="ansi-bright-red-bg">red</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('palette, foreground', function () {
          var start = "\x1B[38;5;171m" + "foo" + "\x1B[0m";
          var expected = '<span style="color:rgb(215,95,255)">foo</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('palette, background', function () {
          var start = "\x1B[48;5;171m" + "foo" + "\x1B[0m";
          var expected = '<span style="background-color:rgb(215,95,255)">foo</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('combination of bold and palette', function () {
          var start = "\x1B[1;38;5;171m" + "foo" + "\x1B[0m";
          var expected = '<span style="font-weight:bold;color:rgb(215,95,255)">foo</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });

        it('combination of palette and bold', function () {
          var start = "\x1B[38;5;171;1m" + "foo" + "\x1B[0m";
          var expected = '<span style="font-weight:bold;color:rgb(215,95,255)">foo</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });
      });

      describe('transform extended colors (true color)', function () {
        it('foreground', function () {
          var start = "\x1B[38;2;42;142;242m" + "foo" + "\x1B[0m";
          var expected = '<span style="color:rgb(42,142,242)">foo</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });
        it('background', function () {
          var start = "\x1B[48;2;42;142;242m" + "foo" + "\x1B[0m";
          var expected = '<span style="background-color:rgb(42,142,242)">foo</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });
        it('both foreground and background', function () {
          var start = "\x1B[38;2;42;142;242;48;2;1;2;3m" + "foo" + "\x1B[0m";
          var expected = '<span style="color:rgb(42,142,242);background-color:rgb(1,2,3)">foo</span>';
          var au = new AnsiUp();
          au.use_classes = true;
          var l = au.ansi_to_html(start);
          l.should.eql(expected);
        });
      });
    });

    describe('ignore unsupported CSI', function () {
      it('should correctly convert a string similar to CSI', function () {
        // https://github.com/drudru/ansi_up/pull/15
        // "[1;31m" is a plain text. not an escape sequence.
        var start = "foo\x1B[1@bar[1;31mbaz\x1B[0m";
        var au = new AnsiUp();
        var l = au.ansi_to_html(start);

        // is all plain texts exist?
        l.should.containEql('foo');
        l.should.containEql('bar');
        l.should.containEql('baz');
        l.should.containEql('1;31m');
      });
      it('(cursor-up)', function () {
        var start = "foo\x1B[1Abar";
        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql('foobar');
      });
      it('(scroll-left)', function () {
        // <ESC>[1 @ (including ascii space)
        var start = "foo\x1B[1 @bar";
        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql('foobar');
      });
      it('(DECMC)', function () {
        var start = "foo\x1B[?11ibar";
        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql('foobar');
      });
      /* I cannot find this in the XTERM specs
      it('(RLIMGCP)', function () {
        var start = "foo\x1B[<!3ibar";
        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql('foobar');
      });
      */
      it('(DECSCL)', function () {
        var start = "foo\x1B[61;0\"pbar"
        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql('foobar');
      });
    });

    describe('ignore controls beginning with ESC', function () {

      it('Designate G0 Character Set (UK)', function () {
        var start = "foo\x1B(Abar";
        var au = new AnsiUp();
        var l = au.ansi_to_html(start);
        l.should.eql('foobar');
      });

    });


    describe('buffering situations', function () {

      it('should transform an incomplete prefix', function () {
        var attr = 0;
        var fg = 32;
        var start1 = "\x1B[" + attr + ";";
        var start2 = fg + "m " + fg + "  \x1B[0m";

        var expected = "<span style=\"color:rgb(0,187,0)\"> " + fg + "  </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start1);
        l.should.eql("");
        l = au.ansi_to_html(start2);
        l.should.eql(expected);
      });

      it('should transform a lonely escape', function () {
        var attr = 0;
        var fg = 32;
        var start1 = "xyz \x1B";
        var start2 = "[" + attr + ";" + fg + "m " + fg + "  \x1B[0m";

        var expected = "<span style=\"color:rgb(0,187,0)\"> " + fg + "  </span>";

        var au = new AnsiUp();
        var l = au.ansi_to_html(start1);
        l.should.eql("xyz ");
        l = au.ansi_to_html(start2);
        l.should.eql(expected);
      });

    });

  });

  /*
  describe('ansi to text', function () {
    it('should remove color sequence', function () {
      var start = "foo \x1B[1;32mbar\x1B[0m baz";
      var au = new AnsiUp();
      var l = au.ansi_to_text(start);
      l.should.eql("foo bar baz");
    });
    it('should remove unsupported sequence', function () {
      var start = "foo \x1B[1Abar";
      var au = new AnsiUp();
      var l = au.ansi_to_text(start);
      l.should.eql('foo bar');
    });
    it('should keep multiline', function () {
      var start = "foo \x1B[1;32mbar\nbaz\x1B[0m qux";
      var au = new AnsiUp();
      var l = au.ansi_to_text(start);
      l.should.eql("foo bar\nbaz qux");
    });
  });
  */
});