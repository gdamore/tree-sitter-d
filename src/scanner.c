/*
 * Scanner (lexer) for D code for use by Tree-Sitter.
 *
 * Copyright 2024 Garrett D'Amore
 *
 * Distributed under the MIT License.
 * (See accompanying file LICENSE.txt or https://opensource.org/licenses/MIT)
 * SPDX-License-Identifier: MIT
 */
#include "tree_sitter/parser.h"
#include <assert.h>
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <wctype.h>

// NB: It is very important that two things are true.
// First, this must match the externals in the grammar.js.
// Second, symbols and keywords must appear with least
// specific matches in front of more specific matches.
enum TokenType {
	END_FILE,
	COMMENT,
	DIRECTIVE, // # <to end of line>
	L_STRING, // string literal (all forms)
};

static bool
is_eol(int c)
{
	return ((c == '\n') || (c == '\r') || (c == 0x2028) || (c == 0x2029));
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
match_delimited_string(TSLexer *lexer, int start, int end)
{
	int  c;
	int  nest  = 0;
	bool first = true;
	lexer->advance(lexer, false); // skip opener
	while ((c = lexer->lookahead) != 0) {
		if (c == start && start != 0) {
			// nesting, increase the nest level
			nest++;
		}
		if (c == end) {
			if (nest > 0) {
				nest--;
			} else if (!first) {
				lexer->advance(lexer, false);
				if ((c = lexer->lookahead) != '"') {
					// do *not* advance, we already did
					// this ensures e.g. }}" will work
					continue;
				}
				lexer->advance(lexer, false);
				lexer->result_symbol = L_STRING;
				match_string_suffix(lexer);
				return (true);
			}
		}
		first = false;
		lexer->advance(lexer, false);
	}
	return (false);
}

static bool
match_heredoc_string(TSLexer *lexer)
{
	// this is an arbitrary, but reasonable limit
	// no identifiers longer than this
	int    identifier[256 + 2]; // +2 for closing " and null
	size_t i = 0;
	size_t j;
	int    c;

	// get the delimiter
	while (i < (sizeof(identifier) - 2)) {
		c = lexer->lookahead;
		// technically should not start with a digit, but we allow
		if (is_eol(c) || ((!iswalnum(c)) && (c != '_'))) {
			break;
		}
		identifier[i++] = c;
		lexer->advance(lexer, false);
	}
	if (i == 0) {
		return (false);
	}
	// inject the closing quote at the end of the identifier
	// this makes our logic below simpler
	identifier[i++] = '"';
	identifier[i]   = 0;

	while ((c = lexer->lookahead) != 0) {
		while ((!is_eol(c)) && (c != 0)) {
			lexer->advance(lexer, false);
			c = lexer->lookahead;
		}
		lexer->advance(lexer, false); // advance past the newline

		j = 0;
		while (((c = lexer->lookahead) != 0) && (j < i)) {
			if (c != identifier[j]) {
				// no match
				break;
			}
			lexer->advance(lexer, false);
			j++;
		}
		if (j == i) {
			// skip the quote
			match_string_suffix(lexer);
			lexer->result_symbol = L_STRING;
			return (true);
		}
	}
	return (false);
}

// NB: this scans ahead aggressively, so it cannot
// be used if other symbols start with underscore.
// As of right now, only __EOF__ needs special lexer support.
static bool
match_eof(TSLexer *lexer)
{
	const char *want = "__EOF__";
	int         i    = 0;
	int         l    = strlen(want);
	int         c;

	if ((c = lexer->lookahead) != '\x1a') { // 0x1A is always EOF
		for (i = 0; i < l; i++) {
			if (lexer->lookahead != want[i]) {
				return (false);
			}
			lexer->advance(lexer, false);
			c = lexer->lookahead;
		}
		if (iswalnum(c) || (c == '_') || (c > 0x7f && !is_eol(c))) {
			return (false);
		}
	}
	// eat entire file
	while (lexer->lookahead != 0) {
		lexer->advance(lexer, false);
	}

	lexer->mark_end(lexer);
	lexer->result_symbol = END_FILE;
	return (true);
}

static bool
match_directive(TSLexer *lexer, const bool *valid)
{
	int c = lexer->lookahead;
	assert(c == '#');
	if (!valid[DIRECTIVE]) {
		return (false);
	}
	lexer->advance(lexer, false);
	c = lexer->lookahead;
	if (c == '!') {
		return (false);
	}
	while ((iswspace(c) || is_eol(c)) && (c)) {
		if (is_eol(c)) {
			return (false);
		}
		lexer->advance(lexer, false);
		c = lexer->lookahead;
	}

	while ((!is_eol(c)) && (c)) {
		lexer->advance(lexer, false);
		c = lexer->lookahead;
	}
	// consume the newline
	lexer->advance(lexer, false);
	lexer->mark_end(lexer);
	lexer->result_symbol = DIRECTIVE;
	return (true);
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
				state = 1;
			}
			break;
		case 1:
			if (c == '/') {
				// closing comment, hurrah!
				lexer->advance(lexer, false);
				lexer->mark_end(lexer);
				lexer->result_symbol = COMMENT;
				return (true);
			} else if (c != '*') {
				state = 0;
			}
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
	int  c             = lexer->lookahead;
	bool start_of_line = lexer->get_column(lexer) == 0;
	// consume whitespace -- we also skip newlines here
	while ((iswspace(c) || is_eol(c)) && (c)) {
		if (is_eol(c)) {
			start_of_line = true;
		}
		lexer->advance(lexer, true);
		c = lexer->lookahead;
	}

	if (c == '#' && start_of_line) {
		return (match_directive(lexer, valid));
	}

	start_of_line = false;

	if (lexer->eof(lexer)) { // in case we had ending whitespace
		return (false);
	}

	// either possibly __EOF__ or the special EOF character
	if ((c == '_') || (c == '\x1A')) {
		return (match_eof(lexer));
	}

	if ((c == 'q') && (valid[L_STRING])) {
		lexer->advance(lexer, false);
		if (lexer->lookahead != '"') {
			return (false);
		}
		lexer->advance(lexer, false);
		switch ((c = lexer->lookahead)) {
		case '(':
			return (match_delimited_string(lexer, '(', ')'));
		case '[':
			return (match_delimited_string(lexer, '[', ']'));
		case '{':
			return (match_delimited_string(lexer, '{', '}'));
		case '<':
			return (match_delimited_string(lexer, '<', '>'));
		default:;
			if (iswalnum(c) || c == '_') {
				return (match_heredoc_string(lexer));
			}
			// non-nesting deliimted string
			return (match_delimited_string(lexer, 0, c));
		}
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
		return (false);
	}

	return (false);
}
