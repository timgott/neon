#!/usr/bin/env bash

mdfile=Neon\ Integrals.md
jsfiles=shader.js

outpath=build
outfile=$(outpath)/neon.html

outjs=$(addprefix $(outpath)/,$(jsfiles))


.PHONY: all clean

all: $(outjs) $(outfile)

clean:
	rm $(outpath) -r


$(outpath):
	mkdir $(outpath)

$(outjs): $(jsfiles) $(outpath)
	cp $(jsfiles) $(outpath)

$(outfile): $(mdfile) $(outpath)
	pandoc $(mdfile) --standalone --mathml -o $(outfile)
