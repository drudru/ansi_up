
SOURCE   = *.ts
TESTS    = test/*.js
REPORTER = dot

typescript:
		./node_modules/.bin/tsc -p .

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

clean:
		rm -rf ./node_modules ansi_up.js

.PHONY:	test
