# tree-sitter-d
D Grammar for Tree Sitter

This is a new start at a D grammar for Tree Sitter.

It is still not generally useful for consumption, but represents a starting point.
I'm working on extending this to support the grammar documented on dlang.org.

The scanner is very nearly complete, and is written in C.  This allows for us to
properly handle nesting comments, and I have elected to implement a "complete" scanner,
so that every D token is lexed by this scanner.  That might have been a mistake, but it
ensures a few things -- for example keywords cannot be used for identifiers *anywhere*.

D is an incredibly complex (some might say too much so) language, and I'm still learning
it.  So it's likely that there are bugs here in the grammar, and this also explains at
some level the non-trivial amount of time this has taken (is taking) me.

My hope is to actually complete this work soon, because a number of popular tools
will become either functional, or more functional, when a proper grammar is provided for.

I do welcome feedback, with the caveat that I'm new to Tree Sitter, and to D, and I'm
not really a JavaScript or Scheme programmer (I've barely touched them before this).
Please bear that in mind as you throw sticks, stones, and Molotov cocktails in my
general direction.
