
SOURCE = lib/*.js
TESTS = test/*.js
REPORTER = dot

test:
		@NODE_ENV=test ./node_modules/.bin/mocha \
				--require should \
				--reporter $(REPORTER) \
				$(TESTS)

test_verbose:
		@NODE_ENV=test ./node_modules/.bin/mocha \
				--require should \
				--reporter spec \
				$(TESTS)

lint:
		./node_modules/.bin/jslint \
				--white --vars --plusplus --continue ansi2html.js
		./node_modules/.bin/jslint \
				--white --vars --plusplus --continue test/ansi2html-test.js

hint:
		node_modules/.bin/jshint ansi2html.js

.PHONY:	test lint hint
