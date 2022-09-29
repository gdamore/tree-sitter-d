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
        module_declaration: $ => seq(
            repeat($._module_attribute),
            'module',
            field('name', $.module_fqn),
            ';'),

        _module_attribute: $ => choice(
            $.deprecated_attribute,
            $.user_defined_attribute,
        ),

        module_fqn: $ =>
            seq(
                field('package', repeat(seq($.identifier, '.'))),
                field('name', $.identifier)),

        //
        // Import Declarations
        //
        import_declaration: $ =>
            seq(optional('static'), 'import', $._import_list, ';'),

        _import_list: $ => choice(
            seq($.import, optional(seq(',', $._import_list))),
            $._import_bindings,
        ),

        import: $ => choice(
            $.module_fqn,
            seq(field('alias', $.identifier), '=', $.module_fqn),
        ),

        _import_bindings: $ => seq($.import, ':', $._import_bind_list),

        _import_bind_list: $ => commaSep1($.import_bind),

        import_bind: $ => seq($.identifier, optional(seq('=', $.identifier))),

        //
        // Mixin Declaration
        //
        mixin_declaration: $ => seq('mixin', '(', $._arg_list, ')', ';'),


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

        _declarators: $ => choice(
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

        _declarator: $ => $.var_declarator,

        //
        // Storage Classes
        //
        storage_class: $ =>
            choice(
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
            ),

        _storage_classes: $ => repeat1($.storage_class),

        //
        // Initializers
        //
        _initializer: $ => choice(
            $._assign_expr,
            $._struct_initializer,
            'void',
            // $.array_literal is already covered under _expression
        ),

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
            seq(repeat($.type_ctor), $._basic_type, repeat($._type_suffix)),


        type_ctor: $ => choice('const', 'immutable', 'inout', 'shared'),

        _basic_type: $ =>
            choice(
                $.scalar,
                seq('.', $.qualified_identifier),
                $.qualified_identifier,
                $.typeof,
                seq($.typeof, '.', $.qualified_identifier),
                seq($.type_ctor, '(', $.type, ')'),
                $._vector,
                // TODO: $.traits_expression,
                $.mixin_type,
            ),

        // grammar document misses these, but they are built in aliass
        // for other types.
        type_alias: $ => choice('string', 'size_t', 'ptrdiff_t', 'noreturn'),

        _vector: $ => seq('__vector', '(', $.type, ')'),

        scalar: $ => choice( // aka fundamental type
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
                seq('[', $._assign_expr, ']'),
                seq('[', $._assign_expr, '..', $._assign_expr, ']'),
                seq('[', $.type, ']'),
                seq('delegate', $.parameters, optional($._member_function_attributes)),
                seq('function', $.parameters, repeat($._function_attribute)),
            )),

        qualified_identifier: $ => $._qualified_id,
        _qualified_id: $ =>
            choice(
                $.identifier,
                $.template_instance,
                seq($.identifier, '.', $._qualified_id),
                seq($.template_instance, ',', $._qualified_id),
                seq($.identifier, '[', $._assign_expr, ']'),
                seq($.identifier, '[', $._assign_expr, ']', '.', $._qualified_id)
            ),

        //
        // Typeof
        //
        typeof: $ =>
            choice(
                seq('typeof', '(', $.expression, ')'),
                seq('typeof', '(', 'return', ')')
            ),

        mixin_type: $ => seq('mixin', '(', $._arg_list, ')'),

        //
        // 3.5 ATTRIBUTES
        //

        align_attribute: $ =>
            seq('align', optional(seq('(', $.expression, ')'))),

        deprecated_attribute: $ =>
            seq('deprecated', optional(seq('(', $.expression, ')'))),

        visibility_attribute: $ =>
            choice(
                'private',
                'package',
                seq('package', '(', $.qualified_identifier, ')'),
                'protected',
                'public',
                'export',
            ),

        user_defined_attribute: $ =>
            choice(
                seq('@', '(', optional(field('arguments', $._arg_list)), ')'),
                seq('@', field('name', $.identifier)),
                seq('@',
                    field('name', $.identifier),
                    '(',
                    optional(field('arguments', $._arg_list)),
                    ')'),
                seq('@', field('template', $.template_instance)),
                seq('@',
                    field('template', $.template_instance),
                    '(',
                    optional(field('arguments', $._arg_list)),
                    ')')
            ),

        attribute_specifier: $ =>
            seq($._attribute, choice(':', $._decl_block)),

        _attribute: $ =>
            choice(
                $.linkage_attribute,
                $.align_attribute,
                $.deprecated_attribute,
                $.visibility_attribute,
                $.pragma,
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
            ),

        at_attribute: $ =>
            choice(
                seq('@', 'disable'),
                seq('@', 'nogc'),
                seq('@', 'live'),
                seq('@', 'property'),
                seq('@', 'safe'),
                seq('@', 'system'),
                seq('@', 'trusted'),
                $.user_defined_attribute,
            ),

        _function_attribute_kwd: $ => choice('nothrow', 'pure'),

        linkage_attribute: $ => seq('extern',
            '(',
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
                seq("C++", ',', 'struct')),
            ')'),

        _namespace_list: $ => commaSep1Comma($._conditional_expr),

        _decl_block: $ =>
            choice(
                $._decldef,
                seq('{', repeat($._decldef), '}')),

        _arg_list: $ => commaSep1Comma($._assign_expr),

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
                seq('pragma', '(', $.identifier, ')'),
                seq('pragma', '(', $.identifier, ',', $._arg_list, ')'),
            ),


        //
        // 3.7 EXPRESSIONS
        //

        expression: $ => $._comma_expr,
        _comma_expr: $ => prec.left(choice($._assign_expr, $.comma_expression)),
        comma_expression: $ =>
            prec.left(seq($._assign_expr, repeat1(seq(',', $._assign_expr)))),

        _assign_expr: $ =>
            prec.right(choice($.assignment_expression, $._conditional_expr)),

        assignment_expression: $ =>
            choice(
                binary_operation($._conditional_expr, '=', $._assign_expr),
                binary_operation($._conditional_expr, '+=', $._assign_expr),
                binary_operation($._conditional_expr, '-=', $._assign_expr),
                binary_operation($._conditional_expr, '*=', $._assign_expr),
                binary_operation($._conditional_expr, '/=', $._assign_expr),
                binary_operation($._conditional_expr, '%=', $._assign_expr),
                binary_operation($._conditional_expr, '&=', $._assign_expr),
                binary_operation($._conditional_expr, '|=', $._assign_expr),
                binary_operation($._conditional_expr, '^=', $._assign_expr),
                binary_operation($._conditional_expr, '~=', $._assign_expr),
                binary_operation($._conditional_expr, '<<=', $._assign_expr),
                binary_operation($._conditional_expr, '>>=', $._assign_expr),
                binary_operation($._conditional_expr, '>>>=', $._assign_expr),
                binary_operation($._conditional_expr, '^^=', $._assign_expr),
            ),

        _conditional_expr: $ => prec.left(choice($._or_or_expr, $.ternary_expression)),
        ternary_expression: $ =>
            seq(
                field('condition', $._or_or_expr),
                '?',
                field('consequence', $._comma_expr),
                ':',
                field('alternative', $._conditional_expr)),

        _or_or_expr: $ => prec.left(choice($.logical_or_expression, $._and_and_expr)),
        logical_or_expression: $ =>
            prec.left(binary_operation($._or_or_expr, '||', $._and_and_expr)),

        _and_and_expr: $ => prec.left(choice($._or_expr, $.logical_and_expression)),
        logical_and_expression: $ =>
            prec.left(binary_operation($._and_and_expr, '&&', $._or_expr)),

        _or_expr: $ => prec.left(choice($.inclusive_or_expression, $._xor_expr)),
        inclusive_or_expression: $ =>
            prec.left(binary_operation($._or_expr, '|', $._xor_expr)),

        _xor_expr: $ => prec.left(choice($._and_expr, $.exclusive_or_expression)),
        exclusive_or_expression: $ =>
            prec.left(binary_operation($._xor_expr, '^', $._and_expr)),

        _and_expr: $ => choice($.bitwise_and_expression, $._cmp_expr),
        bitwise_and_expression: $ => binary_operation($._and_expr, '&', $._cmp_expr),

        _cmp_expr: $ =>
            prec.left(choice(
                $.equal_expression,
                $.identity_expression,
                $.rel_expression,
                $.in_expression,
                $._shift_expr,
            )),

        equal_expression: $ =>
            prec.left(choice(
                binary_operation($._shift_expr, '==', $._shift_expr),
                binary_operation($._shift_expr, '!=', $._shift_expr))),

        identity_expression: $ =>
            prec.left(choice(
                binary_operation($._shift_expr, 'is', $._shift_expr),
                binary_operation($._shift_expr, seq('!', 'is'), $._shift_expr))),

        rel_expression: $ =>
            prec.left(choice(
                binary_operation($._shift_expr, '<', $._shift_expr),
                binary_operation($._shift_expr, '<=', $._shift_expr),
                binary_operation($._shift_expr, '>', $._shift_expr),
                binary_operation($._shift_expr, '>=', $._shift_expr),
            )),

        in_expression: $ =>
            prec.left(choice(
                binary_operation($._shift_expr, 'in', $._shift_expr),
                binary_operation($._shift_expr, seq('!', 'in'), $._shift_expr))),

        _shift_expr: $ => prec.left(choice($.shift_expression, $._add_expr)),
        shift_expression: $ =>
            prec.left(choice(
                binary_operation($._shift_expr, '<<', $._add_expr),
                binary_operation($._shift_expr, '>>', $._add_expr),
                binary_operation($._shift_expr, '>>>', $._add_expr),
            )),

        _add_expr: $ =>
            prec.left(choice($.add_expression, $._mul_expr, $.cat_expression)),
        add_expression: $ =>
            prec.left(choice(
                binary_operation($._add_expr, '+', $._mul_expr),
                binary_operation($._add_expr, '-', $._mul_expr))),
        cat_expression: $ =>
            prec.left(binary_operation($._add_expr, '~', $._mul_expr)),

        _mul_expr: $ => choice($.mul_expression, $._unary_expr),
        mul_expression: $ =>
            prec.left(choice(
                binary_operation($._mul_expr, '*', $._unary_expr),
                binary_operation($._mul_expr, '/', $._unary_expr),
                binary_operation($._mul_expr, '%', $._unary_expr),
            )),

        _unary_expr: $ =>
            choice(
                $.unary_expression,
                $.complement_expression,
                $.delete_expression,
                $.throw_expression,
                $._cast_expr,
                $._pow_expr,
            ),
        unary_expression: $ =>
            choice(
                unary_operation('&', $._unary_expr),
                unary_operation('++', $._unary_expr),
                unary_operation('*', $._unary_expr),
                unary_operation('-', $._unary_expr),
                unary_operation('+', $._unary_expr),
                unary_operation('!', $._unary_expr),
            ),
        complement_expression: $ => unary_operation('~', $._unary_expr),
        delete_expression: $ => seq('delete', field('operand', $._unary_expr)),
        throw_expression: $ => seq('throw', field('operand', $._assign_expr)),

        _cast_expr: $ => choice($.cast_expression, $.cast_qual),
        cast_expression: $ => seq('cast', '(', $.type, ')', $._unary_expr),
        cast_qual: $ => seq('cast', '(', repeat($.type_ctor), ')', $._unary_expr),

        _pow_expr: $ => prec.right(choice($._postfix_expr, $.pow_expression)),
        pow_expression: $ => binary_operation($._postfix_expr, '^^', $._unary_expr),

        _postfix_expr: $ =>
            choice(
                $._primary_expr,
                $._dot_expr,
                $.postfix_expression,
                $.call_expression,
                $.construct_expression,
                $.index_expression,
                $.slice_expression,
            ),
        postfix_expression: $ =>
            choice(
                seq(field('operand', $._postfix_expr), field('operator', '++')),
                seq(field('operand', $._postfix_expr), field('operator', '--')),
            ),

        _dot_expr: $ =>
            choice(
                seq($._postfix_expr, '.', $.identifier),
                seq($._postfix_expr, '.', $.template_instance),
                seq($._postfix_expr, '.', $.new_expression),
            ),

        call_expression: $ =>
            seq(
                field('function', $._postfix_expr),
                '(',
                optional(field('arguments', $._arg_list)),
                ')'),

        construct_expression: $ =>
            seq(
                repeat($.type_ctor),
                field('type', $._basic_type),
                '(',
                optional(field('arguments', $._arg_list)), ')'),

        index_expression: $ =>
            seq(field('array', $._postfix_expr), '[', field('index', $._arg_list), ']'),

        slice_expression: $ =>
            choice(
                seq(field('slice', $._postfix_expr), '[', ']'),
                seq(
                    field('slice', $._postfix_expr),
                    '[',
                    field('index', $._slice),
                    optional(','),
                    ']'),
            ),
        _slice: $ =>
            prec.right(choice(
                $._assign_expr,
                seq($._assign_expr, ',', $._slice),
                seq($._assign_expr, '..', $._assign_expr),
                seq($._assign_expr, '..', $._assign_expr, ',', $._slice),
            )),

        _primary_expr: $ =>
            choice(
                $.identifier,
                seq('.', $.identifier),
                $.template_instance,
                seq('.', $.template_instance),
                'this',
                'super',
                'null',
                'true',
                'false',
                '$',
                $.int_literal,
                $.float_literal,
                $.char_literal,
                $._string_literals,
                $.array_literal,
                $.assoc_array_literal,
                $.function_literal,
                $.assert_expression,
                $.mixin_expression,
                $.import_expression,
                $.new_expression,
                $.property_expression,
                $.scalar_construct,
                $.typeof,
                $.typeid_expression,
                $.is_expression,
                $.paren_expression,
                $._ctor_construct,
                $.special_keyword,
                // TODO: $.traits_exprsesion,
            ),

        property_expression: $ =>
            choice(
                seq($.scalar, '.', $.identifier),
                seq('(', $.type, ')', '.', $.identifier),
                seq('(', $.type, ')', '.', $.template_instance),
                seq($.type_ctor, '(', $.type, ')', $.identifier),
            ),

        _ctor_construct: $ => // alias this to construct_expression?
            seq(
                $.type_ctor,
                '(',
                $.type,
                ')',
                '(',
                optional(field('arguments', $._arg_list)),
                ')'),

        scalar_construct: $ => seq($.scalar, '(', $._arg_list, ')'),
        paren_expression: $ => seq('(', $.expression, ')'),

        _string_literals: $ => repeat1($.string_literal),

        assert_expression: $ => seq('assert', '(', $._assert_arguments, ')'),
        _assert_arguments: $ => commaSep1Comma($._assign_expr),

        mixin_expression: $ => seq('mixin', '(', $._arg_list, ')'),

        import_expression: $ => seq('import', '(', $._assign_expr, ')'),

        new_expression: $ =>
            choice(
                seq('new', $.type),
                seq('new', $.type, '[', $._assign_expr, ']'),
                seq('new', $.type, '(', optional($._arg_list), ')'),
                $.new_anon_class_expression,
            ),

        typeid_expression: $ =>
            choice(
                seq('typeid', '(', $.type, ')'),
                seq('typeid', '(', $.expression, ')')
            ),

        is_expression: $ =>
            choice(
                seq('is', '(', $.type, ')'),
                seq('is', '(', $.type, '==', $.type_specialization, ')'),
                seq('is', '(', $.type, ':', $.type_specialization, ')'),
                seq('is', '(', $.type, '==', $.type_specialization, ',', $._template_parameter_list, ')'),
                seq('is', '(', $.type, ':', $.type_specialization, ',', $._template_parameter_list, ')'),
                seq('is', '(', $.type, $.identifier, ')'),
                seq('is', '(', $.type, $.identifier, '==', $.type_specialization, ')'),
                seq('is', '(', $.type, $.identifier, ':', $.type_specialization, ')'),
                seq('is', '(', $.type, $.identifier, '==', $.type_specialization, ',', $._template_parameter_list, ')'),
                seq('is', '(', $.type, $.identifier, ':', $.type_specialization, ',', $._template_parameter_list, ')'),
            ),

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

        array_literal: $ => seq('[', optional($._array_member_inits), ']'),

        _array_member_inits: $ =>
            choice(
                $._array_member_init,
                seq($._array_member_init, ','),
                seq($._array_member_init, ',', $._array_member_inits),
            ),

        _array_member_init: $ => choice(
            field('value', $._initializer),
            seq(field('key', $._assign_expr), ':', field('value', $._initializer)),
        ),

        assoc_array_literal: $ => seq('[', commaSep1($.kv_pair), ']'),

        kv_pair: $ =>
            seq(field('key', $._assign_expr), ':', field('value', $._assign_expr)),

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
                seq($.identifier, '=>', $._assign_expr),
            ),

        _parameter_with_attributes: $ =>
            seq($.parameters, repeat($._function_attribute)),

        _parameter_with_member_attributes: $ =>
            seq($.parameters, optional($._member_function_attributes)),

        ref_auto_ref: $ => seq(optional('auto'), 'ref'),

        _func_literal_body2: $ => choice(
            seq('=>', $._assign_expr),
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
            $.block_statement,
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
                $.block_statement,
                $._non_empty_statement,
            ),

        _non_empty_statement_no_case_no_default: $ =>
            choice(
                $._labeled_statement,
                $.expression_statement,
                $.declaration_statement,
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

        _labeled_statement: $ => seq($.identifier, ':', optional($._statement)),

        block_statement: $ => seq('{', repeat($._statement), '}'),

        expression_statement: $ => seq($.expression, ';'),

        // declaration_statement is special because it easily conflicts with
        // other kinds of statements.
        declaration_statement: $ =>
            seq(optional($._storage_classes), $._declaration),

        if_statement: $ =>
            prec.right(seq('if',
                '(',
                field('condition', $._if_condition),
                ')',
                field('then', $._scope_statement),
                optional(seq('else', field('else', $._scope_statement))))),

        _if_condition: $ => choice(
            $.expression,
            seq('auto', $.identifier, '=', $.expression),
            seq('scope', $.identifier, '=', $.expression),
            seq(repeat1($.type_ctor), $.identifier, '=', $.expression),
            seq(repeat($.type_ctor), $._basic_type, $._declarator, '=', $.expression),
        ),

        while_statement: $ => seq(
            'while',
            '(',
            field('condition', $._if_condition),
            ')',
            field('do', $._scope_statement)
        ),

        do_statement: $ => seq(
            'do',
            field('do', $._scope_statement),
            'while',
            '(',
            field('condition', $.expression),
            ')',
        ),

        //
        // For Statement
        //
        for_statement: $ =>
            seq(
                'for',
                '(',
                $.initialize,
                optional($.test),
                ';',
                optional($.increment),
                ')',
                $._scope_statement),


        initialize: $ => choice(';', $._scope_statement),

        test: $ => $.expression,

        increment: $ => $.expression,

        //
        // Foreach Statement
        //

        foreach_statement: $ =>
            seq($._aggregate_foreach, $._scope_statement),

        _foreach: $ => choice('foreach', 'foreach_reverse'),

        _foreach_type_list: $ => commaSep1($._foreach_type),

        _foreach_type: $ =>
            choice(
                seq(repeat($._foreach_type_attribute), $._basic_type, $._declarator),
                seq(repeat($._foreach_type_attribute), $.identifier),
                seq(repeat($._foreach_type_attribute), 'alias', $.identifier)
            ),

        _aggregate_foreach: $ =>
            seq($._foreach, '(', $._foreach_type_list, ';', $.expression, ')'),


        _foreach_type_attribute: $ => choice('enum', 'ref', 'scope', $.type_ctor),

        //
        // Foreach Range Statement
        //
        foreach_range_statement: $ => seq($._range_foreach, $._scope_statement),

        _range_foreach: $ =>
            seq(
                $._foreach,
                '(',
                field('iterator', $._foreach_type),
                ';',
                field('start', $.expression),
                '..',
                field('end', $.expression),
                ')'
            ),

        //
        // Switch Statement
        //

        switch_statement: $ =>
            seq('switch', '(', $.expression, ')', $._scope_statement),

        case_statement: $ =>
            prec.left(seq('case', $._arg_list, ':', optional($._scope_statement_list))),

        case_range_statement: $ =>
            prec.left(seq('case', $.expression,
                ':',
                '..',
                'case',
                $.expression,
                optional($._scope_statement_list))),

        default_statement: $ =>
            prec.left(seq('default', ':', optional($._scope_statement_list))),

        _scope_statement_list: $ =>
            repeat1(choice(
                $.empty_statement,
                $._non_empty_statement_no_case_no_default,
                $.block_statement)),

        final_switch_statement: $ =>
            seq('final', 'switch', '(', $.expression, ')', $._scope_statement),

        continue_statement: $ => seq('continue', optional($.identifier), ';'),

        break_statement: $ => seq('break', optional($.identifier), ';'),

        return_statement: $ => seq('return', optional($.expression), ';'),

        goto_statement: $ => choice(
            seq('goto', $.identifier, ';'),
            seq('goto', 'default', ';'),
            seq('goto', 'case', ';'),
            seq('goto', 'case', $.expression, ';')
        ),

        with_statement: $ =>
            seq('with',
                '(',
                choice(
                    $.expression,
                    $.template_instance,
                    $.symbol,
                ),
                ')',
                $._scope_statement),

        synchronized_statement: $ =>
            choice(
                seq('synchronized', $._scope_statement),
                seq('synchronized', '(', $.expression, ')', $._scope_statement),
            ),

        //
        // Try Statement
        //
        try_statement: $ =>
            seq('try', $._scope_statement, repeat($.catch), optional($.finally)),

        catch: $ =>
            seq(
                'catch',
                '(',
                $._basic_type,
                optional($.identifier),
                ')',
                $._scope_statement),

        finally: $ => seq('finally', $._scope_statement),


        //
        // Scope Guard Statement
        //
        scope_guard_statement: $ =>
            seq('scope',
                '(',
                choice('exit', 'success', 'failure'),
                ')',
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
            seq('mixin', '(', $._arg_list, ')', ';'),

        /**************************************************
         *
         * 3.9 STRUCTS AND UNIONS
         *
         */

        struct_declaration: $ =>
            choice(
                seq('struct', $.identifier, ';'),
                seq('struct', $.identifier, $._aggregate_body),
                seq('struct', $._aggregate_body), // anonymous struct
                $.struct_template_declaration,
            ),

        // AnonStructDeclaration inlined above

        union_declaration: $ =>
            choice(
                seq('union', $.identifier, ';'),
                seq('union', $.identifier, $._aggregate_body),
                seq('union', $._aggregate_body), // anonymous union
                $.union_template_declaration,
            ),

        // AnonUnionDeclaration inlined above

        _aggregate_body: $ => seq('{', repeat($._decldef), '}'),

        //
        // Struct Initializer
        //
        _struct_initializer: $ => seq('{', optional($._struct_member_initializers), '}'),

        _struct_member_initializers: $ =>
            seq(commaSep1Comma($._struct_member_initializer)),

        _struct_member_initializer: $ =>
            seq(optional(seq($.identifier, ':')), $._initializer),

        //
        // Postblit
        //
        postblit: $ =>
            seq(
                'this', '(', 'this', ')',
                optional($._member_function_attributes),
                choice($.function_body, ';'),
            ),

        //
        // Invariant
        //
        invariant: $ =>
            choice(
                seq('invariant', '(', ')', $.block_statement),
                seq('invariant', $.block_statement),
                seq('invariant', '(', $._assert_arguments, ')', ';')
            ),

        /**************************************************
         *
         * 3.10 CLASSES
         *
         */

        class_declaration: $ =>
            choice(
                seq('class', $.identifier, ';'),
                seq('class', $.identifier, optional($._base_class_list), $._aggregate_body),
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
                seq(optional('shared'), 'static', 'this', '(', ')',
                    optional($._member_function_attributes),
                    choice($.function_body, ';')),
                $.constructor_template,
            ),

        destructor: $ =>
            choice(
                seq('~', 'this', '(', ')',
                    optional($._member_function_attributes), $.function_body),
                seq(optional('shared'), 'static', '~', 'this', '(', ')',
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
                '(',
                optional($._arg_list),
                ')',
                optional($._anon_base_class_list),
                $._aggregate_body),

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
                seq(
                    'interface',
                    $.identifier,
                    optional($._base_interface_list), $._aggregate_body),
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

        _enum_body: $ =>
            choice(
                seq('{', $._enum_members, '}'),
                ';'),
        _enum_members: $ => commaSep1Comma($.enum_member),

        _enum_member_attribute: $ =>
            choice(
                $.deprecated_attribute,
                $.user_defined_attribute,
                seq('@', 'disable'),
            ),

        enum_member: $ =>
            seq(
                repeat($._enum_member_attribute),
                $.identifier,
                optional(seq('=', $.expression))
            ),

        _anonymous_enum_member: $ => choice(
            $.enum_member,
            seq($.type, '=', $.expression),
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
                    $._func_declarator_suffix,
                    $.function_body,
                )
            ),

        _func_declarator: $ =>
            seq(repeat($._type_suffix),
                field('name', $.identifier),
                $._func_declarator_suffix),

        _func_declarator_suffix: $ =>
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
        parameters: $ => seq('(', optional($._parameter_list), ')'),

        _parameter_list: $ => prec.left(choice(
            $.parameter,
            seq($.parameter, ','),
            seq($.parameter, ',', $._parameter_list),
            seq(optional($._variadic_arguments_attributes), alias('...', $.ellipses)),
        )),

        ellipses: $ => '...',

        parameter: $ =>
            seq(optional($.parameter_attributes),
                choice(
                    seq($._basic_type, $._declarator, optional($.ellipses)),
                    seq($._basic_type, $._declarator, '=', $.expression),
                    seq($.type, optional($.ellipses)),
                    seq($.type, '=', $._assign_expr)
                )),

        parameter_attributes: $ =>
            repeat1(choice($.parameter_storage_class, $.user_defined_attribute)),

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
            seq(optional($._in_out_contract_expressions), '=>', $.expression, ';'),

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
            seq('in', '(', $._assert_arguments, ')'),

        out_contract_expression: $ =>
            seq('out', '(', optional($.identifier), ':', $._assert_arguments, ')'),

        in_statement: $ =>
            seq('in', $.block_statement),

        out_statement: $ =>
            seq('out', optional(seq('(', $.identifier, ')')), $.block_statement),

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

        template_parameters: $ => seq('(', optional($._template_parameter_list), ')'),

        _template_parameter_list: $ => commaSep1Comma($.template_parameter),


        //
        // Template Instance
        //
        template_instance: $ => seq($.identifier, $.template_arguments),

        template_arguments: $ =>
            choice(
                seq('!', '(', optional($._template_argument_list), ')'),
                seq('!', $._template_single_arg)
            ),

        _template_argument_list: $ => commaSep1Comma($.template_argument),

        template_argument: $ => choice($.type, $._assign_expr, $.symbol),

        symbol: $ =>
            choice(
                $._symbol_tail,
                seq('.', $._symbol_tail),
            ),

        _symbol_tail: $ =>
            choice(
                $.identifier,
                seq($.identifier, '.', $._symbol_tail),
                $.template_instance,
                seq($.template_instance, '.', $._symbol_tail),
            ),

        _template_single_arg: $ =>
            choice(
                $.identifier,
                $.scalar,
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

        template_parameter: $ =>
            choice(
                $._template_type_parameter,
                $._template_value_parameter,
                $._template_alias_parameter,
                $._template_sequence_parameter,
            ),

        _template_type_parameter: $ =>
            seq(
                optional('this'), // covers TemplateThisParameter
                $.identifier,
                optional(seq(':', $.type)),
                optional(seq('=', $.type))
            ),

        _template_value_parameter: $ =>
            prec.left(seq(
                $._basic_type,
                $._declarator,
                optional(seq(':', $._conditional_expr)),
                optional(seq('=', choice($._assign_expr, $.special_keyword))))),

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
                    $._declarator,
                    optional($._template_alias_parameter_specialization),
                    optional($._template_alias_parameter_default))),

        _template_alias_parameter_specialization: $ =>
            choice(
                seq(':', $.type),
                seq(':', $._conditional_expr)),

        _template_alias_parameter_default: $ =>
            choice(
                seq('=', $.type),
                seq('=', $._conditional_expr)),

        _template_sequence_parameter: $ => seq($.identifier, '...'),

        //
        // Class/Interface/Struct/Union Template Declaration
        //
        class_template_declaration: $ =>
            seq('class', $.identifier, $.template_parameters, choice(
                ';',
                seq(
                    optional($.constraint),
                    optional($._base_class_list),
                    $._aggregate_body),
                seq(
                    optional($._base_class_list),
                    optional($.constraint),
                    $._aggregate_body),
            )),

        interface_template_declaration: $ =>
            seq('interface', $.identifier, $.template_parameters, choice(
                ';',
                seq(
                    optional($.constraint),
                    optional($._base_interface_list),
                    $._aggregate_body),
                seq($._base_interface_list, $.constraint, $._aggregate_body),
            )),

        struct_template_declaration: $ =>
            seq('struct', $.identifier, $.template_parameters, choice(
                ';',
                seq(optional($.constraint), $._aggregate_body)
            )),

        union_template_declaration: $ =>
            seq('union', $.identifier, $.template_parameters, choice(
                ';',
                seq(optional($.constraint), $._aggregate_body)
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
        constraint: $ => seq('if', '(', $.expression, ')'),

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

        template_mixin: $ => seq('mixin', $.mixin_template_name, ';'),

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
            choice(
                seq($.condition, $._decl_block),
                seq($.condition, $._decl_block, 'else', $._decl_block),
                seq($.condition, ':', repeat($._decldef)),
                seq($.condition, $._decl_block, 'else', ':', repeat($._decldef))
            ),

        conditional_statement: $ =>
            choice(
                seq($.condition, $._scope_statement),
                seq($.condition, $._scope_statement, 'else', $._scope_statement),
            ),

        condition: $ => choice(
            $.version_condition, $.debug_condition, $.static_if_condition),

        version_condition: $ =>
            seq(
                'version',
                '(',
                choice($.int_literal, $.identifier, 'unittest', 'assert'),
                ')')
        ,

        version_specification: $ =>
            seq('version', '=', choice($.int_literal, $.identifier), ';'),

        debug_condition: $ =>
            seq('debug', optional(seq('(', choice($.int_literal, $.identifier), ')'))),

        debug_specification: $ =>
            seq('debug', '=', choice($.int_literal, $.identifier), ';'),

        static_if_condition: $ =>
            seq('static', 'if', '(', $._assign_expr, ')'),

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
            seq('static', 'assert', '(', $._assert_arguments, ')', ';'),

        /**************************************************
         *
         * 3.17 TRAITS
         *
         */
        traits_expression: $ => seq('__traits', $.traits_keyword, $.traits_arguments),
        traits_arguments: $ =>
            prec.left(commaSep1(choice($.expression, $.type))),
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
                prec.left(1, seq($.operand, '||', $.operand)),
                prec.left(2, seq($.operand, '&&', $.operand)),
                prec.left(3, seq($.operand, '|', $.operand)),
                prec.left(4, seq($.operand, '^', $.operand)),
                prec.left(5, seq($.operand, '==', $.operand)),
                prec.left(6, seq($.operand, '<', $.operand)),
                prec.left(6, seq($.operand, '<=', $.operand)),
                prec.left(6, seq($.operand, '>', $.operand)),
                prec.left(6, seq($.operand, '>=', $.operand)),
                prec.left(7, seq($.operand, '<<', $.operand)),
                prec.left(7, seq($.operand, '>>', $.operand)),
                prec.left(7, seq($.operand, '>>>', $.operand)),
                prec.left(8, seq($.operand, '+', $.operand)),
                prec.left(8, seq($.operand, '-', $.operand)),
                prec.left(9, seq($.operand, '*', $.operand)),
                prec.left(9, seq($.operand, '/', $.operand)),
                prec.left(9, seq($.operand, '%', $.operand)),
                prec.left(10, seq($.operand, '[', $.operand, ']')),
                prec.left(11, seq($._asm_type_prefix, 'ptr', $.operand)),
                prec.left(11, seq('offsetof', $.operand)),
                prec.left(11, seq('seg', $.operand)),
                prec.left(11, seq('+', $.operand)),
                prec.left(11, seq('-', $.operand)),
                prec.left(11, seq('!', $.operand)),
                prec.left(11, seq('~', $.operand)),
                prec.left(12, $._asm_primary)
            ),

        opcode: $ => choice($.identifier, 'int', 'in', 'out'),

        _asm_type_prefix: $ =>
            choice('near', 'far', 'word', 'dword', 'qword', $.scalar),
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
                seq($.scalar, '.', $.identifier),
            ),
    },

    // It is unfortunate, but many constructs in D require look-ahead
    // to resolve conflicts.
    conflicts: $ => [
        [$.alias_assign, $._primary_expr],
        [$.alias_assignment, $._qualified_id],
        [$.align_attribute],
        [$._arg_list, $._comma_expr],
        [$._arg_list, $.comma_expression],
        [$._arg_list, $._slice],
        [$.at_attribute, $._module_attribute],
        [$._attribute, $.constructor],
        [$._attribute, $.constructor, $.destructor],
        [$._attribute, $.constructor, $.destructor, $.storage_class],
        [$._attribute, $.destructor],
        [$._attribute, $.import_declaration],
        [$._attribute, $._module_attribute],
        [$._attribute, $.pragma_statement],
        [$._attribute, $.return_statement],
        [$._attribute, $.synchronized_statement],
        [$._attribute, $.storage_class],
        [$._attribute, $.storage_class, $.import_declaration],
        [$._attribute, $.storage_class, $.ref_auto_ref],
        [$._attribute, $.storage_class, $.synchronized_statement],
        [$._attribute, $.storage_class, $.type_ctor],
        [$._auto_assignment, $.func_declaration, $._qualified_id],
        [$.auto_declaration, $.func_declaration, $.var_declarations],
        [$._basic_type],
        [$._basic_type, $._ctor_construct],
        [$._basic_type, $._primary_expr],
        [$._basic_type, $.property_expression],
        [$._basic_type, $.scalar_construct],
        [$.block_statement, $._struct_initializer],
        [$.block_statement, $._decl_block],
        [$._comma_expr, $._template_value_parameter],
        [$.comma_expression, $._initializer],
        [$.conditional_declaration],
        [$.conditional_declaration, $._decl_block],
        [$.conditional_statement],
        [$.construct_expression, $._ctor_construct],
        [$.construct_expression, $.parameter, $._primary_expr, $.type],
        [$.construct_expression, $.parameter_storage_class],
        [$.construct_expression, $.parameter_storage_class, $.type],
        [$.construct_expression, $._primary_expr],
        [$.construct_expression, $.func_declaration, $._primary_expr, $.var_declarations],
        [$.construct_expression, $._primary_expr, $._if_condition],
        [$.construct_expression, $._primary_expr, $.type],
        [$.construct_expression, $.scalar_construct],
        [$.construct_expression, $.type],
        [$.constructor, $.constructor_template, $.postblit, $._primary_expr],
        [$.constructor, $._missing_function_body],
        [$.constructor, $._primary_expr, $.postblit],
        [$.constructor_template, $._missing_function_body],
        [$.constructor_template, $._primary_expr],
        [$.debug_condition],
        [$._declaration_omit_statement, $._non_empty_statement_no_case_no_default],
        [$.declaration_statement, $._decldef],
        [$.default_statement, $.function_literal],
        [$.deprecated_attribute, $.storage_class],
        [$.destructor, $._missing_function_body],
        [$._dot_expr, $.template_instance],
        [$.enum_declaration, $.storage_class],
        [$.empty_declaration, $.empty_statement],
        [$._foreach_type_list, $._range_foreach],
        [$.func_declaration],
        [$.func_declaration, $._primary_expr],
        [$.func_declaration, $._primary_expr],
        [$.func_declaration, $._primary_expr, $.var_declarations],
        [$.func_declaration, $.var_declarations],
        [$._func_declarator, $._primary_expr, $.var_declarator],
        [$._func_declarator, $.property_expression, $.var_declarator],
        [$._func_declarator, $.property_expression],
        [$._func_declarator, $.var_declarator],
        [$._function_contract, $._shortened_function_body],
        [$.function_literal, $._no_scope_statement],
        [$.function_literal, $.scope_guard_statement],
        [$.function_literal, $._scope_statement],
        [$.function_literal, $._statement],
        [$.import_declaration, $.storage_class],
        [$._initializer, $.kv_pair],
        [$._initializer, $.scalar],
        [$._labeled_statement],
        [$._labeled_statement, $._struct_member_initializer],
        [$.linkage_attribute, $.storage_class],
        [$._missing_function_body, $.postblit],
        [$.mixin_declaration, $.mixin_expression],
        [$.mixin_expression, $.mixin_type],
        [$.new_expression],
        [$.parameter, $._primary_expr, $.type],
        [$.parameter, $.property_expression],
        [$.parameter, $._template_value_parameter],
        [$.parameter_attributes],
        [$.parameter_storage_class, $.ref_auto_ref],
        [$.parameter_storage_class, $.type],
        [$.parameter_storage_class, $.variadic_arguments_attribute],
        [$.paren_expression, $.synchronized_statement],
        [$._primary_expr],
        [$._primary_expr, $.destructor],
        [$._primary_expr, $._if_condition],
        [$._primary_expr, $._qualified_id],
        [$._primary_expr, $._qualified_id, $._symbol_tail],
        [$._primary_expr, $._qualified_id, $.template_instance],
        [$._primary_expr, $._symbol_tail],
        [$._primary_expr, $.template_instance],
        [$._primary_expr, $._template_value_parameter],
        [$._primary_expr, $.type],
        [$._primary_expr, $._symbol_tail, $.with_statement],
        [$.property_expression, $.template_instance],
        [$.property_expression, $.var_declarator],
        [$._qualified_id],
        [$._qualified_id, $.enum_member],
        [$._qualified_id, $.qualified_identifier],
        [$._qualified_id, $._symbol_tail],
        [$._qualified_id, $.template_instance],
        [$._qualified_id, $._template_sequence_parameter],
        [$._qualified_id, $._template_type_parameter],
        [$.ref_auto_ref, $.storage_class],
        [$.storage_class, $.synchronized_statement],
        [$.storage_class, $.type_ctor],
        [$.try_statement],
        [$.type],
        [$.type_ctor, $.variadic_arguments_attribute],
        [$.user_defined_attribute],
        [$.user_defined_attribute, $.template_instance],
        [$.var_declarations],
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

function binary_operation(left, op, right) {
    return seq(
        field('left', left),
        field('operation', op),
        field('right', right))
}

function unary_operation(op, operand) {
    return seq(field('operation', op), field('operand', operand))
}
