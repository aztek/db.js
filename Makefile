.PHONY: all

all: db.coffee
	coffee -o build -c db.coffee
