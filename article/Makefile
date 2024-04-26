mdfile=Neon\ Integrals.md
tsfiles=shader.ts

outpath=build
outhtml=$(outpath)/index.html

.PHONY: all clean typescript

all: compile $(outhtml)

clean:
	rm $(outpath) -r


$(outpath):
	mkdir $(outpath)

compile: $(tsfiles) $(outpath)
	tsc --outDir $(outpath)

$(outhtml): $(mdfile) $(outpath)
	pandoc $(mdfile) --standalone --mathml -o $(outhtml)
