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
    IDENTITY: 7,
    RELATIONAL: 8,
    MEMBERSHIP: 9, // in , !in
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
    TEMPLATE: 17,
    QUALIFIED_ID: 20,
    DEPRECATED: 21, // deprecated attribute,  paren following always is part of
    CONSTRUCTOR: 22, // also destructor
    POSTBLIT: 23,
    BASIC_TYPE: 24, // type declarations
    FUNC_LITERAL: 24, // function literal has a  block statement

    // These are keyword classes.  It helps us to discriminate cases where
    // a keyword can be associated with one group or another.  In some cases
    // the distinction doesn't matter, because the keyword is just allowed in
    // that place.  Using priorities breaks the conflict.  It's probably best
    // to use higher priority for smaller classes.

    PARAMETER_STORAGE_CLASS: 38,
    TYPE_CTOR: 39,
    VARIADIC_ATTR: 40,
    MODULE_ATTRIBUTE: 41,
    REF_AUTO: 42,
};

module.exports = grammar({

    name: 'd',

    // Some externals have trouble with references, if you don't 
    // assign a symbolic name to them.  This is described in
    // https://github.com/tree-sitter/tree-sitter/issues/1887
    externals: $ => [
        $.endFile,
        $.comment,
        $.identifier,
        $.bom,
        $.directive,
        $.shebang,
        $.int_literal,
        $.float_literal,
        $.char_literal,
        $._dqstring, // conventional "string" (may include escapes)
        $._bqstring, // wsiwyg `string`
        $._rqstring, // wsiwyg r"string"
        '{',
        '}',
        '/',
        '/=',
        $._and,
        '&=',
        '&&',
        '|',
        '|=',
        '||',
        $._minus,
        '-=',
        '--',
        $._plus,
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
        $._equal,
        $._equalequal,
        '=>',
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
        $._dot,
        '..',
        '...',
        'abstract',
        'alias',
        'align',
        'asm',
        'assert',
        'auto',
        'body', // obsolete
        'bool',
        'break',
        'byte',
        'case',
        'cast',
        'catch',
        'cdouble', // obsolete
        'cent',    // obsolete
        'cfloat',  // obsolete
        'char',
        'class',
        'const',
        'continue',
        'creal', // obsolete
        'dchar',
        'debug',
        'default',
        'delegate',
        'delete', // obsolete
        'deprecated',
        'do',
        'double',
        'else',
        'enum',
        'export',
        'extern',
        'false',
        $._final,
        'finally',
        'float',
        'for',
        'foreach',
        'foreach_reverse',
        'function',
        'goto',
        'idouble', // obsolete
        'if',
        'ifloat', // obsolete
        'immutable',
        'import',
        $._in,
        'inout',
        'int',
        'interface',
        'invariant',
        'ireal', // obsolete
        $._is,
        'lazy',
        'long',
        'macro', // obsolete?
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
        'ucent', // obsolete
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
        '__DATE__',
        '__EOF__',
        '__TIME__',
        '__TIMESTAMP__',
        '__VENDOR__',
        '__VERSION__',   // integer literal version
    ],

    extras: $ => [
        /[ \t\r\n\u2028\u2029]/,
        $.comment,
        $.directive,
    ],

    inlines: $ => [
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
        $.identity_operation,
        $.power_expression,
        $._basic_type,

        // alias inlines
        $.and,
        $.dot,
        $.equal,
        $.equalequal,
        $.final,
        $.in,
        $.is,
        $.minus,
        $.plus,
    ],

    word: $ => $.identifier,

    // The order of these rules very roughly corresponds to the order
    // they are defined in the D grammar on the D website.

    rules: {

        /**************************************************
         *
         * 3.1 LEXER
         *
         * Most of the lexer is in the external scanner.c.
         */

        source_file: $ => seq(
            optional(choice($.bom, $.shebang)),
            optional($.module)
        ),

        /**************************************************
         *
         * 3.2 MODULES
         *
         */

        module: $ =>
            prec(-1, choice(
                seq($.module_declaration, prec(-1, repeat($._decldef))),
                repeat1($._decldef))),

        _decldef: $ => choice(
            $._attribute_specifier,
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
            $._empty_decl,
        ),
        // a few thisn are already in declaration, so not included in _decldef:
        // - static_assert,
        // - conditional_declaration
        // - template_mixin_declaration
        // - template_mixin

        _empty_decl: $ => ';',

        //
        // Aliases.  We need these to work around tree sitter limitations.
        // These get inlined for highlighting, etc.
        //
        and: $ => alias($._and, '&'),
        dot: $ => alias($._dot, '.'),
        final: $ => alias($._final, 'final'),
        equal: $ => alias($._equal, '='),
        equalequal: $ => alias($._equalequal, '=='),
        in: $ => alias($._in, 'in'),
        is: $ => alias($._is, 'is'),
        minus: $ => alias($._minus, '-'),
        plus: $ => alias($._plus, '+'),


        //
        // Module Declarations
        //
        module_declaration: $ => seq(
            repeat($._module_attribute),
            'module',
            field('name', $._module_fqn),
            ';'),

        _module_attribute: $ => prec(PREC.MODULE_ATTRIBUTE, choice(
            $.deprecated_attribute,
            $.user_defined_attribute,
        )),

        _module_fqn: $ => seq(
            prec.left(2, field('package', repeat(seq($.identifier, $._dot)))),
            prec.left(1, field('name', $.identifier))),

        //
        // Import Declarations
        //
        import_declaration: $ =>
            seq(optional('static'), 'import', $._import_list, ';'),

        _import_list: $ => choice(
            prec.left(seq($._import, optional(seq(',', $._import_list)))),
            $._import_bindings,
        ),

        _import: $ => choice(
            $._module_fqn,
            seq(field('alias', $.identifier), $.equal, $._module_fqn),
        ),

        _import_bindings: $ => seq($._import, ':', $._import_bind_list),

        _import_bind_list: $ => prec.left(seq($._import_bind, repeat(seq(',', $._import_bind)))),

        _import_bind: $ => seq($.identifier, optional(seq($.equal, $.identifier))),

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
                $.auto_declaration,
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

        // _aggregate_declaration is inlined above

        //
        // Variable Declarations
        //
        var_declarations: $ =>
            prec.right(choice(
                seq(
                    optional($._storage_classes),
                    field('type', $._basic_type),
                    $._declarators,
                    ';'),
            )),

        _declarators: $ => choice(
            $.declarator_initializer,
            seq($.declarator_initializer, ',', $._declarator_identifier_list),
        ),

        declarator_initializer: $ =>
            choice(
                $.var_declarator,
                seq(
                    $.var_declarator,
                    optional($.template_parameters),
                    $.equal,
                    field('value', $._initializer)),
            ),

        var_declarator: $ =>
            prec.right(seq(
                repeat($._type_suffix),
                field('variable', $.identifier))),

        _declarator_identifier_list: $ => commaSep1($.declarator_identifier),

        declarator_identifier: $ => choice(
            field('variable', $.identifier),
            seq(
                field('variable', $.identifier),
                optional($.template_parameters),
                $.equal,
                field('value', $._initializer)),
        ),

        _declarator: $ => prec.left(seq(repeat($._type_suffix), $.identifier)),
        declarator: $ => $._declarator,

        //
        // Storage Classes
        //
        _storage_class: $ => prec.left(choice(
            $.linkage_attribute,
            $.align_attribute,
            $._at_attribute,
            'deprecated',
            'enum',
            'static',
            'extern',
            'abstract',
            $.final,
            'override',
            'synchronized',
            'auto',
            'scope',
            'const',
            'immutable',
            'inout',
            'shared',
            '__gshared',
            'nothrow',
            'pure',
            'ref'
        )),

        _storage_classes: $ => prec.left(prec.left(repeat1($._storage_class))),

        //
        // Initializers
        //
        _initializer: $ => prec.left(choice(
            $._expression,
            $._struct_initializer,
            // $.array_literal is already covered under _expression
        )),

        //
        // Auto Declaration
        //
        auto_declaration: $ => seq($._storage_classes, commaSep1($._auto_assignment), ';'),

        _auto_assignment: $ => seq(
            field('variable', $.identifier),
            optional($.template_parameters),
            $._equal,
            field('value', $._initializer)),

        //
        // Alias Declaration
        //
        alias_declaration: $ =>
            seq('alias',
                choice(
                    seq(repeat($._storage_class), $._basic_type, $._declarators),
                    seq(repeat($._storage_class), $._basic_type, $._func_declarator),
                    commaSep1($.alias_assignment)),
                ';'),

        alias_assignment: $ => choice(
            seq($.identifier,
                optional($.template_parameters),
                $._equal,
                optional($._storage_classes),
                $.type),
            seq($.identifier,
                optional($.template_parameters),
                $._equal,
                optional($._storage_classes),
                $.function_literal),
            seq($.identifier,
                optional($.template_parameters),
                $._equal,
                $._basic_type,
                $.parameters,
                optional($._member_function_attributes)),
        ),

        //
        // Alias Assign (type alias)
        //
        alias_assign: $ => seq($.identifier, $._equal, $.type),

        /**************************************************
         *
         * 3.2 TYPES
         *
         */

        type: $ =>
            prec.left(seq(repeat($._type_ctor), $._basic_type, repeat($._type_suffix))),

        _type_ctor: $ =>
            prec(PREC.TYPE_CTOR, choice('const', 'immutable', 'inout', 'shared')),

        _basic_type: $ => prec.left(PREC.BASIC_TYPE, choice(
            $.scalar,
            seq($.dot, $._qualified_id),
            $._qualified_id,
            $.typeof,
            seq($.typeof, $.dot, $._qualified_id),
            seq($._type_ctor, paren($.type)),
            $._vector,
            // TODO: traits_expression
            $.mixin_expression,
        )),

        _vector: $ => seq('__vector', paren($.type)),

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

        _type_suffix: $ => prec.left(choice(
            '*',
            bracket(),
            bracket($._expression),
            bracket($._expression, '..', $._expression),
            bracket($.type),
            seq('delegate', $.parameters, optional($._member_function_attributes)),
            seq('function', $.parameters, repeat($._function_attribute)),
        )),

        _qualified_id: $ => prec.left(PREC.QUALIFIED_ID, choice(
            $.identifier,
            seq($.identifier, $.dot, $._qualified_id),
            $.template_instance,
            seq($.identifier, $.dot, $._qualified_id),
            prec(2, seq($.identifier, bracket($._expression))),
            prec(1, seq($.identifier, bracket($._expression), $.dot, $._qualified_id)),
        )),

        //
        // Typeof
        //
        typeof: $ => choice(
            seq('typeof', paren(commaSep1($._expression))),
            seq('typeof', paren('return')),
        ),

        // Mixin Type replaced by mixin_expression (evaluates identically)

        //
        // 3.5 ATTRIBUTES
        //

        align_attribute: $ =>
            prec.left(seq('align', optional(paren($._expression)))),

        deprecated_attribute: $ =>
            prec.left(PREC.DEPRECATED, seq('deprecated', optional(paren($._expression)))),

        visibility_attribute: $ =>
            prec.left(choice(
                'private',
                'package',
                seq('package', paren($._qualified_id)),
                'protected',
                'public',
                'export',
            )),

        user_defined_attribute: $ =>
            prec.left(choice(
                seq('@', field('name', $.identifier)),
                seq('@',
                    field('name', $.identifier),
                    paren(field('arguments', optional($._arg_list)))),
                seq('@', field('template', $.template_instance)),
                seq('@',
                    field('template', $.template_instance,
                        paren(field('arguments', optional($._arg_list)))))
            )),

        _attribute_specifier: $ =>
            prec.left(seq($._attribute, optional($._decl_block))),

        _attribute: $ => prec.left(choice(
            $.linkage_attribute,
            $.align_attribute,
            $.deprecated_attribute,
            $.visibility_attribute,
            $.pragma,
            'static',
            'extern',
            'abstract',
            $._final,
            'override',
            'synchronized',
            'auto',
            'scope',
            'const',
            'immutable',
            'inout',
            'shared',
            '__gshared',
            $._at_attribute,
            'nothrow', // function_attribute_kwd
            'pure', // function_attribute_kwd
            'ref',
            'return',
        )),

        _at_attribute: $ => choice(
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
            paren(
                choice(
                    "C",
                    "C++",
                    "D",
                    "Windows",
                    "System",
                    "Objective-C",
                    seq("C++", ',', $._qualified_id),
                    seq("C++", ',', $._namespace_list),
                    seq("C++", ',', 'class'),
                    seq("C++", ',', 'struct'),
                ))),

        _namespace_list: $ => commaSep1Comma($._conditional_expression),

        _decl_block: $ =>
            prec(1, choice($._decldef, brace(repeat($._decldef)))),

        _arg_list: $ =>
            prec.left(commaSep1Comma($._expression)),

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
        _comma_expression: $ => prec.left(commaSep1($._expression)),

        // this is basically "AssignExpression", but we have taken the liberty
        // to separate out things that are *necesarily* unable to appear on the
        // left hand side of an assignment expression.  The things that *can*
        // do that, are in the _left_expression.
        _expression: $ => choice(
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
            $._special_keyword,
            $.function_literal,
            $.assert_expression,
            $.import_expression,
            $.is_expression,
        ),

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
            $.identifier,
            seq($.dot, $.identifier),
            $.template_instance,
            seq($.dot, $.template_instance),
            $.ternary_expression,
            $.cast_expression,
            $.field_expression,
            seq(repeat($._type_ctor), $._basic_type, paren(optional($._arg_list))),
            $.index_expression,
            $.slice_expression,
            paren(commaSep1($._expression)),
            seq($.scalar, $.dot, $.identifier),
            seq(paren($.type), $.dot, $.identifier),
            seq(paren($.type), $.dot, $.template_instance),
            $.mixin_expression,
            $.new_expression,
            $.typeid_expression,
        )),

        ternary_expression: $ => prec.right(PREC.CONDITIONAL, seq(
            field('condition', $._expression),
            '?',
            field('consequence', $._expression),
            ':',
            field('alternative', $._expression))),


        field_expression: $ => prec.left(PREC.POSTFIX, seq(
            field('parent', $._expression), $.dot,
            field('member', $.identifier)
        )),

        index_expression: $ => prec.left(PREC.SUBSCRIPT, seq(
            field('parent', $._expression),
            bracket(field('index', $._arg_list)),
        )),

        slice_expression: $ => prec.left(PREC.SUBSCRIPT, choice(
            seq(field('parent', $._expression), bracket()),
            seq(
                field('parent', $._expression),
                bracket(field('index', commaSep1Comma($._slice))))
        )),

        _slice: $ => prec.left(PREC.SUBSCRIPT, choice(
            $._expression,
            seq($._expression, '..', $._expression)
        )),

        assignment_expression: $ => prec.right(PREC.ASSIGNMENT, seq(
            field('left', $._left_expression),
            field('operator',
                choice(
                    $.equal,
                    '+=', '-=', '*=', '/=', '%=', '&=', '|=',
                    '^=', '~=', '<<=', '>>=', '>>>=', '^^=',
                ),
                field('right', $._expression)))),

        pointer_expression: $ => prec.left(PREC.CAST, seq(
            field('operator', choice('*', $.and)),
            field('argument', $._expression)
        )),

        relational_expression: $ => prec.left(PREC.RELATIONAL, seq(
            field('left', $._expression),
            field('operation', choice('>', '>=', '<', '<=')),
            field('right', $._expression)
        )),

        equality_expression: $ => prec.left(PREC.EQUAL, seq(
            field('left', $._expression),
            field('operation', choice($._equalequal, '!=')),
            field('right', $._expression)
        )),

        shift_expression: $ => prec.right(PREC.SHIFT, seq(
            field('left', $._expression),
            field('operation', choice('>>', '>>>', '<<')),
            field('right', $._expression)
        )),

        add_expression: $ => prec.right(PREC.ADD, seq(
            field('left', $._expression),
            field('operation', choice($.plus, $.minus)),
            field('right', $._expression)
        )),

        multiply_expression: $ => prec.right(PREC.MULTIPLY, seq(
            field('left', $._expression),
            field('operation', choice('*', '/', '%')),
            field('right', $._expression)
        )),

        concat_expression: $ => prec.right(PREC.CONCAT, seq(
            field('left', $._expression),
            field('operation', '~'),
            field('right', $._expression)
        )),

        logical_and_expression: $ => prec.right(PREC.LOGICAL_AND, seq(
            field('left', $._expression),
            field('operation', '&&'),
            field('right', $._expression)
        )),

        logical_or_expression: $ => prec.right(PREC.LOGICAL_OR, seq(
            field('left', $._expression),
            field('operation', '||'),
            field('right', $._expression)
        )),

        inclusive_or_expression: $ => prec.right(PREC.INCLUSIVE_OR, seq(
            field('left', $._expression),
            field('operation', '|'),
            field('right', $._expression)
        )),

        exclusive_or_expression: $ => prec.right(PREC.EXCLUSIVE_OR, seq(
            field('left', $._expression),
            field('operation', '^'),
            field('right', $._expression)
        )),

        bitwise_and_operation: $ => prec.right(PREC.BITWISE_AND, seq(
            field('left', $._expression),
            field('operation', $.and),
            field('right', $._expression)
        )),

        membership_operation: $ => prec.right(PREC.MEMBERSHIP, seq(
            field('left', $._expression),
            field('operation', seq(optional('!'), $.in)),
            field('right', $._expression)
        )),

        identity_operation: $ => prec.right(PREC.MEMBERSHIP, seq(
            field('left', $._expression),
            field('operation', seq(optional('!'), $.is)),
            field('right', $._expression)
        )),

        power_expression: $ => prec.right(PREC.POWER, seq(
            field('left', $._expression),
            field('operation', '^^'),
            field('right', $._expression)
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
            $.membership_operation,
            $.identity_operation,
            $.power_expression,
        ),

        prefix_expression: $ => prec.right(PREC.POSTFIX, seq(
            field('operator', choice('++', '--')),
            field('argument', $._expression),
        )),

        postfix_expression: $ => prec.right(PREC.POSTFIX, seq(
            field('argument', $._expression),
            field('operator', choice('++', '--')),
        )),

        unary_expression: $ => prec.left(PREC.UNARY, seq(
            field('operator', choice('~', $.minus, $.plus, '!')),
            field('argument', $._expression),
        )),

        cast_expression: $ => prec.left(PREC.CAST, choice(
            seq('cast', paren($.type), $._expression),
            seq('cast', paren(repeat($._type_ctor)), $._expression),
        )),

        delete_expression: $ => prec.right(PREC.CAST, seq(
            'delete', $._expression,
        )),

        throw_expression: $ => prec.right(PREC.THROW, seq(
            'throw', $._expression,
        )),

        //
        // Assert expression.
        //
        assert_expression: $ => seq('assert', paren($._assert_arguments)),

        _assert_arguments: $ => commaSep1Comma($._expression),

        //
        // Mixin expression.  The result may be an lvalue.
        //
        mixin_expression: $ => seq('mixin', paren($._arg_list)),

        //
        // Import expression - evaluates to a string literal.
        //
        import_expression: $ => seq('import', paren($._expression)),

        new_expression: $ =>
            prec.left(choice(
                seq('new', $.type),
                seq('new', $.type, bracket($._expression)),
                seq('new', $.type, paren(optional($._arg_list))),
                $.new_anon_class_expression,
            )),

        typeid_expression: $ => choice(
            seq('typeid', paren($.type)),
            seq('typeid', paren($._expression))
        ),

        is_expression: $ => choice(
            seq('is', paren($.type)),
            seq('is', paren($.type, $._equalequal, $._type_specialization)),
            seq('is', paren($.type, ':', $._type_specialization)),
            seq('is', paren($.type, $._equalequal, $._type_specialization, ',', $._template_parameter_list)),
            seq('is', paren($.type, ':', $._type_specialization, ',', $._template_parameter_list)),
            seq('is', paren($.type, $.identifier)),
            seq('is', paren($.type, $.identifier, $._equalequal, $._type_specialization)),
            seq('is', paren($.type, $.identifier, ':', $._type_specialization)),
            seq('is', paren($.type, $.identifier, $._equalequal, $._type_specialization, ',', $._template_parameter_list)),
            seq('is', paren($.type, $.identifier, ':', $._type_specialization, ',', $._template_parameter_list))
        ),

        _type_specialization: $ => choice(
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
            //'__DATE__',
            //'__TIME__',
            //'__TIMESTAMP__',
            //'__VENDOR__'
        ),

        array_literal: $ => bracket(commaSep($._array_member_init)),

        _array_member_init: $ => choice(
            field('value', $._initializer),
            seq(field('key', $._expression), ':', field('value', $._initializer)),
        ),

        assoc_array_literal: $ => bracket(commaSep1($._kv_pair)),

        _kv_pair: $ => prec.left(seq(field('key', $._expression), ':', field('value', $._expression))),

        //
        // Function Literal
        //
        function_literal: $ =>
            prec(PREC.FUNC_LITERAL, choice(
                seq(
                    'function',
                    optional($._ref_auto_ref),
                    optional($.type),
                    optional($._parameter_with_attributes),
                    $._func_literal_body2),
                seq(
                    'delegate',
                    optional($._ref_auto_ref),
                    optional($.type),
                    optional($._parameter_with_member_attributes),
                    $._func_literal_body2),
                seq(optional($._ref_auto_ref),
                    $._parameter_with_member_attributes,
                    $._func_literal_body2),
                $.block_statement,
                seq($.identifier, '=>', $._expression),
            )),

        _parameter_with_attributes: $ =>
            seq($.parameters, repeat($._function_attribute)),

        _parameter_with_member_attributes: $ =>
            seq($.parameters, optional($._member_function_attributes)),

        _ref_auto_ref: $ => prec(PREC.REF_AUTO, seq(optional('auto'), 'ref')),

        _func_literal_body2: $ => choice(
            seq('=>', $._expression),
            $._specified_function_body,
        ),

        _special_keyword: $ => choice(
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

        _no_scope_non_empty_statement: $ =>
            choice($._non_empty_statement, $.block_statement),

        _no_scope_statement: $ => choice(
            $.empty_statement,
            $._non_empty_statement,
            $.block_statement,
        ),

        _non_empty_statement: $ => choice(
            $._non_empty_statement_no_case_no_default,
            $.case_statement,
            $.case_range_statement,
            $.default_statement,
        ),

        _scope_statement: $ => choice(
            $._non_empty_statement,
            $.block_statement,
        ),

        _non_empty_statement_no_case_no_default: $ => choice(
            $._labeled_statement,
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

        _labeled_statement: $ => prec.left(seq('$identifier', ':', optional($._statement))),

        block_statement: $ => brace(repeat($._statement)),

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
            $._expression,
            seq('auto', $.identifier, $.equal, $._comma_expression),
            seq('scope', $.identifier, $.equal, $._comma_expression),
            seq(repeat1($._type_ctor), $.identifier, $.equal, $._comma_expression),
            seq(repeat($._type_ctor), $._basic_type, $._declarator, $.equal, $._comma_expression),
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


        initialize: $ => choice(';', $._no_scope_non_empty_statement),

        test: $ => $._comma_expression,

        increment: $ => $._comma_expression,

        //
        // Foreach Statement
        //

        foreach_statement: $ =>
            seq($._aggregate_foreach, $._no_scope_non_empty_statement),

        _foreach_type_list: $ => commaSep1($._foreach_type),

        _foreach_type: $ =>
            seq(
                repeat($._foreach_type_attribute),
                choice(
                    seq($._basic_type, $._declarator),
                    $.identifier,
                    seq('alias', $.identifier))
            ),

        _aggregate_foreach: $ =>
            seq(
                choice('foreach', 'foreach_reverse'),
                paren($._foreach_type_list, ';', $._comma_expression)),


        _foreach_type_attribute: $ => choice('enum', 'ref', 'scope', $._type_ctor),

        //
        // Foreach Range Statement
        //
        foreach_range_statement: $ => seq($._range_foreach, $._scope_statement),

        _range_foreach: $ =>
            seq(
                choice('foreach', 'foreach_reverse'),
                paren($._foreach_type, $._comma_expression, '..', $._comma_expression),
            ),

        //
        // Switch Statement
        //

        switch_statement: $ =>
            seq('switch', paren(commaSep1($._expression), $._scope_statement)),

        case_statement: $ =>
            prec.left(
                seq('case', $._arg_list, ':', optional($._scope_statement_list))),

        case_range_statement: $ =>
            prec.left(
                seq('case', $._expression, ':', '..', 'case', $._expression,
                    optional($._scope_statement_list))),

        default_statement: $ =>
            prec.left(seq('default', ':', optional($._scope_statement_list))),

        _scope_statement_list: $ =>
            repeat1(choice(
                $.empty_statement,
                $._non_empty_statement_no_case_no_default,
                $.block_statement)),

        final_switch_statement: $ =>
            seq($.final, 'switch', paren($._comma_expression), $._scope_statement),

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
                    $._symbol,
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
                $._no_scope_non_empty_statement),

        finally: $ => seq('finally', $._no_scope_non_empty_statement),


        //
        // Scope Guard Statement
        //
        scope_guard_statement: $ =>
            seq('scope',
                paren(choice('exit', 'success', 'failure')),
                choice($._non_empty_statement, $.block_statement)),

        //
        // AsmStatement
        //
        asm_statement: $ =>
            seq('asm', repeat($._function_attribute), brace(/* TODO */)),

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
            seq('struct', $.identifier, $._aggregate_body),
            seq('struct', $._aggregate_body), // anonymous struct
            $.struct_template_declaration,
        ),

        // AnonStructDeclaration inlined above

        union_declaration: $ => choice(
            seq('union', $.identifier, ';'),
            seq('union', $.identifier, $._aggregate_body),
            seq('union', $._aggregate_body), // anonymous union
            $.union_template_declaration,
        ),

        // AnonUnionDeclaration inlined above

        _aggregate_body: $ => brace(repeat($._decldef)),

        //
        // Struct Initializer
        //
        _struct_initializer: $ => brace(commaSep($._struct_member_initializer)),

        // struct_member_initializers inlined above
        _struct_member_initializer: $ =>
            seq(optional(seq($.identifier, ':')), $._initializer),

        //
        // Postblit
        //
        postblit: $ =>
            prec.left(PREC.POSTBLIT,
                seq(
                    'this', paren('this'),
                    optional($._member_function_attributes),
                    choice($.function_body, ';'),
                )),

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
            prec(PREC.CONSTRUCTOR, choice(
                seq('this', $.parameters,
                    optional($._member_function_attributes), $.function_body),
                seq(optional('shared'), 'static', 'this', paren(),
                    optional($._member_function_attributes),
                    choice($.function_body, ';')),
                $.constructor_template,
            )),

        destructor: $ =>
            prec(PREC.CONSTRUCTOR, choice(
                seq('~', 'this', paren(),
                    optional($._member_function_attributes), $.function_body),
                seq(optional('shared'), 'static', '~', 'this', paren(),
                    optional($._member_function_attribute),
                    choice($.function_body, ';')),
            )),

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
                seq('interface', optional($._base_interface_list), $._aggregate_body),
                $.interface_template_declaration,
            ),

        _base_interface_list: $ => seq(':', $._interfaces),

        /**************************************************
         *
         * 3.12 ENUMS
         *
         */

        enum_declaration: $ =>
            choice(
                seq('enum', $.identifier, $._enum_body),
                seq('enum', $.identifier, ':', $.type, $._enum_body),
                seq('enum', ':', $.type, brace($._enum_members)), // anonymous
                // NB: grammar also lists this with _enum_members, but
                // that's just a degenerate case of this one.
                seq('enum', brace($._anonymous_enum_members)),
            ),

        _enum_body: $ => choice(brace($._enum_members), ';'),
        _enum_members: $ => commaSep1($.enum_member),

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
                optional(seq($.equal, $._expression))
            ),

        _anonymous_enum_member: $ => choice(
            $.enum_member,
            seq($.type, $.equal, $._expression),
        ),

        _anonymous_enum_members: $ => commaSep1($._anonymous_enum_member),


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
                // TODO: tree sitter somehow picks up on *before*
                // matching the simpler form, even when it does not
                // match successfully.
                // seq(
                //     $.template_parameters,
                //     $.parameters,
                //     optional($._member_function_attributes),
                //     optional($.constraint),
                // ),
            ),

        //
        // Parameters
        //
        parameters: $ => paren(optional($._parameter_list)),

        _parameter_list: $ => prec.left(choice(
            commaSep1Comma($.parameter),
            seq(commaSep1($.parameter), repeat($._variadic_arguments_attribute), '...'),
            seq(repeat($._variadic_arguments_attribute), '...'),
        )),

        parameter_ellipses: $ => // not used right now
            prec.left(seq(
                optional($._parameter_attributes),
                choice(
                    seq($._basic_type, $._declarator),
                    seq($._basic_type, $._declarator, '...'),
                    seq($._basic_type, $._declarator, $._equal, $._expression),
                    seq($.type),
                    seq($.type, '...'),
                    seq($.type, $._equal, $._expression))
            )),


        parameter: $ =>
            prec.left(seq(optional($._parameter_attributes),
                choice(
                    seq($._basic_type, $._declarator),
                    seq($._basic_type, $._declarator, $._equal, $._expression),
                    seq($.type),
                    seq($.type, $._equal, $._expression)
                ))),

        _parameter_attributes: $ =>
            repeat1(choice($._parameter_storage_class, $.user_defined_attribute)),

        _parameter_storage_class: $ => prec(PREC.PARAMETER_STORAGE_CLASS, choice(
            'auto',
            'const', // ftype_ctor
            'immutable', // type_ctor
            'inout', // type_ctor
            'shared', // type_ctor
            $._final,
            $._in,
            'lazy',
            'out',
            'ref',
            'return',
            'scope'
        )),

        _variadic_arguments_attributes: $ =>
            repeat1($._variadic_arguments_attribute),

        _variadic_arguments_attribute: $ =>
            prec(PREC.VARIADIC_ATTR, choice('const', 'immutable', 'return', 'scope', 'shared')),

        //
        // Function Attributes
        //
        _function_attribute: $ => choice(
            $._function_attribute_kwd,
            $._at_attribute,
        ),

        _member_function_attributes: $ => repeat1($._member_function_attribute),

        _member_function_attribute: $ => choice(
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
            seq(optional($._in_out_contract_expressions), '=>', $._expression, ';'),

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
            seq($.in, paren($._assert_arguments)),

        out_contract_expression: $ =>
            seq('out', paren(optional($.identifier), ':', $._assert_arguments)),

        in_statement: $ =>
            seq($.in, $.block_statement),

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
                brace(repeat($._decldef))),

        //
        // Template Instance
        //
        template_instance: $ =>
            prec.left(PREC.TEMPLATE, seq($.identifier, $.template_arguments)),

        template_arguments: $ =>
            choice(
                seq('!', paren(optional($._template_argument_list))),
                seq('!', $._template_single_arg)),

        template_argument: $ => choice($.type, $._symbol, $._expression),

        _template_argument_list: $ => commaSep1($.template_argument),

        _symbol: $ => seq(optional($.dot), $._symbol_tail),

        _symbol_tail: $ =>
            prec.left(choice(
                seq($.identifier, optional(seq($.dot, $._symbol))),
                seq($.template_instance, optional(seq($.dot, $._symbol)))
            )),

        _template_single_arg: $ => choice(
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
            $._special_keyword,
        ),

        _template_parameter: $ => choice(
            $._template_type_parameter,
            $._template_value_parameter,
            $._template_alias_parameter,
            $._template_sequence_parameter,
        ),

        template_parameters: $ => paren($._template_parameter_list),

        _template_parameter_list: $ => commaSep1Comma($._template_parameter),

        _template_type_parameter: $ =>
            seq(
                optional('this'), // covers TemplateThisParameter
                $.identifier,
                optional(seq(':', $.type)),
                optional(seq('=', $.type))
            ),

        _template_value_parameter: $ =>
            prec.left(PREC.TEMPLATE, seq(
                $._basic_type,
                $._declarator,
                optional(seq(':', $._conditional_expression)),
                optional(seq('=', choice($._expression, $._special_keyword))))),

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
                    $._declarator,
                    optional($._template_alias_parameter_specialization),
                    optional($._template_alias_parameter_default))),

        _template_alias_parameter_specialization: $ =>
            prec(PREC.TEMPLATE, choice(
                seq(':', $.type),
                seq(':', $._conditional_expression))),

        _template_alias_parameter_default: $ =>
            prec(PREC.TEMPLATE, choice(
                seq($._equal, $.type),
                seq($._equal, $._conditional_expression))),

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
                choice($.function_body, ';')
            ),

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
                brace(repeat1($._decldef))),

        template_mixin: $ =>
            prec.left(seq('mixin',
                $._mixin_template_name,
                optional($.template_arguments),
                optional($.identifier))),

        _mixin_template_name: $ =>
            choice(
                seq($._dot, $._mixin_qualified_identifier),
                $._mixin_qualified_identifier,
                seq($.typeof, $.dot, $._mixin_qualified_identifier)),

        _mixin_qualified_identifier: $ =>
            prec.left(choice(
                $.identifier,
                seq($.identifier, $._dot, $._mixin_qualified_identifier),
                seq($.template_instance, $._dot, $._mixin_qualified_identifier),
            )),

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
                    $._no_scope_non_empty_statement,
                    'else',
                    $._no_scope_non_empty_statement)),

        condition: $ => choice(
            $.version_condition, $.debug_condition, $.static_if_condition),

        version_condition: $ =>
            prec.left(
                seq(
                    'version',
                    paren(choice($.int_literal, $.identifier, 'unittest', 'assert'))
                )),

        version_specification: $ =>
            seq('version', $._equal, choice($.int_literal, $.identifier), ';'),

        debug_condition: $ =>
            prec.left(
                seq('debug', optional(paren(choice($.int_literal, $.identifier))))),

        debug_specification: $ =>
            seq('debug', $._equal, choice($.int_literal, $.identifier), ';'),

        static_if_condition: $ =>
            seq('static', 'if', paren($._expression)),

        _static_foreach: $ => choice(
            seq('static', $._aggregate_foreach),
            seq('static', $._range_foreach)),

        static_foreach_declaration: $ =>
            prec.left(choice(
                seq($._static_foreach, $._decl_block),
                seq($._static_foreach, ':', repeat($._decldef)))),

        static_foreach_statement: $ =>
            seq($._static_foreach, $._no_scope_non_empty_statement),

        static_assert: $ =>
            seq('static', 'assert', paren($._assert_arguments), ';'),

        /**************************************************
         *
         * 3.17 TRAITS
         *
         */
        traits_expression: $ => seq('__traits', $.traits_keyword, $.traits_arguments),
        traits_arguments: $ => commaSep1(choice($._expression, $.type)),
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
                prec.left(PREC.EQUAL, seq($.operand, $.equalequal, $.operand)),
                prec.left(PREC.RELATIONAL, seq($.operand, '<', $.operand)),
                prec.left(PREC.RELATIONAL, seq($.operand, '<=', $.operand)),
                prec.left(PREC.RELATIONAL, seq($.operand, '>', $.operand)),
                prec.left(PREC.RELATIONAL, seq($.operand, '>=', $.operand)),
                prec.left(PREC.SHIFT, seq($.operand, '<<', $.operand)),
                prec.left(PREC.SHIFT, seq($.operand, '>>', $.operand)),
                prec.left(PREC.SHIFT, seq($.operand, '>>>', $.operand)),
                prec.left(PREC.ADD, seq($.operand, $._plus, $.operand)),
                prec.left(PREC.ADD, seq($.operand, '-', $.operand)),
                prec.left(PREC.MULTIPLY, seq($.operand, '*', $.operand)),
                prec.left(PREC.MULTIPLY, seq($.operand, '/', $.operand)),
                prec.left(PREC.MULTIPLY, seq($.operand, '%', $.operand)),
                prec.left(PREC.SUBSCRIPT, seq($.operand, bracket($.operand))),
                // TODO: tree-sitter crashes on this
                // prec.left(PREC.UNARY, seq($._asm_type_prefix, 'ptr', $.operand)),
                prec.left(PREC.UNARY, seq('offsetof', $.operand)),
                prec.left(PREC.UNARY, seq('seg', $.operand)),
                prec.left(PREC.UNARY, seq($._plus, $.operand)),
                prec.left(PREC.UNARY, seq('-', $.operand)),
                prec.left(PREC.UNARY, seq('!', $.operand)),
                prec.left(PREC.UNARY, seq('~', $.operand)),
                $._asm_primary),

        opcode: $ => choice($.identifier, 'int', $.in, 'out'),

        _asm_type_prefix: $ =>
            choice('near', 'var', 'word', 'dword', 'qword', $.scalar),

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
                seq($.identifier, $._dot, $._dot_identifier),
                //seq($.scalar, $._dot, $.identifier)
                seq('bob', $._dot, $.identifier)
                
            ),
    },

    conflicts: $ => [
        [$._storage_class, $._attribute],
        [$._initializer, $._kv_pair],
        [$._symbol_tail, $._conditional_expression],
        [$.final, $._attribute,],
        [$._variadic_arguments_attribute, $._parameter_storage_class],
        [$._shortened_function_body, $._function_contract],
        [$._missing_function_body, $.constructor_template],
        [$.block_statement, $._struct_initializer],
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

function bracket(...rules) {
    return seq('[', ...rules, ']')
}

function brace(...rules) {
    return seq('{', ...rules, '}')
}