.PHONY: all

all: code spec

code: db.coffee
	coffee -o build -c db.coffee

spec: tests/spec/main.coffee
	coffee -o tests/spec -c tests/spec/main.coffee
