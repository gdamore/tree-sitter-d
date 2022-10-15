================================================================================
Switch statement
================================================================================

unittest {
	switch (c) {
		case 'A':
			break;
		default:
			break;
	}
}
--------------------------------------------------------------------------------

(source_file
  (unittest_declaration
    (unittest)
    (block_statement
      (switch_statement
        (switch)
        (expression
          (identifier))
        (block_statement
          (case_statement
            (case)
            (char_literal)
            (break_statement
              (break)))
          (case_statement
            (default)
            (break_statement
              (break))))))))

================================================================================
Case range statement
================================================================================

unittest {
	switch (c) {
		case 'A': .. case 'Z':
			break;
		default:
			break;
	}
}
--------------------------------------------------------------------------------

(source_file
  (unittest_declaration
    (unittest)
    (block_statement
      (switch_statement
        (switch)
        (expression
          (identifier))
        (block_statement
          (case_statement
            (case)
            (expression
              (char_literal))
            (case)
            (expression
              (char_literal))
            (break_statement
              (break)))
          (case_statement
            (default)
            (break_statement
              (break))))))))

================================================================================
Case statement multiple args
================================================================================

unittest {
	switch (c) {
		case 'A', 'B', 'C':
			break;
	}
}
--------------------------------------------------------------------------------

(source_file
  (unittest_declaration
    (unittest)
    (block_statement
      (switch_statement
        (switch)
        (expression
          (identifier))
        (block_statement
          (case_statement
            (case)
            (char_literal)
            (char_literal)
            (char_literal)
            (break_statement
              (break))))))))
