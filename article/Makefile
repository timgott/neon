mdfile=Neon\ Integrals.md
tsfiles=shader.ts

outpath=build
outhtml=$(outpath)/index.html

.PHONY: all clean typescript watch

all: compile $(outhtml)

clean:
	rm $(outpath) -r

watch:
	live-server build & ls $(mdfile) $(tsfiles) | entr make all

$(outpath):
	mkdir $(outpath)

compile: $(tsfiles) $(outpath)
	tsc --outDir $(outpath)

$(outhtml): $(mdfile) $(outpath)
	pandoc $(mdfile) --standalone --mathml -o $(outhtml)
