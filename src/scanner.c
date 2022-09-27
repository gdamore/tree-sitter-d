/*
 * Scanner (lexer) for D code for use by Tree-Sitter.
 *
 * Copyright 2022 Garrett D'Amore
 *
 * Distributed under the Boost Software License, Version 1.0.
 * (See accompanying file LICENSE or https://www.boost.org/LICENSE_1_0.txt)
 * SPDX-License-Identifier: BSL-1.0
 */
#include "tree_sitter/parser.h"
#include <assert.h>
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// NB: It is very important that two things are true.
// First, this must match the externals in the grammar.js.
// Second, symbols and keywords must appear with least
// specific matches in front of more specific matches.
enum TokenType {
	END_FILE,
	COMMENT,
	IDENTIFIER,
	BOM,       // \uFEFF
	DIRECTIVE, // # <to end of line>
	SHEBANG,   // #!
	L_INT,
	L_FLOAT,
	L_CHAR,       // 'c', or '\x12', or similar
	L_DQSTRING,   // "string" may include escapes
	L_BQSTRING,   // `string` (no escapes permitted)
	L_RQSTRING,   // r"string" (no escapes permitted)
	S_LBRACE,     // {
	S_RBRACE,     // }
	S_DIV,        // /
	S_DIV_EQ,     // /=
	S_AND,        // &
	S_AND_EQ,     // &=
	S_AND_AND,    // &&
	S_OR,         // |
	S_OR_EQ,      // |=
	S_OR_OR,      // ||
	S_MINUS,      // -
	S_MINUS_EQ,   // -=
	S_DEC,        // --
	S_PLUS,       // +
	S_PLUS_EQ,    // +=
	S_INC,        // ++
	S_LT,         // <
	S_LTE,        // <=
	S_LSHIFT,     // <<
	S_LSHIFT_EQ,  // <<=
	S_GT,         // >
	S_GTE,        // >=
	S_RSHIFT_EQ,  // >>=
	S_URSHIFT_EQ, // >>>=
	S_RSHIFT,     // >>
	S_URSHIFT,    // >>>
	S_NOT,        // !
	S_NOT_EQ,     // !=
	S_LPAREN,     // (
	S_RPAREN,     // )
	S_LBRACKET,   // []
	S_RBRACKET,   // ]
	S_QUEST,      // ?
	S_COMMA,      // ,
	S_SEMI,       // ;
	S_COLON,      // :
	S_DOLLAR,     // $
	S_EQ,         // =
	S_EQ_EQ,      // ==
	S_LAMBDA,     // =>
	S_MUL,        // *
	S_MUL_EQ,     // *=
	S_MOD,        // %
	S_MOD_EQ,     // %=
	S_XOR,        // ^
	S_XOR_EQ,     // ^=
	S_POW,        // ^^
	S_POW_EQ,     // ^^=
	S_TILDE,      // ~
	S_APPEND,     // ~=
	S_AT,         // @
	S_DOT,        // .
	S_RANGE,      // ..
	S_ELLIPSES,   // ...
	K_ABSTRACT,
	K_ALIAS,
	K_ALIGN,
	K_ASM,
	K_ASSERT,
	K_AUTO,
	K_BODY, // obsolete
	K_BOOL,
	K_BREAK,
	K_BYTE,
	K_CASE,
	K_CAST,
	K_CATCH,
	K_CDOUBLE, // obsolete
	K_CENT,    // obsolete
	K_CFLOAT,  // obsolete
	K_CHAR,
	K_CLASS,
	K_CONST,
	K_CONTINUE,
	K_CREAL, // obsolete
	K_DCHAR,
	K_DEBUG,
	K_DEFAULT,
	K_DELEGATE,
	K_DELETE, // obsolete
	K_DEPRECATED,
	K_DO,
	K_DOUBLE,
	K_ELSE,
	K_ENUM,
	K_EXPORT,
	K_EXTERN,
	K_FALSE,
	K_FINAL,
	K_FINALLY,
	K_FLOAT,
	K_FOR,
	K_FOREACH,
	K_FOREACH_REVERSE,
	K_FUNCTION,
	K_GOTO,
	K_IDOUBLE, // obsolete
	K_IF,
	K_IFLOAT, // obsolete
	K_IMMUTABLE,
	K_IMPORT,
	K_IN,
	K_INOUT,
	K_INT,
	K_INTERFACE,
	K_INVARIANT,
	K_IREAL,
	K_IS,
	K_LAZY,
	K_LONG,
	K_MACRO,
	K_MIXIN,
	K_MODULE,
	K_NEW,
	K_NOTHROW,
	K_NULL,
	K_OUT,
	K_OVERRIDE,
	K_PACKAGE,
	K_PRAGMA,
	K_PRIVATE,
	K_PROTECTED,
	K_PUBLIC,
	K_PURE,
	K_REAL,
	K_REF,
	K_RETURN,
	K_SCOPE,
	K_SHARED,
	K_SHORT,
	K_STATIC,
	K_STRUCT,
	K_SUPER,
	K_SWITCH,
	K_SYNCHRONIZED,
	K_TEMPLATE,
	K_THIS,
	K_THROW,
	K_TRUE,
	K_TRY,
	K_TYPEID,
	K_TYPEOF,
	K_UBYTE,
	K_UCENT,
	K_UINT,
	K_ULONG,
	K_UNION,
	K_UNITTEST,
	K_USHORT,
	K_VERSION,
	K_VOID,
	K_WCHAR,
	K_WHILE,
	K_WITH,
	K__FILE,
	K__FILE_FULL_PATH,
	K__MODULE,
	K__LINE,
	K__FUNCTION,
	K__PRETTY_FUNCTION,
	K__GSHARED,
	K__TRAITS,
	K__VECTOR,
	K__PARAMETERS,
	K__DATE,      // string literal date
	K__EOF,       // end of file - ends scanning
	K__TIME,      // string literal time
	K__TIMESTAMP, // string literal timestamp
	K__VENDOR,    // string literal vendor
	K__VERSION,   // integer literal version
	N_TOKENS,     // must be last, not a real token
};

static const char *const keywords[N_TOKENS] = {
	[K_ABSTRACT]         = "abstract",
	[K_ALIAS]            = "alias",
	[K_ALIGN]            = "align",
	[K_ASM]              = "asm",
	[K_ASSERT]           = "assert",
	[K_AUTO]             = "auto",
	[K_BODY]             = "body",
	[K_BOOL]             = "bool",
	[K_BREAK]            = "break",
	[K_BYTE]             = "byte",
	[K_CASE]             = "case",
	[K_CAST]             = "cast",
	[K_CATCH]            = "catch",
	[K_CDOUBLE]          = "cdouble",
	[K_CENT]             = "cent",
	[K_CFLOAT]           = "cfloat",
	[K_CHAR]             = "char",
	[K_CLASS]            = "class",
	[K_CONST]            = "const",
	[K_CONTINUE]         = "continue",
	[K_CREAL]            = "creal",
	[K_DCHAR]            = "dchar",
	[K_DEBUG]            = "debug",
	[K_DEFAULT]          = "default",
	[K_DELEGATE]         = "delegate",
	[K_DELETE]           = "delete",
	[K_DEPRECATED]       = "deprecated",
	[K_DO]               = "do",
	[K_DOUBLE]           = "double",
	[K_ELSE]             = "else",
	[K_ENUM]             = "enum",
	[K_EXPORT]           = "export",
	[K_EXTERN]           = "extern",
	[K_FALSE]            = "false",
	[K_FINAL]            = "final",
	[K_FINALLY]          = "finally",
	[K_FLOAT]            = "float",
	[K_FOR]              = "for",
	[K_FOREACH]          = "foreach",
	[K_FOREACH_REVERSE]  = "foreach_reverse",
	[K_FUNCTION]         = "function",
	[K_GOTO]             = "goto",
	[K_IDOUBLE]          = "idouble",
	[K_IF]               = "if",
	[K_IFLOAT]           = "ifloat",
	[K_IMMUTABLE]        = "immutable",
	[K_IMPORT]           = "import",
	[K_IN]               = "in",
	[K_INOUT]            = "inout",
	[K_INT]              = "int",
	[K_INTERFACE]        = "interface",
	[K_INVARIANT]        = "invariant",
	[K_IREAL]            = "ireal",
	[K_IS]               = "is",
	[K_LAZY]             = "lazy",
	[K_LONG]             = "long",
	[K_MACRO]            = "macro",
	[K_MIXIN]            = "mixin",
	[K_MODULE]           = "module",
	[K_NEW]              = "new",
	[K_NOTHROW]          = "nothrow",
	[K_NULL]             = "null",
	[K_OUT]              = "out",
	[K_OVERRIDE]         = "override",
	[K_PACKAGE]          = "package",
	[K_PRAGMA]           = "pragma",
	[K_PRIVATE]          = "private",
	[K_PROTECTED]        = "protected",
	[K_PUBLIC]           = "public",
	[K_PURE]             = "pure",
	[K_REAL]             = "real",
	[K_REF]              = "ref",
	[K_RETURN]           = "return",
	[K_SCOPE]            = "scope",
	[K_SHARED]           = "shared",
	[K_SHORT]            = "short",
	[K_STATIC]           = "static",
	[K_STRUCT]           = "struct",
	[K_SUPER]            = "super",
	[K_SWITCH]           = "switch",
	[K_SYNCHRONIZED]     = "synchronized",
	[K_TEMPLATE]         = "template",
	[K_THIS]             = "this",
	[K_THROW]            = "throw",
	[K_TRUE]             = "true",
	[K_TRY]              = "try",
	[K_TYPEID]           = "typeid",
	[K_TYPEOF]           = "typeof",
	[K_UBYTE]            = "ubyte",
	[K_UCENT]            = "ucent",
	[K_UINT]             = "uint",
	[K_ULONG]            = "ulong",
	[K_UNION]            = "union",
	[K_UNITTEST]         = "unittest",
	[K_USHORT]           = "ushort",
	[K_VERSION]          = "version",
	[K_VOID]             = "void",
	[K_WCHAR]            = "wchar",
	[K_WHILE]            = "while",
	[K_WITH]             = "with",
	[K__FILE]            = "__FILE__",
	[K__FILE_FULL_PATH]  = "__FILE_FULL_PATH__",
	[K__MODULE]          = "__MODULE__",
	[K__LINE]            = "__LINE__",
	[K__FUNCTION]        = "__FUNCTION__",
	[K__PRETTY_FUNCTION] = "__PRETTY_FUNCTION__",
	[K__GSHARED]         = "__GSHARED__",
	[K__TRAITS]          = "__TRAITS__",
	[K__VECTOR]          = "__VECTOR__",
	[K__PARAMETERS]      = "__PARAMETERS__",
	[K__DATE]            = "__DATE__",
	[K__EOF]             = "__EOF__",
	[K__TIME]            = "__TIME__",
	[K__TIMESTAMP]       = "__TIMESTAMP__",
	[K__VENDOR]          = "__VENDOR__",
	[K__VERSION]         = "__VERSION__",
};

static const char *const symbols[N_TOKENS] = {
	[S_LBRACE]     = "{",
	[S_RBRACE]     = "}",
	[S_DIV]        = "/",
	[S_DIV_EQ]     = "/=",
	[S_AND]        = "&",
	[S_AND_EQ]     = "&=",
	[S_AND_AND]    = "&&",
	[S_OR]         = "|",
	[S_OR_EQ]      = "|=",
	[S_OR_OR]      = "||",
	[S_MINUS]      = "--",
	[S_MINUS_EQ]   = "-=",
	[S_DEC]        = "--",
	[S_PLUS]       = "+",
	[S_PLUS_EQ]    = "+=",
	[S_INC]        = "++",
	[S_LT]         = "<",
	[S_LTE]        = "<=",
	[S_LSHIFT]     = "<<",
	[S_LSHIFT_EQ]  = "<<=",
	[S_GT]         = ">",
	[S_GTE]        = ">=",
	[S_RSHIFT_EQ]  = ">>=",
	[S_URSHIFT_EQ] = ">>>=",
	[S_RSHIFT]     = ">>",
	[S_URSHIFT]    = ">>>",
	[S_NOT]        = "!",
	[S_NOT_EQ]     = "!=",
	[S_LPAREN]     = "(",
	[S_RPAREN]     = ")",
	[S_LBRACKET]   = "[",
	[S_RBRACKET]   = "]",
	[S_QUEST]      = "?",
	[S_COMMA]      = ",",
	[S_SEMI]       = ";",
	[S_COLON]      = ":",
	[S_DOLLAR]     = "$",
	[S_EQ]         = "=",
	[S_EQ_EQ]      = "==",
	[S_LAMBDA]     = "=>",
	[S_MUL]        = "*",
	[S_MUL_EQ]     = "*=",
	[S_MOD]        = "%",
	[S_MOD_EQ]     = "%=",
	[S_XOR]        = "^",
	[S_XOR_EQ]     = "^=",
	[S_POW]        = "^^",
	[S_POW_EQ]     = "^^=",
	[S_TILDE]      = "~",
	[S_APPEND]     = "~=",
	[S_AT]         = "@",
};

// Starting indicates the first index in the symbols array
// that starts with the given character.  We also do this
// for keywords for the same reason.
static int starting[256] = {
	['{'] = S_LBRACE,
	['}'] = S_RBRACE,
	['/'] = S_DIV,
	['&'] = S_AND,
	['|'] = S_OR,
	['-'] = S_MINUS,
	['+'] = S_PLUS,
	['<'] = S_LT,
	['>'] = S_GT,
	['!'] = S_NOT,
	['('] = S_LPAREN,
	[')'] = S_RPAREN,
	['['] = S_LBRACKET,
	[']'] = S_RBRACKET,
	['?'] = S_QUEST,
	[','] = S_COMMA,
	[';'] = S_SEMI,
	[':'] = S_COLON,
	['$'] = S_DOLLAR,
	['='] = S_EQ,
	['*'] = S_MUL,
	['%'] = S_MOD,
	['^'] = S_XOR,
	['~'] = S_TILDE,
	['@'] = S_AT,
	['a'] = K_ABSTRACT,
	['b'] = K_BODY,
	['c'] = K_CASE,
	['d'] = K_DCHAR,
	['e'] = K_ELSE,
	['f'] = K_FALSE,
	['g'] = K_GOTO,
	['i'] = K_IDOUBLE,
	['l'] = K_LAZY,
	['m'] = K_MACRO,
	['n'] = K_NEW,
	['o'] = K_OUT,
	['p'] = K_PACKAGE,
	['r'] = K_REAL,
	['s'] = K_SCOPE,
	['t'] = K_TEMPLATE,
	['u'] = K_UBYTE,
	['v'] = K_VERSION,
	['w'] = K_WCHAR,
	['_'] = K__FILE,
};

static bool
is_eol(int c)
{
	return ((c == '\n') || (c == '\r') || (c == 0x2028) || (c == 0x2029));
}

// This just looks for a valid escape sequence.
// If it passes, it advances just past the escape and returns true.
// Do not use this unless you are certainly in escape context.
// The current lookahead should be \.  If this returns true
// the the lexer will be pointing at the next character after
// the escape sequence.
static bool
match_escape(TSLexer *lexer)
{
	assert(lexer->lookahead == '\\');

	// now we parsing an escape
	lexer->advance(lexer, false);
	switch (lexer->lookahead) {
	case '\'':
	case '"':
	case '?':
	case '\\':
	case 'a':
	case 'b':
	case 'f':
	case 'n':
	case 'r':
	case 't':
	case 'v':
		lexer->advance(lexer, false);
		return (true);
	case 'x':
		for (int i = 0; i < 2; i++) { // expect two hex digits
			lexer->advance(lexer, false);
			if (!isascii(lexer->lookahead) ||
			    !isxdigit(lexer->lookahead)) {
				return (false);
			}
		}
		lexer->advance(lexer, false);
		return (true);

	case 'u':
		for (int i = 0; i < 4; i++) {
			lexer->advance(lexer, false);
			if (!isascii(lexer->lookahead) ||
			    !isxdigit(lexer->lookahead)) {
				return (false);
			}
		}
		lexer->advance(lexer, false);
		return (true);

	case 'U':
		for (int i = 0; i < 8; i++) {
			lexer->advance(lexer, false);
			if (!isascii(lexer->lookahead) ||
			    !isxdigit(lexer->lookahead)) {
				return (false);
			}
		}
		lexer->advance(lexer, false);
		return (true);

	case '0': // octal
	case '1':
	case '2':
	case '3':
	case '4':
	case '5':
	case '6':
	case '7':
		for (int i = 0; i < 3; i++) {
			lexer->advance(lexer, false);
			if (lexer->lookahead < '0' || lexer->lookahead > '7')
				break;
		}
		return (true);

	case '&': // HTML entity - we don't validate the names
		for (int i = 0; i < 64; i++) { // no names longer than this
			lexer->advance(lexer, false);
			if (lexer->lookahead == ';') {
				if (i < 2) {
					// need at least 2 characters in an
					// entity name
					return (false);
				}
				break;
			}
			if (!isascii(lexer->lookahead) ||
			    !isalnum(lexer->lookahead)) {
				return (false);
			}
		}
		lexer->advance(lexer, true);
		return (true);

	case '`':
	default:
		return (false);
	}
}

static bool
match_char_literal(TSLexer *lexer)
{
	assert(lexer->lookahead == '\'');
	lexer->advance(lexer, false);
	if (lexer->lookahead == '\'') {
		// syntax error
		return (false);
	}
	if (lexer->lookahead != '\\') {
		// simple unescaped character
		lexer->advance(lexer, false);
		if (lexer->lookahead != '\'') {
			return (false); // closing single quote missing
		}
		lexer->advance(lexer, false); // to get the closer
		lexer->mark_end(lexer);
		lexer->result_symbol = L_CHAR;
		return (true);
	}

	if ((!match_escape(lexer)) || (lexer->lookahead != '\'')) {
		return (false);
	}
	lexer->advance(lexer, false);
	lexer->mark_end(lexer);
	lexer->result_symbol = L_CHAR;
	return (true); // missing closing quote
}

// this looks for the optional suffix closer on various
// string literals (c, d, or w).  The assumption is that
// the caller will have already marked the end, and we
// can safely look ahead a little bit more.  It always
// succeeds because there is no case where we can fail --
// we simply either extend the match for the string, or we don't.
static void
match_string_suffix(TSLexer *lexer)
{
	int c = lexer->lookahead;
	if ((c == 'c') || (c == 'd') || (c == 'w')) {
		// special string form
		// advance so we include the suffix
		lexer->advance(lexer, false);
	}
	// and mark the end (regardless whether we did or did not)
	lexer->mark_end(lexer);
}

static bool
match_dq_string(TSLexer *lexer)
{
	int c = lexer->lookahead;
	assert(c == '"');

	lexer->advance(lexer, false);

	while ((c = lexer->lookahead) != 0) {

		if (c == '\\') {
			if (!match_escape(lexer)) {
				return (false);
			}
			continue;
		}

		if (c == '"') {
			// end of string!
			lexer->result_symbol = L_DQSTRING;
			lexer->advance(lexer, false);
			match_string_suffix(lexer);
			return (true);
		}
		lexer->advance(lexer, false);
	}
	// unterminated
	return (false);
}

static bool
match_raw_string(TSLexer *lexer, int quote, int token)
{
	int c = lexer->lookahead;
	assert(c == quote);
	lexer->advance(lexer, false); // skip over starting quote
	while ((c = lexer->lookahead) != 0) {
		if (c == quote) {
			lexer->advance(lexer, false);
			lexer->result_symbol = token;
			match_string_suffix(lexer);
			return (true);
		}
		lexer->advance(lexer, false);
	}
	// unterminated
	return (false);
}

static bool
match_symbol(TSLexer *lexer, const bool *valid)
{
	// entry condition must be with the lexer containing starting
	// character for a symbol we recognize.

	int  c = lexer->lookahead;
	int  start;
	bool result   = false;
	char token[8] = {};

	// starting character a symbol start?
	if (((start = starting[c]) == 0) || symbols[start] == NULL) {
		return (false);
	}
	for (int i = 0; i < sizeof(token) - 1; i++) {
		token[i]             = c;
		token[i + 1]         = 0;
		bool        possible = false;
		bool        match    = false;
		const char *sym;

		for (int j = start; (sym = symbols[j]) != NULL; j++) {
			if (sym[0] != token[0]) {
				break;
			}
			if (!valid[j]) {
				continue;
			}
			if (strcmp(token, sym) == 0) {
				lexer->result_symbol = j;
				match                = true;
				break;
			}

			// if the token is a prefix for this symbol, then maybe
			// its a candidate
			if (strncmp(token, sym, strlen(token)) == 0) {
				possible = true;
				break;
			}
		}

		if (!possible && !match) {
			// no further need to keep searching
			return (result);
		}

		lexer->advance(lexer, false);
		c = lexer->lookahead;

		if (match) {
			// we saved the matched token in the loop above
			lexer->mark_end(lexer);
			result = true;
		}
	}
	return (result);
}

// match identifier matches identifiers *and* symbols.
// it parses until it finds a character that meets one
// of the following criteria:
// - not an alpha/alphanum/underscore
// - unicode 2029/2028 (treated as end of line) -- token breaking
// - any other unicode (pressumed to extend the token, and treated as
//   necessarily converting the string to an identifier)
static bool
match_identifier(TSLexer *lexer, const bool *valid)
{
	int  c = lexer->lookahead;
	char token[32];

	assert(isalpha(c) || c == '_' || c > 0x7f);
	assert(c != 0x2028 && c != 0x2029); // non-latin treated as letters

	// a couple of very special cases exist:
	// r -- can be followed by double quote("), indicating raw string
	// q -- can be followed by double quote("), indicating delimited string
	//   -- can be followed by open brace ({), indicating token string
	//
	// everything else is either an identifier.  if the identifier
	// parses as a reserved word, but the reserved word is not legal,
	// we return false for now.

	// first lex out the "word", without doing any kind of lookup
	int i;
	do {
		token[i++] = c;
		token[i]   = 0;
		lexer->advance(lexer, false);
		c = lexer->lookahead;
		if (i == 1) {
			// there is no circumstance where r" can be anything
			// other than the start of a raw string (outside of
			// comments of course)
			if (token[0] == 'r' && c == '"') {
				if (valid[L_RQSTRING]) {
					return (match_raw_string(
					    lexer, '"', L_RQSTRING));
				} else {
					return (false);
				}
			}
			if (token[0] == 'q') {
				if (c == '"') {
					// TODO: DELIMITED STRING
				}
				if (c == '{') {
					// TODO: TOKEN STRING -- we need to
					// bounce this up to the parser
				}
				return (false);
			}
		}
		if ((isascii(c) && (!isalnum(c) && c != '_')) || is_eol(c)) {
			break;
		}
		if ((c > 0x7f) || (i >= sizeof(token) - 2)) {
			// treat all other non-ASCII characters as if they were
			// letters. if we ever get smarter unicode, we can fix
			// this, but it's probably more than sufficient for
			// tree-sitter.  These also cannot match any keywords,
			// so they can only be identifiers.  We can do th4e
			// same thing if the symbol length is longer than our
			// longest keyword
			if (!valid[IDENTIFIER]) {
				return (false);
			}
			while (((c > 0x7F) || isalnum(c) || c == '_') &&
			    !lexer->eof(lexer)) {
				lexer->advance(lexer, false);
			}
			lexer->mark_end(lexer);
			lexer->result_symbol = IDENTIFIER;
			return (true);
		}
	} while (c != 0);

	assert(token[0] != 0);

	// is it a reserved word?
	int start = starting[token[0]];
	int found = 0;
	if (start != 0) {
		const char *kw;
		for (int j = start; (kw = keywords[j]) != NULL; j++) {
			int rv;
			if (kw[0] != token[0]) {
				break;
			}
			rv = strcmp(token, keywords[j]);
			if (rv == 0) {
				found = j;
				break;
			} else if (rv < 0) {
				// slight optimization saves searching
				// many user defined symbols are just a single character long
				break;
			}
		}
	}
	// this is where we handle some special token processing
	switch (found) {
	case 0: // not a keyword at all
		if (valid[IDENTIFIER]) {
			lexer->mark_end(lexer);
			lexer->result_symbol = IDENTIFIER;
			return (true);
		}
		break;
	case K__EOF:
		// end of file marker, eat it all - this is valid *everywhere*
		while (lexer->lookahead) {
			lexer->advance(lexer, false);
		}
		lexer->result_symbol = END_FILE;
		return (true);
	default:
		if (valid[found]) {
			lexer->result_symbol = found;
			lexer->mark_end(lexer);
			return (true);
		}
		break;
	}
	return (false);
}

static bool
match_hash_or_shebang(TSLexer *lexer, const bool *valid)
{
	int c = lexer->lookahead;
	assert(c == '#');
	if (valid[SHEBANG] || valid[DIRECTIVE]) {
		lexer->advance(lexer, false);
		c = lexer->lookahead;
		if (valid[SHEBANG] && c == '!') {
			lexer->result_symbol = SHEBANG;
		} else if (valid[DIRECTIVE]) {
			lexer->result_symbol = DIRECTIVE;
		} else {
			return (false);
		}
		while ((!is_eol(c)) && (c)) {
			lexer->advance(lexer, false);
			c = lexer->lookahead;
		}
		// consume the newline
		lexer->advance(lexer, false);
		lexer->mark_end(lexer);
		return (true);
	} else {
		// not sure there are any parse contexts where this is invalid
		// actually!
		assert(0);
		return (false);
	}
}

static bool
match_line_comment(TSLexer *lexer, const bool *valid)
{
	int c = lexer->lookahead;
	assert(c == '/');
	if (!valid[COMMENT]) {
		return (false);
	}
	while ((!is_eol(c)) && (c)) {
		lexer->advance(lexer, false);
		c = lexer->lookahead;
	}
	lexer->mark_end(lexer);
	lexer->result_symbol = COMMENT;
	return (true);
}

static bool
match_block_comment(TSLexer *lexer, const bool *valid)
{
	int c = lexer->lookahead;
	assert(c == '*');

	if (!valid[COMMENT]) {
		return (false);
	}
	int state = 0;
	while (c != 0) {
		lexer->advance(lexer, false);
		c = lexer->lookahead;
		switch (state) {
		case 0:
			if (c == '*') {
				state++;
			}
			break;
		case 1:
			if (c == '/') {
				// closing comment, hurrah!
				lexer->advance(lexer, false);
				lexer->mark_end(lexer);
				lexer->result_symbol = COMMENT;
				return (true);
			}
			state = 0;
			break;
		}
	}

	return (false); // unterminated
}

static bool
match_nest_comment(TSLexer *lexer, const bool *valid)
{
	int c    = lexer->lookahead;
	int nest = 1;
	int prev = 0;
	assert(c == '+');

	if (!valid[COMMENT]) {
		return (false);
	}

	while (!lexer->eof(lexer)) {
		lexer->advance(lexer, false);
		c = lexer->lookahead;
		switch (prev) {
		case '/':
			if (c == '+') {
				nest++;
				c = 0;
			}
			break;
		case '+':
			if (c == '/') {
				nest--;
				if (nest == 0) {
					// outtermost closing comment, hurrah!
					lexer->advance(lexer, false);
					lexer->mark_end(lexer);
					lexer->result_symbol = COMMENT;
					return (true);
				}
				c = 0;
			}
		}
		prev = c;
	}
	return (false);
}

static bool
match_number_suffix(
    TSLexer *lexer, const bool *valid, bool is_float, bool no_suffix)
{
	int  c;
	bool seen_l = false;
	bool seen_i = false;
	bool seen_u = false;
	;
	bool seen_f = false;
	int  tok    = 0;
	bool done   = false;

	while (((c = lexer->lookahead) != 0) && (!no_suffix) && !done) {
		switch (c) {
		case 'u':
		case 'U': // we can treat both u and U identically
			if (seen_u || seen_i || seen_f || is_float) {
				return (false);
			}
			seen_u = true;
			tok    = L_INT;
			break;

		case 'f':
		case 'F':
			if (seen_u || seen_f || seen_i) {
				return (false);
			}
			seen_f = true;
			tok    = L_FLOAT;
			break;

		case 'i':
			// i means its an imaginary floating point, and it
			// *must* be the last thing seen.  (It's also
			// deprecated.)
			if (seen_i || seen_u) {
				return (false);
			}
			tok    = L_FLOAT;
			seen_i = true;
			break;

		case 'L':
			// L can mean long, or it can mean real
			// it conflicts with f, F, and must appear before i.
			if (seen_l || seen_f || seen_i) {
				return (false);
			}
			seen_l = true;
			break;

		default:
			done = true;
			break;
		}
		if (!done) {
			lexer->advance(lexer, false);
		}
	}

	// what follows the suffix must *NOT* be digit or a number.
	if (isalnum(c) || (c > 0x7f && !is_eol(c))) {
		return (false);
	}
	if (is_float) {
		tok = L_FLOAT;
	}
	if (valid[L_INT] && tok != L_FLOAT) {
		lexer->result_symbol = L_INT;
		lexer->mark_end(lexer);
		return (true);
	}
	if (valid[L_FLOAT] && tok != L_INT) {
		lexer->result_symbol = L_FLOAT;
		lexer->mark_end(lexer);
		return (true);
	}
	return (false);
}

static bool
match_number(TSLexer *lexer, const bool *valid)
{
	// starting item can be a digit or .
	// if it is '.', then it can be the start of a number,
	// the "." by itself, or "..", or "...".  We handle
	// the forms here in this one place to make it easy.
	// Note that there are ambiguities in the way DMD handles
	// decimal points.  For example, 0..stringof is illegal,
	// but so is 00.stringof, but 0.stringof is ok and so is 00.
	// Some of this feels like grammar bugs in DMD's implementation
	// and we have not elected to be bug-for-bug compatible.
	int  c = lexer->lookahead;
	int  next;
	int  prev;
	bool is_float  = false;
	bool is_hex    = false;
	bool is_bin    = false;
	bool has_digit = false;
	bool has_dot   = false;
	bool in_exp    = false;
	bool was_dot   = false; // next must be a digit
	bool result    = false;
	bool no_suffix = false;

	if (c == '.') {
		if (!(valid[S_DOT] || valid[S_RANGE] || valid[S_ELLIPSES] ||
		        valid[L_FLOAT])) {
			return (false);
		}
		lexer->advance(lexer, false);
		if (valid[S_DOT]) {
			lexer->result_symbol = S_DOT;
			lexer->mark_end(lexer);
			result = true;
		}
		c = lexer->lookahead;
		if (c == '.') { // either .., or ...
			lexer->advance(lexer, false);
			if (valid[S_RANGE]) {
				lexer->result_symbol = S_RANGE; // ..
				lexer->mark_end(lexer);
				result = true;
			}
			c = lexer->lookahead;
			if (valid[S_ELLIPSES] && c == '.') {
				lexer->mark_end(lexer);
				lexer->result_symbol = S_ELLIPSES;
				result               = true;
			}
			// cannot be a number, we might be a sole dot.
			return (result);
		}

		// at this point, we either have a digit, or
		// something that is not a valid number (and thus the sole dot
		// might apply from above).  Note that underscores are *not*
		// permitted as the first character after the decimal point.
		if (!isdigit(c)) {
			return (result);
		}
		has_dot = true;

	} else if (c == '0') {
		// the next value can be b, B, x, X indicating a base,
		// a dot (making this a floating point number) or a digit or an
		// underscore. if it is anything else, then we have just the
		// value 0 (but it might have a suffix -- for example 0f)
		lexer->advance(lexer, false);
		c = lexer->lookahead;
		switch (c) {
		case 'b':
		case 'B':
			is_bin = true;
			lexer->advance(lexer, false);
			break;
		case 'x':
		case 'X':
			is_hex = true;
			lexer->advance(lexer, false);
			break;
		default:
			has_digit = true;
			break;
		}
	}

	if (!(valid[L_INT] || valid[L_FLOAT])) {
		return (false);
	}

	bool done = false;
	while (((next = lexer->lookahead) != 0) && (!done)) {
		prev = c;
		c    = next;
		if ((c > 0x7f) || isspace(c) || (c == ';')) {
			// optimization: not a valid number, that ends the
			// sequence
			break;
		}
		if (is_bin && (c == '0') || (c == '1')) {
			lexer->advance(lexer, false);
			lexer->mark_end(lexer);
			has_digit = true;
			continue;
		} else if (isdigit(c) ||
		    (is_hex && (!in_exp) && (isxdigit(c)))) {
			lexer->advance(lexer, false);
			lexer->mark_end(lexer);
			has_digit = true;
			continue;
		}

		switch (c) {
		case '.':
			// if we already have a decimal, or we haven't yet
			// collected one, or we are in the exponent, then this
			// dot is not part of our number.  (If we haven't seen
			// a digit yet, then this will be a faield parse.)
			// also binary numbers don't support floating point.
			if (!has_digit || has_dot || in_exp || is_bin) {
				done = true;
				break;
			}
			lexer->advance(lexer, false);
			c = lexer->lookahead;
			// if the next character is a valid digit (note that
			// binary doesn't support this, then we're good
			if (isdigit(c) || (is_hex && isxdigit(c))) {
				lexer->mark_end(lexer);
				has_dot = true;
				continue;
			}
			// look ahead to see if the next thing looks like a
			// property. if it does, then this is a property
			// lookup, otherwise we want to consume the dot and
			// make it a floating point number. Note that lone
			// trailing periods like 1. are nuts, but this is what
			// DMD does.
			if (!(isalnum(c) || c == '_' ||
			        (c > 0x7f && !is_eol(c)))) {
				lexer->mark_end(lexer);
				has_dot = true;
			}

			no_suffix = true;
			done      = true;
			break;

		case '_':
			// an embedded (or possibly trailing) underscore.
			// Allow underscores immediately after the exponent.
			if ((in_exp) || has_digit) {
				lexer->advance(lexer, false);
				continue;
			}
			// either after 0[xXbB] or decimal.
			done = true;
			break;

		case 'e':
		case 'E':
		case 'p':
		case 'P':
			if (in_exp || is_bin) {
				return (false);
			}
			if (is_hex && (c == 'e' || c == 'E')) {
				return (false);
			}
			if ((!is_hex) && (c == 'p' || c == 'P')) {
				return (false);
			}
			lexer->advance(lexer, false);
			c = lexer->lookahead;
			if ((c == '+') || (c == '-')) {
				lexer->advance(lexer, false);
			}
			has_digit = false; // so we need
			in_exp    = true;
			continue;

		default:
			done = true;
			break;
		}
	}
	if (!has_digit) {
		return (false);
	}
	return (
	    match_number_suffix(lexer, valid, has_dot || in_exp, no_suffix));
}

void *
tree_sitter_d_external_scanner_create()
{
	return (NULL);
}

void
tree_sitter_d_external_scanner_destroy(void *arg)
{
}

unsigned
tree_sitter_d_external_scanner_serialize(void *arg, char *buffer)
{
	return (0); // we are completely stateless! :-)
}

void
tree_sitter_d_external_scanner_deserialize(
    void *arg, const char *buffer, unsigned length)
{
}

bool
tree_sitter_d_external_scanner_scan(
    void *arg, TSLexer *lexer, const bool *valid)
{
	bool matched = false;

	int c = lexer->lookahead;
	// consume whitespace -- we also skip newlines here
	while ((isspace(c) || is_eol(c)) && (c)) {
		lexer->advance(lexer, true);
		c = lexer->lookahead;
	}

	if (lexer->eof(lexer)) { // in case we had ending whitespace
		return (false);
	}

	// alphas, and underscore, or leading unicode (which we asssume is
	// alpha) - BOM gets special treatment though
	if (isalpha(c) || c == '_' || (c > 0x7f && c != 0xFEFF)) {
		return (match_identifier(lexer, valid));
	}

	if (c == '.' || isdigit(c)) {
		return (match_number(lexer, valid));
	}

	if (c == '\'') {
		return (valid[L_CHAR] ? match_char_literal(lexer) : false);
	}
	if (c == '"') { // double quoted string, always unambiguous
		return (valid[L_DQSTRING] ? match_dq_string(lexer) : false);
	}

	if (c == '`') { // raw string, also unambiguous
		return (valid[L_BQSTRING]
		        ? match_raw_string(lexer, '`', L_BQSTRING)
		        : false);
	}

	// these are all normal symbols not needing special treatment
	if (strchr("&|~+<>!()[]{}?,:;$=%^~@", c) != NULL) {
		return (match_symbol(lexer, valid));
	}

	if (c == '#') {
		return (match_hash_or_shebang(lexer, valid));
	}

	if (c == '/') {
		// can be one of three comment forms, or /, or /=
		lexer->advance(lexer, false);
		c = lexer->lookahead;
		if (c == '/') {
			return (match_line_comment(lexer, valid));
		}
		if (c == '*') {
			return (match_block_comment(lexer, valid));
		}
		if (c == '+') {
			return (match_nest_comment(lexer, valid));
		}
		if (c == '=') {
			if (valid[S_DIV_EQ]) {
				lexer->advance(lexer, false);
				lexer->mark_end(lexer);
				lexer->result_symbol = S_DIV_EQ;
				return (true);
			} else {
				// this assumes that /= cannot ever occur
				// together except as a single symbol.  if this
				// is not the case then delete this else
				// clause.
				return (false);
			}
		}
		if (valid[S_DIV]) {
			lexer->mark_end(lexer);
			lexer->result_symbol = S_DIV;
			return (true);
		}
		return (false);
	}

	if (c == 0xFEFF) {
		if (valid[BOM]) {
			lexer->advance(lexer, true);
			lexer->mark_end(lexer);
			lexer->result_symbol = BOM;
			return (true);
		}
		return (false);
	}

	return (false);
}
