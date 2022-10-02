/*
 * Grammar for D code for use by Tree-Sitter.
 *
 * Copyright 2022 Garrett D'Amore
 *
 * Distributed under the MIT License.
 * (See accompanying file LICENSE.txt or https://opensource.org/licenses/MIT)
 * SPDX-License-Identifier: MIT
 */

//
// Portions of this grammar were influenced by the C grammar for Tree Sitter,
// at https://github.com/tree-sitter/tree-sitter-c/blob/master/grammar.js
//
// That source is MIT licensed, but does not itself carry any boilerplate.
//

const PREC = {
  PAREN: -10,
  ASSIGNMENT: -1,
  CONDITIONAL: -2,
  DEFAULT: 0,
  LOGICAL_OR: 1,
  LOGICAL_AND: 2,
  INCLUSIVE_OR: 3,
  EXCLUSIVE_OR: 4,
  BITWISE_AND: 5,
  EQUAL: 6,
  RELATIONAL: 8,
  SHIFT: 10,
  ADD: 11,
  CONCAT: 12,
  MULTIPLY: 12,
  UNARY: 13,
  CAST: 14,
  THROW: 14,
  POWER: 14,
  POSTFIX: 15,
  CALL: 16,
  SUBSCRIPT: 16,
  PRIMARY: 17,
  IDENTITY: 18,
  TEMPLATE_INSTANCE: 17, // has to be higher than membership
};

module.exports = grammar({

  name: 'd',

  // Some externals have trouble with references, if you don't
  // assign a symbolic name to them.  This is described in
  // https://github.com/tree-sitter/tree-sitter/issues/1887
  externals: $ => [
    $.end_file,
    $.comment,
    $.directive,
    $.shebang,
    $.int_literal,
    $.float_literal,
    $.char_literal,
    $._dqstring, // conventional "string" (may include escapes)
    $._bqstring, // wsiwyg `string`
    $._rqstring, // wsiwyg r"string"
  ],

  extras: $ => [
    /[ \t\r\n\u2028\u2029]/,
    $.comment,
    $.directive,
    $.end_file, // forces stop of parse
  ],

  inline: $ => [
    $.relational_expression,
    $.equality_expression,
    $.add_expression,
    $.shift_expression,
    $.multiply_expression,
    $.concat_expression,
    $.logical_and_expression,
    $.logical_or_expression,
    $.inclusive_or_expression,
    $.exclusive_or_expression,
    $.bitwise_and_operation,
    $.membership_operation,
    $.identity_expression,
    $.power_expression,
    $._basic_type,
    $.declarator,
    $.func_declarator_suffix,
    $.struct_template_declaration,
  ],

  word: $ => $.identifier,

  // The order of these rules very roughly corresponds to the order
  // they are defined in the D grammar on the D website.

  rules: {

    /**************************************************
     *
     * 3.1 LEXER
     *
     * See also the scanner.c, for some external symbols.
     */

    source_file: $ => seq(
      optional(choice($._bom, $.shebang)),
      optional($.module)
    ),

    _bom: $ => '\uFEFF', // kind of like a special form of whitespace

    //
    // Identifier
    //
    identifier: $ => /[\p{L}_][\p{L}_\d]*/,

    //
    // Token String
    //
    token_string: $ =>
      seq('q{', optional($._token_string_tokens), '}'),

    // we aren't tokenizing this yet
    _token_string_tokens: $ => repeat1($._token_string_token),

    _token_string_token: $ =>
      choice(
        seq('{', optional($._token_string_tokens), '}'),
        $._token_no_brackes,
      ),

    _token_no_brackes: $ =>
      choice(
        $.identifier,
        $.string_literal,
        $.char_literal,
        $.int_literal,
        $.float_literal,
        $.keyword,
        '/',
        '/=',
        '.',
        '..',
        '...',
        '&',
        '&=',
        '&&',
        '|',
        '|=',
        '||',
        '-',
        '-=',
        '--',
        '+',
        '+=',
        '++',
        '<',
        '<=',
        '<<',
        '<<=',
        '>',
        '>=',
        '>>=',
        '>>>=',
        '>>',
        '>>>',
        '!',
        '!=',
        '(',
        ')',
        '[',
        ']',
        '?',
        ',',
        ';',
        ':',
        '$',
        '=',
        '==',
        '*',
        '*=',
        '%',
        '%=',
        '^',
        '^=',
        '^^',
        '^^=',
        '~',
        '~=',
        '@',
        '=>',
        '#',
      ),

    keyword: $ =>
      choice(
        'abstract',
        'alias',
        'align',
        'asm',
        'assert',
        'auto',
        'body',
        'bool',
        'break',
        'byte',
        'case',
        'cast',
        'catch',
        'cdouble',
        'cent',
        'cfloat',
        'char',
        'class',
        'const',
        'continue',
        'creal',
        'dchar',
        'debug',
        'default',
        'delegate',
        'delete',
        'deprecated',
        'do',
        'double',
        'else',
        'enum',
        'export',
        'extern',
        'false',
        'final',
        'finally',
        'float',
        'for',
        'foreach',
        'foreach_reverse',
        'function',
        'goto',
        'idouble',
        'if',
        'ifloat',
        'immutable',
        'import',
        'in',
        'inout',
        'int',
        'interface',
        'invariant',
        'ireal',
        'is',
        'lazy',
        'long',
        'macro',
        'mixin',
        'module',
        'new',
        'nothrow',
        'null',
        'out',
        'override',
        'package',
        'pragma',
        'private',
        'protected',
        'public',
        'pure',
        'real',
        'ref',
        'return',
        'scope',
        'shared',
        'short',
        'static',
        'struct',
        'super',
        'switch',
        'synchronized',
        'template',
        'this',
        'throw',
        'true',
        'try',
        'typeid',
        'typeof',
        'ubyte',
        'ucent',
        'uint',
        'ulong',
        'union',
        'unittest',
        'ushort',
        'version',
        'void',
        'wchar',
        'while',
        'with',
        '__FILE__',
        '__FILE_FULL_PATH__',
        '__MODULE__',
        '__LINE__',
        '__FUNCTION__',
        '__PRETTY_FUNCTION__',
        '__gshared',
        '__traits',
        '__vector',
        '__parameters',
      ),

    /**************************************************
     *
     * 3.2 MODULES
     *
     */

    module: $ =>
      choice(
        seq($.module_declaration, repeat($._decldef)),
        repeat1($._decldef)),

    _decldef: $ => choice(
      $.attribute_specifier,
      $._declaration,
      $.constructor,
      $.destructor,
      $.postblit,
      $.invariant,
      $.unittest,
      $.alias_this,
      $.debug_specification,
      $.version_specification,
      $.template_declaration,
      $.mixin_declaration,
      $.empty_declaration,
    ),
    // a few things are already in declaration, so not included in _decldef:
    // - static_assert,
    // - conditional_declaration
    // - template_mixin_declaration
    // - template_mixin

    empty_declaration: $ => ';',

    //
    // Module Declarations
    //
    module_declaration: $ =>
      seq(
        // deprecated attribute can only appear once
        optional($.at_attribute),
        optional(seq($.deprecated_attribute, optional($.at_attribute))),
        'module',
        field('name', alias($._identifier_chain, $.module_fqn)),
        ';'),

    _identifier_chain: $ =>
      seq($.identifier, repeat(seq('.', $.identifier))),

    //
    // Import Declarations
    // Note that 'static import' is not provided for here, because it is
    // ambiguous with the attribute_specifiers. Technically we probably
    // prefer the static to be more tightly bound to the import, but for
    // syntax tree analysis it probably does not matter much.
    //
    import_declaration: $ => seq('import', $._import_list, ';'),

    _import_list: $ =>
      choice(
        seq($.import, optional(seq(',', $._import_list))),
        $._import_bindings,
      ),

    // libdparse calls this single_import
    import: $ =>
      choice(
        alias($._identifier_chain, $.module_fqn),
        seq(
          field('alias', $.identifier),
          '=',
          alias($._identifier_chain, $.module_fqn))),

    _import_bindings: $ => seq($.import, ':', commaSep1($.import_bind)),

    import_bind: $ => seq($.identifier, optional(seq('=', $.identifier))),

    //
    // Mixin Declaration
    //
    mixin_declaration: $ => seq('mixin', paren($._arg_list), ';'),


    /**************************************************
     *
     * 3.3 DECLARATIONS
     *
     */

    _declaration: $ =>
      choice(
        $._declaration_no_storage_class,
        $._declaration_have_storage_class,
        $._declaration_omit_statement,
      ),

    // when these declarations appear in a declarartion
    // block, they cannot have storage classes, but when
    // they appear in a declaration statement they get them added
    _declaration_no_storage_class: $ =>
      choice(
        $.alias_assign,
        $.class_declaration,
        $.interface_declaration,
        $.struct_declaration,
        $.union_declaration,
        $.enum_declaration,
        $.template_mixin_declaration,
      ),

    // these already storage classes, so to prevent conflicts
    // we must not attempt to prefix them with one elsehwere
    // (.e. declaration_statement)
    _declaration_have_storage_class: $ =>
      choice(
        $.func_declaration,
        $.var_declarations,
        $.alias_declaration, // alias assignments is special
      ),

    // these are declarations that we would prefer not to
    // have in the embedded declaration statement, because
    // there are other beter forms for the statements that they
    // would conflict with.  Typically these are things that
    // aren't actually declarations.
    _declaration_omit_statement: $ =>
      choice(
        $.conditional_declaration,
        $.import_declaration,
        $.static_assert,
        $.template_mixin,
        $.static_foreach_declaration,
      ),

    //
    // Variable Declarations
    //
    var_declarations: $ =>
      choice(
        seq(
          optional($._storage_classes),
          field('type', $._basic_type),
          $._declarators,
          ';'),
        $.auto_declaration,
      ),

    _declarators: $ =>
      choice(
        $._declarator_initializer,
        seq($._declarator_initializer, ',', $._declarator_identifier_list),
      ),

    _declarator_initializer: $ =>
      seq($.var_declarator,
        optional($.template_parameters),
        optional(seq('=', field('value', $._initializer)))),

    var_declarator: $ =>
      seq(
        repeat($._type_suffix),
        field('variable', $.identifier)),

    _declarator_identifier_list: $ => commaSep1($.declarator_identifier),

    declarator_identifier: $ => choice(
      field('variable', $.identifier),
      seq(
        field('variable', $.identifier),
        optional($.template_parameters),
        '=',
        field('value', $._initializer)),
    ),

    // declarator: $ => prec.left(seq(repeat($._type_suffix), $.identifier)),
    declarator: $ => $.var_declarator,

    //
    // Storage Classes
    //
    storage_class: $ =>
      prec.right(choice(
        $.linkage_attribute,
        $.align_attribute,
        $.at_attribute,
        'deprecated',
        'enum',
        'static',
        'extern',
        'abstract',
        'final',
        'override',
        'synchronized',
        'auto',
        'scope',
        'const',
        'immutable',
        'inout',
        'shared',
        '__gshared',
        'ref',
        $._function_attribute_kwd,
      )),

    _storage_classes: $ => repeat1($.storage_class),

    //
    // Initializers
    //
    _initializer: $ => prec.left(choice(
      $._expr,
      $.aggregate_initializer,
      'void',
      // $.array_literal is already covered under _expression
    )),

    //
    // Auto Declaration
    //
    auto_declaration: $ => seq($._storage_classes, commaSep1($._auto_assignment), ';'),

    _auto_assignment: $ => seq(
      field('variable', $.identifier),
      optional($.template_parameters),
      '=',
      field('value', $._initializer)),

    //
    // Alias Declaration
    //
    alias_declaration: $ =>
      seq('alias',
        choice(
          seq(optional($._storage_classes), $._basic_type, $._declarators),
          seq(optional($._storage_classes), $._basic_type, $._func_declarator),
          commaSep1($.alias_assignment)),
        ';'),

    alias_assignment: $ => choice(
      seq($.identifier,
        optional($.template_parameters),
        '=',
        optional($._storage_classes),
        $.type),
      seq($.identifier,
        optional($.template_parameters),
        '=',
        optional($._storage_classes),
        $.function_literal),
      seq($.identifier,
        optional($.template_parameters),
        '=',
        $._basic_type,
        $.parameters,
        optional($._member_function_attributes)),
    ),

    //
    // Alias Assign (type alias)
    //
    alias_assign: $ => seq($.identifier, '=', $.type),

    /**************************************************
     *
     * 3.4 TYPES
     *
     */

    type: $ =>
      prec.left(seq(repeat($.type_ctor), $._basic_type, repeat($._type_suffix))),

    type_ctor: $ => choice('const', 'immutable', 'inout', 'shared'),

    _basic_type: $ =>
      choice(
        $.builtin_type,
        seq('.', $.qualified_identifier),
        $.qualified_identifier,
        $.typeof,
        seq($.typeof, '.', $.qualified_identifier),
        seq($.type_ctor, paren($.type)),
        $._vector,
        // TODO: $.traits_expression,
        $.mixin_expression,
        $.type_alias,
      ),

    // grammar document misses these, but they are built in aliass
    // for other types.
    type_alias: $ => choice('string', 'size_t', 'ptrdiff_t', 'noreturn'),

    _vector: $ => seq('__vector', paren($.type)),

    // aka fundamental type
    builtin_type: $ =>
      choice(
        'bool',
        'byte',
        'ubyte',
        'char',
        'short',
        'ushort',
        'int',
        'uint',
        'long',
        'ulong',
        'cent', // deprecated
        'ucent', // deprecated
        'wchar',
        'dchar',
        'float',
        'double',
        'real',
        'ifloat', // deprecated
        'idouble', // deprecated
        'ireal', // deprecated
        'cfloat', // deprecated
        'cdouble', // deprecated
        'creal', // deprecated
        'void'
      ),

    _type_suffix: $ =>
      prec.left(choice(
        '*',
        seq('[', ']'),
        seq('[', $._expr, ']'),
        seq('[', $._expr, '..', $._expr, ']'),
        seq('[', $.type, ']'),
        seq('delegate', $.parameters, optional($._member_function_attributes)),
        seq('function', $.parameters, repeat($._function_attribute)),
      )),

    qualified_identifier: $ =>
      prec.left(choice(
        $.template_instance,
        seq($.identifier, optional(seq('[', $._expr, ']')),
          optional(seq('.', $.qualified_identifier))),
      )),

    //
    // Typeof
    //
    typeof: $ => choice(
      seq('typeof', paren(commaSep1($._expr))),
      seq('typeof', paren('return')),
    ),

    // Mixin Type replaced by mixin_expression (evaluates identically)

    //
    // 3.5 ATTRIBUTES
    //

    align_attribute: $ =>
      prec.left(seq('align', optional(paren($._expr)))),

    deprecated_attribute: $ =>
      seq('deprecated', optional(paren($._expr))),

    attribute_specifier: $ =>
      prec.right(choice(
        seq($._attribute, ':'),
        seq($._attribute, $._decldef),
        seq($._attribute, '{', repeat($._decldef), '}'))),

    _attribute: $ => prec.right(choice(
      $.linkage_attribute,
      $.align_attribute,
      $.deprecated_attribute,
      $.pragma,
        'private',
        'package',
        seq('package', '(', $.qualified_identifier, ')'),
        'protected',
        'public',
        'export',
      'static',
      'extern',
      'abstract',
      'final',
      'override',
      'synchronized',
      'auto',
      'scope',
      'const',
      'immutable',
      'inout',
      'shared',
      '__gshared',
      $.at_attribute,
      $._function_attribute_kwd,
      'ref',
      'return',
    )),

    at_attribute: $ =>
      prec.left(choice(
        seq('@', field('name', $.identifier)),
        seq('@', field('name', $.identifier), '(', optional($._arg_list), ')'),
        seq('@', '(', optional($._arg_list), ')'),
        seq('@', $.template_instance))),

    _function_attribute_kwd: $ => choice('nothrow', 'pure'),

    linkage_attribute: $ => seq('extern',
      paren(
        choice(
          "C",
          "C++",
          "D",
          "Windows",
          "System",
          "Objective-C",
          seq("C++", ',', $.qualified_identifier),
          seq("C++", ',', $._namespace_list),
          seq("C++", ',', 'class'),
          seq("C++", ',', 'struct'),
        ))),

    _namespace_list: $ => commaSep1Comma($._conditional_expression),

    _decl_block: $ =>
      choice($._decldef, seq('{', repeat($._decldef), '}')),

    _arg_list: $ =>
      prec.left(commaSep1Comma($._expr)),

    //
    // 3.6 PRAGMAS
    //
    pragma_declaraion: $ =>
      choice(
        seq($.pragma, ';'),
        seq($.pragma, $._decl_block),
      ),

    pragma_statement: $ =>
      choice(
        // seq($.pragma, ';'), // already covered by no_scope_statement
        seq($.pragma, $._no_scope_statement),
      ),

    pragma: $ =>
      choice(
        seq('pragma', paren($.identifier)),
        seq('pragma', paren($.identifier, ',', $._arg_list)),
      ),


    //
    // 3.7 EXPRESSIONS
    //

    // in statements, most uses of expressions can use comma form
    _comma_expression: $ => prec.left(commaSep1($._expr)),

    // formally this is AssignExpression, but we use a different
    // structure.  This is just a single expression term, and
    // cannot be used in a comma expression. Expression is
    // used where comma separated expressions are valid. 
    _expr: $ =>
      prec.left(
        choice(
          $._left_expression,
          'true',
          'false',
          'null',
          'this',
          'super',
          '$',
          $.int_literal,
          $.float_literal,
          $.char_literal,
          prec.left(repeat1($.string_literal)),
          $.array_literal,
          $.assoc_array_literal,
          $.typeof,
          $.special_keyword,
          $.function_literal,
          $.assert_expression,
          $.import_expression,
          $.is_expression,
          $.special_keyword,
          paren($._comma_expression),
          // TODO: _traits_expression
        )),

    // this is basically "AssignExpression", but we have taken the liberty
    // to separate out things that are *necesarily* unable to appear on the
    // left hand side of an assignment expression.  The things that *can*
    // do that, are in the _left_expression.
    /*
    _expression: $ => prec.left(choice(
      $._left_expression,
      'true',
      'false',
      'null',
      'this',
      'super',
      '$',
      $.int_literal,
      $.float_literal,
      $.char_literal,
      prec.left(repeat1($.string_literal)),
      $.array_literal,
      $.assoc_array_literal,
      $.typeof,
      $.special_keyword,
      $.function_literal,
      $.assert_expression,
      $.import_expression,
      $.is_expression,
      $.special_keyword,
      paren($._comma_expression),
      // TODO: _traits_expression
    )),
    */

    // Pretty much anything can be assigned to in D, because
    // of operator overloading.  Keywords and literals are the exception.
    _left_expression: $ => choice(
      $.assignment_expression,
      $._conditional_expression,
    ),

    // this includes all parts of expression *except* assignment
    // needed for a few other places
    _conditional_expression: $ => prec.left(choice(
      $.ternary_expression,
      $.binary_expression,
      $.unary_expression,
      $.prefix_expression,
      $.postfix_expression,
      $.pointer_expression,
      $.cast_expression,
      $.delete_expression,
      $.throw_expression,
      $.ternary_expression,
      $.cast_expression,
      $.field_expression,
      $.construct_expression,
      $.index_expression,
      $.mixin_expression,
      $.new_expression,
      $.typeid_expression,
      $.call_expression,
      $._primary_expression,
    )),

    ternary_expression: $ => prec.right(PREC.CONDITIONAL, seq(
      field('condition', $._expr),
      '?',
      field('consequence', $._comma_expression),
      ':',
      field('alternative', $._expr))),


    field_expression: $ => prec.left(PREC.POSTFIX, seq(
      field('argument', $._expr), '.',
      field('member', choice($.identifier, $.template_instance, $.new_expression))
    )),

    call_expression: $ => prec.left(PREC.CALL, seq(
      field('function', $._expr),
      '(',
      field('arguments', optional($._arg_list)),
      ')'
    )),

    construct_expression: $ =>
      prec(PREC.POSTFIX,
        seq(repeat($.type_ctor), $._basic_type, paren(optional($._arg_list))
        )),

    _primary_expression: $ =>
      prec(PREC.PRIMARY, choice(
        choice(
          $.identifier,
          seq('.', $.identifier),
          $.template_instance,
          seq('.', $.template_instance),
          seq(paren($.type), '.', $.identifier),
          seq(paren($.type), '.', $.template_instance),
          seq($.builtin_type, '.', $.identifier),
          paren($._comma_expression),
        )
      )),

    // also covers slicing (we renamed from slice,
    // and deleted the old index expression as it was redundant)
    index_expression: $ =>
      prec.left(PREC.SUBSCRIPT,
        seq(
          field('argument', $._expr),
          seq('[', optional(commaSep1Comma($._slice)), ']')),
      ),

    _slice: $ => prec.left(PREC.SUBSCRIPT, choice(
      field('index', $._expr),
      field('range',
        seq(field('start', $._expr), '..', field('end', $._expr)))
    )),

    assignment_expression: $ => prec.right(PREC.ASSIGNMENT, seq(
      field('left', $._left_expression),
      field('operator',
        choice(
          '=',
          '+=', '-=', '*=', '/=', '%=', '&=', '|=',
          '^=', '~=', '<<=', '>>=', '>>>=', '^^=',
        )),
      field('right', $._expr))),

    pointer_expression: $ => prec.left(PREC.CAST, seq(
      field('operator', choice('*', '&')),
      field('argument', $._expr)
    )),

    relational_expression: $ => prec.left(PREC.RELATIONAL, seq(
      field('left', $._expr),
      field('operation', choice('>', '>=', '<', '<=')),
      field('right', $._expr)
    )),

    equality_expression: $ => prec.left(PREC.EQUAL, seq(
      field('left', $._expr),
      field('operation', choice('==', '!=')),
      field('right', $._expr)
    )),

    shift_expression: $ => prec.right(PREC.SHIFT, seq(
      field('left', $._expr),
      field('operation', choice('>>', '>>>', '<<')),
      field('right', $._expr)
    )),

    add_expression: $ => prec.right(PREC.ADD, seq(
      field('left', $._expr),
      field('operation', choice('+', '-')),
      field('right', $._expr)
    )),

    multiply_expression: $ => prec.right(PREC.MULTIPLY, seq(
      field('left', $._expr),
      field('operation', choice('*', '/', '%')),
      field('right', $._expr)
    )),

    concat_expression: $ => prec.right(PREC.CONCAT, seq(
      field('left', $._expr),
      field('operation', '~'),
      field('right', $._expr)
    )),

    logical_and_expression: $ => prec.right(PREC.LOGICAL_AND, seq(
      field('left', $._expr),
      field('operation', '&&'),
      field('right', $._expr)
    )),

    logical_or_expression: $ => prec.right(PREC.LOGICAL_OR, seq(
      field('left', $._expr),
      field('operation', '||'),
      field('right', $._expr)
    )),

    inclusive_or_expression: $ => prec.right(PREC.INCLUSIVE_OR, seq(
      field('left', $._expr),
      field('operation', '|'),
      field('right', $._expr)
    )),

    exclusive_or_expression: $ => prec.right(PREC.EXCLUSIVE_OR, seq(
      field('left', $._expr),
      field('operation', '^'),
      field('right', $._expr)
    )),

    bitwise_and_operation: $ => prec.right(PREC.BITWISE_AND, seq(
      field('left', $._expr),
      field('operation', '&'),
      field('right', $._expr)
    )),

    identity_expression: $ => prec.right(PREC.IDENTITY, seq(
      field('left', $._expr),
      field('operation', seq(optional('!'), choice('is', 'in'))),
      field('right', $._expr)
    )),

    power_expression: $ => prec.right(PREC.POWER, seq(
      field('left', $._expr),
      field('operation', '^^'),
      field('right', $._expr)
    )),

    binary_expression: $ => choice(
      $.relational_expression,
      $.equality_expression,
      $.shift_expression,
      $.multiply_expression,
      $.add_expression,
      $.concat_expression,
      $.logical_and_expression,
      $.logical_or_expression,
      $.inclusive_or_expression,
      $.exclusive_or_expression,
      $.bitwise_and_operation,
      $.identity_expression,
      $.power_expression,
    ),

    prefix_expression: $ => prec.right(PREC.POSTFIX, seq(
      field('operator', choice('++', '--')),
      field('operand', $._expr),
    )),

    postfix_expression: $ => prec.right(PREC.POSTFIX, seq(
      field('operand', $._expr),
      field('operator', choice('++', '--')),
    )),

    unary_expression: $ => prec.left(PREC.UNARY, seq(
      field('operator', choice('~', '+', '-', '!')),
      field('operand', $._expr),
    )),

    cast_expression: $ =>
      prec.left(PREC.CAST, choice(
        seq('cast', '(', $.type, ')', field('operand', $._expr)),
        seq('cast', '(', $.cast_qualifier, ')', $._expr),
      )),

    // these are only allowed in specific combinations
    cast_qualifier: $ =>
      choice(
        'const',
        seq('const', 'shared'),
        'immutable',
        'inout',
        seq('inout', 'shared'),
        'shared',
        seq('shared', 'const'),
        seq('shared', 'inout')),

    delete_expression: $ =>
      prec.right(PREC.CAST, seq('delete', $._expr)),

    throw_expression: $ =>
      prec.right(PREC.THROW, seq('throw', $._expr)),

    //
    // Assert expression.
    //
    assert_expression: $ =>
      prec.left(seq('assert', paren($._assert_arguments))),

    _assert_arguments: $ => prec.left(commaSep1Comma($._expr)),

    //
    // Mixin expression.  The result may be an lvalue.
    //
    mixin_expression: $ =>
      prec(PREC.PRIMARY, seq('mixin', paren($._arg_list))),

    //
    // Import expression - evaluates to a string literal.
    //
    import_expression: $ =>
      prec.left(PREC.PRIMARY, seq('import', paren($._expr))),

    new_expression: $ =>
      prec.left(PREC.PRIMARY, choice(
        seq('new', $.type),
        seq('new', $.type, '[', $._expr, ']'),
        seq('new', $.type, paren(optional($._arg_list))),
        $.new_anon_class_expression,
      )),

    typeid_expression: $ =>
      prec.left((PREC.PRIMARY, choice(
        seq('typeid', paren($.type)),
        seq('typeid', paren($._expr))
      ))),

    is_expression: $ =>
      prec.left(PREC.PRIMARY, choice(
        seq('is', paren($.type)),
        seq('is', paren($.type, '==', $.type_specialization)),
        seq('is', paren($.type, ':', $.type_specialization)),
        seq('is', paren($.type, '==', $.type_specialization, ',', $._template_parameter_list)),
        seq('is', paren($.type, ':', $.type_specialization, ',', $._template_parameter_list)),
        seq('is', paren($.type, $.identifier)),
        seq('is', paren($.type, $.identifier, '==', $.type_specialization)),
        seq('is', paren($.type, $.identifier, ':', $.type_specialization)),
        seq('is', paren($.type, $.identifier, '==', $.type_specialization, ',', $._template_parameter_list)),
        seq('is', paren($.type, $.identifier, ':', $.type_specialization, ',', $._template_parameter_list))
      )),

    type_specialization: $ => choice(
      $.type,
      'struct',
      'union',
      'class',
      'interface',
      'enum',
      '__vector',
      'function',
      'delegate',
      'super',
      'const',
      'immutable',
      'inout',
      'shared',
      'return',
      '__parameters',
      'module',
      'package',
    ),

    // string literal stuff
    string_literal: $ => choice(
      $._dqstring,
      $._bqstring,
      $._rqstring,
      $.token_string,
      //'__DATE__',
      //'__TIME__',
      //'__TIMESTAMP__',
      //'__VENDOR__'
    ),

    array_literal: $ => seq('[', commaSep($._array_member_init), ']'),

    _array_member_init: $ => choice(
      field('value', $._initializer),
      seq(field('key', $._expr), ':', field('value', $._initializer)),
    ),

    assoc_array_literal: $ => seq('[', commaSep1($._kv_pair), ']'),

    _kv_pair: $ => prec.left(seq(field('key', $._expr), ':', field('value', $._expr))),

    //
    // Function Literal
    //
    function_literal: $ =>
      choice(
        seq(
          'function',
          optional($.ref_auto_ref),
          optional($.type),
          optional($._parameter_with_attributes),
          $._func_literal_body2),
        seq(
          'delegate',
          optional($.ref_auto_ref),
          optional($.type),
          optional($._parameter_with_member_attributes),
          $._func_literal_body2),
        seq(optional($.ref_auto_ref),
          $._parameter_with_member_attributes,
          $._func_literal_body2),
        $.block_statement,
        seq($.identifier, '=>', $._expr),
      ),

    _parameter_with_attributes: $ =>
      seq($.parameters, repeat($._function_attribute)),

    _parameter_with_member_attributes: $ =>
      seq($.parameters, optional($._member_function_attributes)),

    ref_auto_ref: $ => seq(optional('auto'), 'ref'),

    _func_literal_body2: $ => choice(
      seq('=>', $._expr),
      $._specified_function_body,
    ),

    special_keyword: $ => choice(
      '__FILE__',
      '__FILE_FULL_PATH__',
      '__MODULE__',
      '__LINE__',
      '__FUNCTION__',
      '__PRETTY_FUNCTION__',
      // TODO: why not add __DATE__, __TIME__, __TIMESTAMP__, __VENDOR__, and *maybe* __VERSION__ ?
    ),

    //
    // 3.8 Statements
    //

    _statement: $ => choice(
      $.empty_statement,
      $._non_empty_statement,
    ),

    empty_statement: $ => ';',

    _no_scope_statement: $ => choice(
      $.empty_statement,
      $._non_empty_statement,
      $.block_statement,
    ),

    _non_empty_statement: $ =>
      choice(
        $._non_empty_statement_no_case_no_default,
        $.case_statement,
        $.case_range_statement,
        $.default_statement,
      ),

    _scope_statement: $ =>
      choice(
        $._non_empty_statement,
        $.block_statement,
      ),

    _non_empty_statement_no_case_no_default: $ =>
      choice(
        // TODO : BUSTED $.labeled_statement,
        $._expression_statement,
        $._declaration_statement,
        $.if_statement,
        $.while_statement,
        $.do_statement,
        $.for_statement,
        $.foreach_statement,
        $.switch_statement,
        $.final_switch_statement,
        $.continue_statement,
        $.break_statement,
        $.return_statement,
        $.goto_statement,
        $.with_statement,
        $.synchronized_statement,
        $.try_statement,
        $.scope_guard_statement,
        $.asm_statement,
        $.foreach_range_statement,
        $.pragma_statement,
        $.conditional_statement,
        $.static_foreach_statement,
        $.template_mixin,
        $.static_assert,
        $.import_declaration,
      ),

    // mixin_statement is already covered by expression_statement

    labeled_statement: $ => prec.left(seq($.identifier, ':', optional($._statement))),

    block_statement: $ => seq('{', repeat($._statement), '}'),

    _expression_statement: $ => seq($._comma_expression, ';'),

    // declaration_statement is special because it easily conflicts with
    // other kinds of statements.
    _declaration_statement: $ =>
      choice(
        seq(optional($._storage_classes), $._declaration_no_storage_class),
        $._declaration_have_storage_class,
      ),

    if_statement: $ =>
      prec.right(seq('if',
        paren(field('condition', $._if_condition)),
        field('then', $._scope_statement),
        optional(seq('else', field('else', $._scope_statement))))),

    _if_condition: $ => choice(
      $._expr,
      seq('auto', $.identifier, '=', $._comma_expression),
      seq('scope', $.identifier, '=', $._comma_expression),
      seq(repeat1($.type_ctor), $.identifier, '=', $._comma_expression),
      seq(repeat($.type_ctor), $._basic_type, $.declarator, '=', $._comma_expression),
    ),

    while_statement: $ => seq(
      'while',
      paren(field('condition', $._if_condition)),
      field('do', $._scope_statement)
    ),

    do_statement: $ => seq(
      'do',
      field('do', $._scope_statement),
      'while',
      paren(field('condition', $._comma_expression))
    ),

    //
    // For Statement
    //
    for_statement: $ => seq(
      seq(
        'for',
        paren(
          $.initialize,
          optional($.test),
          ';',
          optional($.increment)),
        $._scope_statement)),


    initialize: $ => choice(';', $._scope_statement),

    test: $ => $._comma_expression,

    increment: $ => $._comma_expression,

    //
    // Foreach Statement
    //

    foreach_statement: $ =>
      seq($._aggregate_foreach, $._scope_statement),

    _foreach_type_list: $ => commaSep1($._foreach_type),

    _foreach_type: $ =>
      seq(
        repeat(choice('ref', 'alias', 'enum', $.type_ctor)),
         optional($.type),
         $.identifier),

    _aggregate_foreach: $ =>
      seq(
        choice('foreach', 'foreach_reverse'),
        paren($._foreach_type_list, ';', $._comma_expression)),

    //
    // Foreach Range Statement
    //
    foreach_range_statement: $ => seq($._range_foreach, $._scope_statement),

    _range_foreach: $ =>
      seq(
        choice('foreach', 'foreach_reverse'),
        paren(
          field('iterator', $._foreach_type),
          ';',
          field('start', $._comma_expression),
          '..',
          field('end', $._comma_expression)),
      ),

    //
    // Switch Statement
    //

    switch_statement: $ =>
      seq('switch', paren($._comma_expression), $._scope_statement),

    case_statement: $ =>
      prec.left(
        seq('case', $._arg_list, ':', optional($._scope_statement_list))),

    case_range_statement: $ =>
      prec.left(
        seq('case', $._expr, ':', '..', 'case', $._expr,
          optional($._scope_statement_list))),

    default_statement: $ =>
      prec.left(seq('default', ':', optional($._scope_statement_list))),

    _scope_statement_list: $ =>
      repeat1(choice(
        $.empty_statement,
        $._non_empty_statement_no_case_no_default,
        $.block_statement)),

    final_switch_statement: $ =>
      seq('final', 'switch', paren($._comma_expression), $._scope_statement),

    continue_statement: $ => seq('continue', optional($.identifier), ';'),

    break_statement: $ => seq('break', optional($.identifier), ';'),

    return_statement: $ => seq('return', optional($._comma_expression), ';'),

    goto_statement: $ => choice(
      seq('goto', $.identifier, ';'),
      seq('goto', 'default', ';'),
      seq('goto', 'case', ';'),
      seq('goto', 'case', $._comma_expression, ';')
    ),

    with_statement: $ =>
      seq('with',
        paren(choice(
          $._comma_expression,
          $.template_instance
        )),
        $._scope_statement),

    synchronized_statement: $ =>
      prec.left(choice(
        seq('synchronized', $._scope_statement),
        seq('synchronized', paren($._comma_expression), $._scope_statement)
      )),

    //
    // Try Statement
    //
    try_statement: $ =>
      prec.right(
        seq('try', $._scope_statement, repeat($.catch), optional($.finally))),

    catch: $ =>
      seq(
        'catch',
        paren($._basic_type, optional($.identifier)),
        $._scope_statement),

    finally: $ => seq('finally', $._scope_statement),


    //
    // Scope Guard Statement
    //
    scope_guard_statement: $ =>
      seq('scope',
        paren(choice('exit', 'success', 'failure')),
        choice($._non_empty_statement, $.block_statement)),

    //
    // Asm Statement
    //
    asm_statement: $ =>
      seq('asm', repeat($._function_attribute), '{', $._asm_instruction_list, '}'),

    //
    // Mixin Statement
    //
    mixin_statement: $ =>
      seq('mixin', paren($._arg_list), ';'),

    /**************************************************
     *
     * 3.9 STRUCTS AND UNIONS
     *
     */

    struct_declaration: $ => choice(
      seq('struct', $.identifier, ';'),
      seq('struct', $.identifier, $.aggregate_body),
      seq('struct', $.aggregate_body), // anonymous struct
      $.struct_template_declaration,
    ),

    // AnonStructDeclaration inlined above

    union_declaration: $ => choice(
      seq('union', $.identifier, ';'),
      seq('union', $.identifier, $.aggregate_body),
      seq('union', $.aggregate_body), // anonymous union
      $.union_template_declaration,
    ),

    // AnonUnionDeclaration inlined above

    aggregate_body: $ => seq('{', repeat($._decldef), '}'),

    //
    // Struct Initializer
    //
    // renamed to aggregate initializer, as this is used for
    // all aggregate types (classes, enums, interfaces, structs)
    // also struct_member_initializers is inlined here
    aggregate_initializer: $ =>
      seq('{', optional(commaSep1Comma($.member_initializer)), '}'),

    // struct_member_initializer shortened to member_initializer
    member_initializer: $ =>
      seq(optional(seq($.identifier, ':')), $._initializer),

    //
    // Postblit
    //
    postblit: $ =>
      seq(
        'this', paren('this'),
        optional($._member_function_attributes),
        choice($.function_body, ';'),
      ),

    //
    // Invariant
    //
    invariant: $ =>
      choice(
        seq('invariant', paren(), $.block_statement),
        seq('invariant', $.block_statement),
        seq('invariant', paren($._assert_arguments), ';')
      ),

    /**************************************************
     *
     * 3.10 CLASSES
     *
     */

    class_declaration: $ =>
      choice(
        seq('class', $.identifier, ';'),
        seq('class', $.identifier, optional($._base_class_list), $.aggregate_body),
        $.class_template_declaration,
      ),

    _base_class_list: $ =>
      seq(':', $._super_class_or_interface, optional(seq(',', $._interfaces))),

    _super_class_or_interface: $ => $._basic_type,

    _interfaces: $ => $.interface,

    interface: $ => $._basic_type,

    // Invariant was listed in 3.9 above already.

    //
    // Constructor - we usea single form with optional shared static prefixes
    // instead of separate expansions.
    //
    constructor: $ =>
      choice(
        seq('this', $.parameters,
          optional($._member_function_attributes), $.function_body),
        seq(optional('shared'), 'static', 'this', paren(),
          optional($._member_function_attributes),
          choice($.function_body, ';')),
        $.constructor_template,
      ),

    destructor: $ =>
      choice(
        seq('~', 'this', paren(),
          optional($._member_function_attributes), $.function_body),
        seq(optional('shared'), 'static', '~', 'this', paren(),
          optional($.member_function_attribute),
          choice($.function_body, ';')),
      ),

    //
    // Alias This
    //
    alias_this: $ => seq('alias', $.identifier, 'this', ';'),

    //
    // NewAnonClassExpression
    //
    new_anon_class_expression: $ =>
      seq('new',
        'class',
        paren(optional($._arg_list)),
        optional($._anon_base_class_list),
        $.aggregate_body),

    _anon_base_class_list: $ =>
      seq($._super_class_or_interface, optional(seq(',', $._interfaces))),

    /**************************************************
     *
     * 3.11 INTERFACES
     *
     */

    interface_declaration: $ =>
      choice(
        seq('interface', $.identifier, ';'),
        seq('interface', optional($._base_interface_list), $.aggregate_body),
        $.interface_template_declaration,
      ),

    _base_interface_list: $ => seq(':', $._interfaces),

    /**************************************************
     *
     * 3.12 ENUMS
     *
     */

    enum_declaration: $ => prec.right(
      choice(
        seq('enum', $.identifier, $._enum_body),
        seq('enum', $.identifier, ':', $.type, $._enum_body),
        seq('enum', ':', $.type, '{', $._enum_members, '}'), // anonymous
        // NB: grammar also lists this with _enum_members, but
        // that's just a degenerate case of this one.
        seq('enum', '{', $._anonymous_enum_members, '}'),
      )),

    _enum_body: $ => choice(seq('{', $._enum_members, '}'), ';'),
    _enum_members: $ => commaSep1Comma($.enum_member),

    _enum_member_attribute: $ =>
      choice(
        $.deprecated_attribute,
        $.at_attribute,
      ),

    enum_member: $ =>
      seq(
        repeat($._enum_member_attribute),
        $.identifier,
        optional(seq('=', $._expr))
      ),

    _anonymous_enum_member: $ => choice(
      $.enum_member,
      seq($.type, '=', $._expr),
    ),

    _anonymous_enum_members: $ => commaSep1Comma($._anonymous_enum_member),


    /**************************************************
     *
     * 3.13 FUNCTIONS
     *
     */

    func_declaration: $ =>
      choice(
        // in order to help the grammar we are inlining
        // choices here.
        seq(
          optional($._storage_classes),
          field('returns', $._basic_type),
          $._func_declarator,
          $.function_body),
        seq(
          $._storage_classes,
          field('name', $.identifier),
          $.func_declarator_suffix,
          $.function_body,
        )
      ),

    _func_declarator: $ =>
      seq(repeat($._type_suffix),
        field('name', $.identifier),
        $.func_declarator_suffix),

    func_declarator_suffix: $ =>
      choice(
        seq(
          $.parameters,
          optional($._member_function_attributes)),
        seq(
          $.template_parameters,
          $.parameters,
          optional($._member_function_attributes),
          optional($.constraint),
        ),
      ),

    //
    // Parameters
    //
    parameters: $ => paren(optional($._parameter_list)),

    _parameter_list: $ => prec.left(choice(
      $.parameter,
      seq($.parameter, ','),
      seq($.parameter, ',', $._parameter_list),
      seq(optional($._variadic_arguments_attributes), alias('...', $.ellipses)),
    )),

    ellipses: $ => '...',

    parameter: $ =>
      prec.left(seq(optional($.parameter_attributes),
        choice(
          seq($._basic_type, $.declarator, optional($.ellipses)),
          seq($._basic_type, $.declarator, '=', $._expr),
          seq($.type, optional($.ellipses)),
          seq($.type, '=', $._expr)
        ))),

    parameter_attributes: $ =>
      prec.left(repeat1(choice($.parameter_storage_class, $.at_attribute))),

    parameter_storage_class: $ => choice(
      'auto',

      $.type_ctor,
      'final',
      'in',
      'lazy',
      'out',
      'ref',
      'return',
      'scope'
    ),

    _variadic_arguments_attributes: $ =>
      repeat1($.variadic_arguments_attribute),

    variadic_arguments_attribute: $ =>
      choice('const', 'immutable', 'return', 'scope', 'shared'),

    //
    // Function Attributes
    //
    _function_attribute: $ => choice(
      $._function_attribute_kwd,
      $.at_attribute,
    ),

    _member_function_attributes: $ => repeat1($.member_function_attribute),

    member_function_attribute: $ => choice(
      'const',
      'immutable',
      'inout',
      'return',
      'scope',
      'shared',
      $._function_attribute,
    ),

    //
    // Function Body
    //
    function_body: $ =>
      choice(
        $._specified_function_body,
        $._shortened_function_body,
        $._missing_function_body,
      ),

    _specified_function_body: $ =>
      seq(repeat($._function_contract), optional('do'), $.block_statement),

    _shortened_function_body: $ =>
      seq(optional($._in_out_contract_expressions), '=>', $._expr, ';'),

    _missing_function_body: $ =>
      seq(repeat($._function_contract), ';'),

    //
    // Function Contracts
    //
    _function_contract: $ =>
      choice($._in_out_contract_expression, $._in_out_statement),

    _in_out_contract_expressions: $ =>
      repeat1($._in_out_contract_expression),

    _in_out_contract_expression: $ =>
      choice($.in_contract_expression, $.out_contract_expression),

    _in_out_statement: $ =>
      choice($.in_statement, $.out_statement),

    in_contract_expression: $ =>
      seq('in', paren($._assert_arguments)),

    out_contract_expression: $ =>
      seq('out', paren(optional($.identifier), ':', $._assert_arguments)),

    in_statement: $ =>
      seq('in', $.block_statement),

    out_statement: $ =>
      seq('out', optional(paren($.identifier)), $.block_statement),

    /**************************************************
     *
     * 3.14 TEMPLATES
     *
     */

    //
    // Template Declaration
    //
    template_declaration: $ =>
      seq('template',
        $.identifier,
        $.template_parameters,
        optional($.constraint),
        '{',
        repeat($._decldef),
        '}'),

    //
    // Template Instance
    //
    template_instance: $ =>
      prec.left(PREC.TEMPLATE_INSTANCE,
        seq($.identifier, $.template_arguments)),

    template_arguments: $ =>
      prec.left(PREC.TEMPLATE_INSTANCE, seq('!', choice(
        paren(optional($._template_argument_list)),
        $._template_single_arg))),

    template_argument: $ => choice($.type, $._expr),

    _template_argument_list: $ => commaSep1Comma($.template_argument),

    _template_single_arg: $ => choice(
      $.identifier,
      $.builtin_type,
      $.char_literal,
      $.string_literal,
      $.int_literal,
      $.float_literal,
      'true',
      'false',
      'null',
      'this',
      $.special_keyword,
    ),

    template_parameter: $ => choice(
      $._template_type_parameter,
      $._template_value_parameter,
      $._template_alias_parameter,
      $._template_sequence_parameter,
    ),

    template_parameters: $ => paren($._template_parameter_list),

    _template_parameter_list: $ => commaSep1Comma($.template_parameter),

    _template_type_parameter: $ =>
      seq(
        optional('this'), // covers TemplateThisParameter
        $.identifier,
        optional(seq(':', $.type)),
        optional(seq('=', $.type))
      ),

    _template_value_parameter: $ =>
      seq(
        $._basic_type,
        $.declarator,
        optional(seq(':', $._conditional_expression)),
        optional(seq('=', choice($._expr, $.special_keyword)))),

    _template_sequence_parameter: $ => seq($.identifier, '...'),

    //
    // Template Alias Parameter
    //
    _template_alias_parameter: $ =>
      choice(
        seq('alias',
          $.identifier,
          optional($._template_alias_parameter_specialization),
          optional($._template_alias_parameter_default)),
        seq('alias',
          $._basic_type,
          $.declarator,
          optional($._template_alias_parameter_specialization),
          optional($._template_alias_parameter_default))),

    _template_alias_parameter_specialization: $ =>
      choice(
        seq(':', $.type),
        seq(':', $._conditional_expression)),

    _template_alias_parameter_default: $ =>
      choice(
        seq('=', $.type),
        seq('=', $._conditional_expression)),

    //
    // Class/Interface/Struct/Union Template Declaration
    //
    class_template_declaration: $ =>
      seq('class', $.identifier, $.template_parameters, choice(
        ';',
        seq(
          optional($.constraint),
          optional($._base_class_list),
          $.aggregate_body),
        seq(
          optional($._base_class_list),
          optional($.constraint),
          $.aggregate_body),
      )),

    interface_template_declaration: $ =>
      seq('interface', $.identifier, $.template_parameters, choice(
        ';',
        seq(
          optional($.constraint),
          optional($._base_interface_list),
          alias($.aggregate_body, $.interface_body)),
        seq($._base_interface_list, $.constraint, $.aggregate_body),
      )),

    struct_template_declaration: $ =>
      seq('struct', $.identifier, $.template_parameters,
        choice(
          ';',
          seq(optional($.constraint), $.aggregate_body),
        )),

    union_template_declaration: $ =>
      seq('union', $.identifier, $.template_parameters, choice(
        ';',
        seq(optional($.constraint), $.aggregate_body),
      )),

    //
    // Constructor Template
    //
    constructor_template: $ =>
      seq(
        'this',
        $.template_parameters,
        $.parameters,
        optional($._member_function_attributes),
        optional($.constraint),
        choice($.function_body, ';')),

    //
    // Constraint
    //
    constraint: $ => seq('if', paren($._comma_expression)),

    /**************************************************
     *
     * 3.15 TEMPLATE MIXINS
     *
     */

    template_mixin_declaration: $ =>
      seq('mixin', 'template',
        $.identifier,
        $.template_parameters,
        optional($.constraint),
        '{',
        repeat1($._decldef),
        '}'),

    template_mixin: $ =>
      prec.left(seq(
        'mixin',
        $.mixin_template_name,
        ';')),

    mixin_template_name: $ =>
      seq(optional(seq(optional($.typeof), '.')), $._mixin_qualified_name),

    _mixin_qualified_name: $ =>
      prec.left(
        seq(
          choice($.identifier, $.template_instance),
          repeat($._mixin_qualified_name))),

    /**************************************************
     *
     * 3.16 CONDITIONAL COMPILATION
     *
     */

    conditional_declaration: $ =>
      prec.left(choice(
        seq($.condition, $._decl_block),
        seq($.condition, $._decl_block, 'else', $._decl_block),
        seq($.condition, ':', repeat($._decldef)),
        seq($.condition, $._decl_block, 'else', repeat($._decldef))
      )),

    conditional_statement: $ =>
      prec.left(
        seq(
          $.condition,
          $._scope_statement,
          optional(
            seq(
              'else',
              $._scope_statement)))),

    condition: $ => choice(
      $.version_condition, $.debug_condition, $.static_if_condition),

    version_condition: $ =>
      prec.left(
        seq(
          'version',
          '(',
          choice($.int_literal, $.identifier, 'unittest', 'assert'),
          ')')
      ),

    version_specification: $ =>
      seq('version', '=', choice($.int_literal, $.identifier), ';'),

    debug_condition: $ =>
      prec.left(
        seq('debug', optional(paren(choice($.int_literal, $.identifier))))),

    debug_specification: $ =>
      seq('debug', '=', choice($.int_literal, $.identifier), ';'),

    static_if_condition: $ =>
      seq('static', 'if', paren($._expr)),

    _static_foreach: $ => choice(
      seq('static', $._aggregate_foreach),
      seq('static', $._range_foreach)),

    static_foreach_declaration: $ =>
      prec.left(choice(
        seq($._static_foreach, $._decl_block),
        seq($._static_foreach, ':', repeat($._decldef)))),

    static_foreach_statement: $ =>
      seq($._static_foreach, $._scope_statement),

    static_assert: $ =>
      seq('static', 'assert', paren($._assert_arguments), ';'),

    /**************************************************
     *
     * 3.17 TRAITS
     *
     */
    traits_expression: $ => seq('__traits', $.traits_keyword, $.traits_arguments),
    traits_arguments: $ =>
      prec.left(commaSep1(choice($._expr, $.type))),
    traits_keyword: $ =>
      choice(
        'isAbstractClass',
        'isArithmetic',
        'isAssociativeArray',
        'isFinalClass',
        'isPOD',
        'isNested',
        'isFuture',
        'isDeprecated',
        'isFloating',
        'isIntegral',
        'isScalar',
        'isStaticArray',
        'isUnsigned',
        'isDisabled',
        'isVirtualFunction',
        'isVirtualMethod',
        'isAbstractFunction',
        'isFinalFunction',
        'isStaticFunction',
        'isOverrideFunction',
        'isTemplate',
        'isRef',
        'isOut',
        'isLazy',
        'isReturnOnStack',
        'isCopyable',
        'isZeroInit',
        'isModule',
        'isPackage',
        'hasMember',
        'hasCopyConstructor',
        'hasPostblit',
        'identifier',
        'getAliasThis',
        'getAttributes',
        'getFunctionAttributes',
        'getFunctionVariadicStyle',
        'getLinkage',
        'getLocation',
        'getMember',
        'getOverloads',
        'getParameterStorageClasses',
        'getPointerBitmap',
        'getCppNamespaces',
        'getVisibility',
        'getProtection',
        'getTargetInfo',
        'getVirtualFunctions',
        'getVirtualMethods',
        'getUnitTests',
        'parent',
        'child',
        'classInstanceSize',
        'classInstanceAlignment',
        'getVirtualIndex',
        'allMembers',
        'derivedMembers',
        'isSame',
        'compiles',
        'toType',
        'initSymbol',
        'parameters',
      ),

    /**************************************************
     *
     * 3.18 UNIT TESTS
     *
     */
    unittest: $ => seq('unittest', $.block_statement),

    /**************************************************
     *
     * 3.19 D X86 INLINE ASSEMBLER - this grammar does not validate fully
     *
     */
    _asm_instruction_list: $ =>
      seq($.asm_instruction, ';', optional($._asm_instruction_list)),

    asm_instruction: $ =>
      choice(
        seq($.identifier, ':', $.asm_instruction), // label
        seq('align', choice($.identifier, $.int_literal)),
        'even',
        'naked',
        seq(choice('db', 'ds', 'di', 'dl', 'df', 'dd', 'de'), commaSep($.operand)),
        seq(choice('db', 'ds', 'di', 'dl', 'dw', 'dq'), $.string_literal),
        seq($.opcode, commaSep($.operand))),

    operand: $ =>
      choice(
        prec.left(PREC.LOGICAL_OR, seq($.operand, '||', $.operand)),
        prec.left(PREC.LOGICAL_AND, seq($.operand, '&&', $.operand)),
        prec.left(PREC.INCLUSIVE_OR, seq($.operand, '|', $.operand)),
        prec.left(PREC.INCLUSIVE_OR, seq($.operand, '|', $.operand)),
        prec.left(PREC.EXCLUSIVE_OR, seq($.operand, '^', $.operand)),
        prec.left(PREC.EQUAL, seq($.operand, '==', $.operand)),
        prec.left(PREC.RELATIONAL, seq($.operand, '<', $.operand)),
        prec.left(PREC.RELATIONAL, seq($.operand, '<=', $.operand)),
        prec.left(PREC.RELATIONAL, seq($.operand, '>', $.operand)),
        prec.left(PREC.RELATIONAL, seq($.operand, '>=', $.operand)),
        prec.left(PREC.SHIFT, seq($.operand, '<<', $.operand)),
        prec.left(PREC.SHIFT, seq($.operand, '>>', $.operand)),
        prec.left(PREC.SHIFT, seq($.operand, '>>>', $.operand)),
        prec.left(PREC.ADD, seq($.operand, '+', $.operand)),
        prec.left(PREC.ADD, seq($.operand, '-', $.operand)),
        prec.left(PREC.MULTIPLY, seq($.operand, '*', $.operand)),
        prec.left(PREC.MULTIPLY, seq($.operand, '/', $.operand)),
        prec.left(PREC.MULTIPLY, seq($.operand, '%', $.operand)),
        prec.left(PREC.SUBSCRIPT, seq($.operand, '[', $.operand, ']')),
        prec.left(PREC.UNARY, seq($._asm_type_prefix, 'ptr', $.operand)),
        prec.left(PREC.UNARY, seq('offsetof', $.operand)),
        prec.left(PREC.UNARY, seq('seg', $.operand)),
        prec.left(PREC.UNARY, seq('+', $.operand)),
        prec.left(PREC.UNARY, seq('-', $.operand)),
        prec.left(PREC.UNARY, seq('!', $.operand)),
        prec.left(PREC.UNARY, seq('~', $.operand)),
        $._asm_primary),

    opcode: $ => choice($.identifier, 'int', 'in', 'out'),

    _asm_type_prefix: $ =>
      choice('near', 'far', 'word', 'dword', 'qword', $.builtin_type),
    _asm_primary: $ => choice(
      $.int_literal,
      $.float_literal,
      $._dot_identifier, // also stands in for registers for now
      '__LOCAL_SIZE',
      '$',
      'this',
    ),

    _dot_identifier: $ =>
      choice(
        $.identifier,
        seq($.identifier, '.', $._dot_identifier),
        seq($.builtin_type, '.', $.identifier),
      ),
  },

  // It is unfortunate, but many constructs in D require look-ahead
  // to resolve conflicts.
  conflicts: $ => [
    [$.type_ctor, $.cast_qualifier],
    [$.storage_class, $._attribute],
    [$._initializer, $._kv_pair],
    [$.variadic_arguments_attribute, $.parameter_storage_class],
    [$._shortened_function_body, $._function_contract],
    [$.block_statement, $.aggregate_initializer],
    [$._range_foreach, $._foreach_type_list],
    [$.storage_class, $.enum_declaration],
    [$.storage_class, $.synchronized_statement],
    [$.storage_class, $.linkage_attribute],
    [$._arg_list, $._comma_expression],
    [$.ref_auto_ref, $.storage_class],
    [$.ref_auto_ref, $.parameter_storage_class],
    [$.deprecated_attribute, $.storage_class],
    [$.parameter_storage_class, $.type],
    [$.type_ctor, $.variadic_arguments_attribute],
    [$.type_ctor, $.storage_class],
    [$.type, $._conditional_expression, $.parameter_storage_class],
    [$.function_literal, $._scope_statement],
    [$.function_literal, $._no_scope_statement],
    [$.function_literal, $.default_statement],
    [$.function_literal, $.scope_guard_statement],
    [$.type, $._expr],
    [$.type, $._conditional_expression],
    [$.postblit, $._missing_function_body],
    [$.storage_class, $._attribute, $.constructor, $.destructor],
    [$.constructor, $._missing_function_body],
    [$.destructor, $._missing_function_body],
    [$.var_declarator, $._func_declarator],
    [$.parameter, $._template_value_parameter],
    [$._expr, $._template_value_parameter],
    [$._left_expression, $._template_value_parameter],
    [$._left_expression, $._template_alias_parameter_specialization],
    [$.qualified_identifier, $._conditional_expression],
    [$.qualified_identifier, $._template_type_parameter],
    [$._missing_function_body, $.constructor_template],
    [$._primary_expression, $.template_instance],
    [$.type, $.construct_expression, $.parameter_storage_class],
    [$.qualified_identifier, $._primary_expression, $.template_instance],
    [$.field_expression, $._primary_expression, $.template_instance],
    [$._decl_block, $.conditional_declaration],
    [$._initializer, $.builtin_type],
    [$._foreach_type, $.type],
  ],
})

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)))
}

// commaSep1Comma is like commaSep1, but allows for an optional trailing comment
function commaSep1Comma(rule) {
  return seq(rule, repeat(seq(',', rule)), optional(','))
}

function commaSep(rule) {
  return optional(commaSep1(rule))
}

// paren acts like seq, but encloses in parentheses.
function paren(...rules) {
  return seq('(', ...rules, ')')
}
