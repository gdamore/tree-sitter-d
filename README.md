# tree-sitter-d

D Grammar for Tree Sitter

[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/badges/StandWithUkraine.svg)](https://stand-with-ukraine.pp.ua)
[![Build/test](https://github.com/gdamore/tree-sitter-d/actions/workflows/ci.yml/badge.svg)](https://github.com/gdamore/tree-sitter-d/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/github/license/gdamore/tree-sitter-d.svg?logoColor=silver&logo=opensourceinitiative&color=blue&label=)](https://github.com/gdamore/tree-sitter-d/blob/master/LICENSE.txt)
[![D Language](https://img.shields.io/static/v1?message=Lang&label=&logo=d&logoColor=silver&&color=B03931)](https://dlang.org/)

## What is this?

This is a [D](https://dlang.org/) grammar for [Tree Sitter](https://tree-sitter.github.io/tree-sitter/).

There are a couple of deviations from what the compiler grammar supports.

* No support for a lone trailing decimal point in floating point literals (e.g. `5.`.)
  Supporting this became problematic when combined with support for interpolated
  strings in the parser.

* There is a bug declaring certain double quoted strings.  For example, `"__EOF__"`
  is problematic right now.  If this is problematic, insert an escape character
  in front of the string or encode the leading character in hexadecimal. (This bug
  should be fixed soon however.)

* No support for imaginary floating point numbers.  This is deprecated in the current
  specification for D, anyway.

* A few constructs that appear to be legal in the D grammar, but are semantically
  illegal, are not processed by this grammar.  For example, `@safe ;` is technically
  valid *syntax* if you follow the D specification, but will be rejected by the
  compiler. Another example, use of a comma statement in a `return` statement is
  is not permitted.

* Due to ambiguities in the D specification, its possible that the grammar interpretation
  here may be other than what one might expect.  For example, in `@property auto myfunc() {};`
  is `@property` a part of the `DeclDef` or does it become part of the `FunctionDeclaration`.
  In general, we have tried to provide for the most sensible and useful interpretation, but
  opinions may vary.

* Grammar or errors that are in code not caught by DMD, because it is in
  code that is not compiled (such as templates that are not instantiated).
  This grammar doesn't know about instantiation or constructs that are
  tucked behind conditional compilation, and verifies the entire body
  of the source document. I consider this a feature, not a bug.

* Deprecated use of the former `body` keyword (it is no longer a keyword.)
  If your source file has this problem, change `body` to `do`.
  You could also just delete the word, as it is entirely optional in the
  syntax where it appears.

* A pathological case with `#line` directives with a multi-line comment
  on in the middle of the directive. Nothing real emits such a busted syntax,
  and fixing it would require significant changes to the lexer, for absolutely
  zero real world benefit.  (This was fixed in newer versions of D.)

* Inline assembler is essentially treated as a token stream with no
  real validation. As this is compiler and CPU specific, it doesn't make
  a lot of sense to try to add that here.  (Use of DMD's inline assembler
  is not widely used, even within the D community, as it's limited to x86.)

* Use of `enum` as return type is now removed, following D 2.105.
  Please use `auto` if that creates an error in old code.  (Not actually
  a deviation, for users of newer editions of D.)

## Acknowledgements

While the resources available online - both the grammar that is part of the DGrammar
project and what is specified on the website - have numerous problems, they still afforded
an excellent starting point for this work. Without those resources, this would have
been impossible, or at least a very much more difficult project.

Additionally the D community on Discord has been helpful in understanding the grammar
and were patient with a number of my queries about potential language constructions,
many of which were utterly non-sensical.

## Challenges and Acknowledgements

D is an incredibly complex (some might say too much so) language, and it lacks an
accurate formal grammar, and the machine readable grammars that exist (DGrammar)
are buggy or out of date. Additionally, the specification is also not up to date,
and has conflicts and inaccuracies that do not not reflect the actual language.

Making this work, with a grammar that is loosely specified as a recursive descent
grammar with Tree Sitters GLR(1) style is no mean feat. There are many conflicts,
and ambiguities abound in the actual grammar itself.

As a result this was generated mostly by hand, reading the grammar specification,
and experimenting heavily.

In doing this work, it was easy to identify a number of language constructs that
some might argue that the language could easily do without, without losing any
of it's real capability.

Additionally this work has some ugly hacks that I wish it did not -- much of which
is almost surely a result of my insufficient understanding of Tree Sitter or D
or both. I welcome contributions or suggestions by those more knowledgable to
improve this.

## Future Directions

- It would be nice to get this project moved either into either the D or the Tree-Sitter
  communities. That would likely facilitate serendipitous discovery by the folks most
  likely to benefit from it.

- Additional queries. Local queries, etc. Again, contributions are welcome!

- Improvements to the indentation or highlighting queries.

- DDOC support. Arguably DDOC is a language unto itself.

- Extended test coverage. A lot of test cases are here, but we could really do
  with a much richer corpus. This is fairly tedious, but using the `-u` flag
  with `tree-sitter test` can be useful.

- Also highlight test coverage!

## Performance

Trial runs of Tree Sitter using this grammar
to parse the enter corpus of files in the DMD compiler (excluding the negative tests),
ran in just 1.94 seconds (1.86 user, 0.07 system).

This involved parsing 3094 files, containing 834,637 lines of source code.

This is an average of 627 us per file, or 2.3 us per line of code.

Put another way, this parses at a rate of about 430K lines of code per second.

This test was performed on a 2020 MacBook Air with an M1 processor and 16GB RAM.
