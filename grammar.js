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
        source_file: $ => seq(
            optional(choice($.bom, $.shebang)),
            optional($.module)
        ),

        //
        // 3.2 MODULES
        //

        module: $ => choice(
            seq($.module_declaration, repeat($._decldef)),
            repeat1($._decldef)),

        _decldef: $ => choice( // TODO: this is largely wrong
            $._attr_specifier,
            $._declaration,
            // TODO: $._ctor,
            // TODO: $._dtor,
            // TODO: $._postblit,
            // TODO: $._invariant
            // TODO: $._unittest
            $.alias_this,
            // TODO: $._static_ctor,
            // TODO: $._static_dtor,
            // TODO: $._shared_static_ctor,
            // TODO: $._shared_static_dtor,
            // TODO: $._cond_decl,
            // TODO: $._debug_spec,
            // TODO: $._version_spec,
            // TODO: $._static_assert
            // TODO: $._template_decl,
            // TODO: $._template_mixin,
            $.mixin_declaration,
            $._empty_decl,
        ),

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
            repeat($._module_attr),
            'module',
            field('name', $._module_fqn),
            ';'),

        _module_attr: $ => choice(
            $.deprecated_attr,
            $.user_defined_attr,
        ),

        _module_fqn: $ => seq(
            prec.left(2, field('package', repeat(seq($.identifier, $._dot)))),
            prec.left(1, field('name', $.identifier))),

        //
        // Import Declarations
        //
        import_declaration: $ => seq(optional('static'), 'import', $._import_list, ';'),

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
        mixin_declaration: $ => seq('mixin', paren($._arg_list)),

        //
        // 3.3 DECLARATIONS
        //

        _declaration: $ => choice(
            //     // TODO: $.function_declaration,
            $._var_declarations,
            $.alias_declaration,
            $.alias_assign,
            // TODO: class_declaration
            // TODO: interface_declaration
            $.struct_declaration,
            $.union_declaration,
            $.enum_declaration,
            $.import_declaration,
            //     // TODO: conditional_declaration,
            //     // TODO: static_foreach_declaration,
            //     // TODO: static assert,
        ),

        // _aggr_decl: $ => choice(
        //     // TODO: $.class_declaration,
        //     // TODO: $.interface_declaration,
        //     // TODO: $.struct_declaration,
        //     // TODO: $.union_declaration
        // ),

        //
        // Variable Declarations
        //
        _var_declarations: $ => choice(
            seq(repeat($._storage_class), $._basic_type, $._declarators, ';'),
            $.auto_declaration,
        ),

        _declarators: $ => choice(
            $.declarator_initializer,
            seq($.declarator_initializer, ',', commaSep1($._declarator_id)),
        ),

        declarator_initializer: $ => choice(
            $._declarator,
            seq($._declarator,
                optional(paren(commaSep($._template_parameter))),
                $._equal,
                field('value', $._initializer)),
        ),

        _declarator_id: $ => choice(
            field('variable', $.identifier),
            seq(
                field('variable', $.identifier),
                optional(paren(commaSep($._template_parameter))),
                $._equal,
                field('value', $._initializer)),
        ),

        _declarator: $ => seq(repeat($._type_suffix), field('variable', $.identifier)),

        //
        // Storage Classes
        //
        _storage_class: $ => choice(
            $._linkage_attr,
            $.align_attr,
            // TODO: at_attr,
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
            seq('@', 'property'),
            'nothrow',
            'pure',
            'ref'
        ),

        //
        // Initializers
        //
        _initializer: $ => choice(
            $._expression,
            // TODO: struct initializer
        ),

        //
        // Auto Declaration
        //
        auto_declaration: $ => seq(repeat1($._storage_class), commaSep1($._auto_assignment), ';'),

        _auto_assignment: $ => seq(
            field('variable', $.identifier),
            optional(paren(commaSep($._template_parameter))),
            $._equal,
            field('value', $._initializer)),

        //
        // Alias Declaration
        //
        alias_declaration: $ => choice(
            seq('alias', repeat($._storage_class), $._basic_type, $._declarators, ';'),
            // TODO: seq('alias', repeat($._storage_class), $._basic_type, $._func_declarator, ';'),
            seq('alias', commaSep1($.alias_assignment)),
        ),
        alias_assignment: $ => choice(
            seq($.identifier,
                optional($._template_parameters), $._equal,
                repeat($._storage_class), $.type),
            seq($.identifier,
                optional($._template_parameters), $._equal,
                repeat($._storage_class), $.function_literal),
            // TODO: seq($.identifier, optional($._template_parameters), $._equal, $._basic_type, $._parameters, optional($.member_function_attributes)),
        ),

        //
        // Alias Assign (type alias)
        //
        alias_assign: $ => seq($.identifier, $._equal, $.type),

        //
        // 3.4 Types
        //
        type: $ => prec.left(seq(repeat($._type_ctor), $._basic_type, repeat($._type_suffix))),

        _type_ctor: $ => choice('const', 'immutable', 'inout', 'shared'),

        _basic_type: $ => prec.left(choice(
            $.scalar,
            seq($.dot, $._qualified_id),
            $._qualified_id,
            $.typeof,
            seq($.typeof, $.dot, $._qualified_id),
            seq($._type_ctor, paren($.type)),
            $._vector,
            // TODO: traits_expression
            $.mixin_type,
        )),

        _vector: $ => seq('__vector', paren($.type)),

        scalar: $ => choice( // aka fundamental type
            'bool',
            'byte',
            'ubyte',
            'short',
            'ushort',
            'int',
            'uint',
            'long',
            'ulong',
            'cent', // deprecated
            'ucent', // deprecated
            'char',
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

        _type_suffix: $ => choice(
            '*',
            bracket(),
            bracket($._expression),
            bracket($._expression, '..', $._expression),
            bracket($.type),
            // TODO: seq('delegate', $._parameters, optional($._member_function_attrs)),
            // TODO: seq('function', $._parameters, optional($._function_attrs)),
        ),

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

        //
        // Mixin Type
        //
        mixin_type: $ => seq('mixin', paren(field('arguments', $._arg_list))),

        //
        // 3.5 ATTRIBUTES
        //

        align_attr: $ => seq('align', optional(paren($._expression))),

        deprecated_attr: $ => seq('deprecated', optional(paren($._expression))),

        visibility_attr: $ => choice(
            'private',
            'package',
            seq('package', paren($._qualified_id)),
            'protected',
            'public',
            'export',
        ),

        user_defined_attr: $ => choice( // TODO: other formats, and fill in argument list!
            seq('@', field('name', $.identifier)),
            seq('@',
                field('name', $.identifier),
                paren(field('arguments', optional($._arg_list)))),
            seq('@', field('template', $.template_instance)),
            seq('@',
                field('template', $.template_instance,
                    paren(field('arguments', optional($._arg_list)))))
        ),

        _attr_specifier: $ => prec.left(seq($._attr, optional($._decl_block))),

        _attr: $ => prec.right(choice(
            $._linkage_attr,
            'static',
            'synchronized',
        )),

        _linkage_attr: $ => seq('extern',
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

        _namespace_list: $ => seq(commaSep1($._conditional_expression), optional(',')),

        _decl_block: $ => choice(
            $._decldef,
            seq('{', repeat($._decldef), '}')
        ),

        _arg_list: $ => seq(
            commaSep1($._expression), optional(',')),

        //
        // 3.6 PRAGMAS
        //
        pragma_declaraion: $ => choice(
            seq($.pragma, ';'),
            seq($.pragma, $._decl_block),
        ),

        pragma_stmt: $ => choice(
            seq($.pragma, ';'),
            // TODO: seq($.pragma, $.no_scope_stmt),
        ),

        pragma: $ => choice(
            seq('pragma', paren($.identifier)),
            seq('pragma', paren($.identifier, ',', $._arg_list)),
        ),

        //
        // 3.7 EXPRESSIONS
        //

        // in statements, most uses of expressions can use comma form
        _comma_expression: $ => commaSep1($._expression),

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
            // TODO: more (parenthesized, etc.)
            // 
        ),

        // Pretty much anything can be assigned to in D, because
        // of operator overloading.  Keywords and literals are the exception.
        _left_expression: $ => choice(
            $.assignment_expression,
            $._conditional_expression,
        ),

        // this includes all parts of expression *except* assignment
        // needed for a few other places
        _conditional_expression: $ => choice(
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
            // TODO: call_expr, parenthesized expr
        ),

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
                bracket(field('index', repeat1($._slice), optional(','))))
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
        // (Question: Why is this defined in the grammar as an expression rather than a statement?)
        //
        assert_expression: $ => seq('assert', paren(commaSep1($._expression), optional(','))),

        //
        // Mixin expression.  The result may be an lvalue.
        //
        mixin_expression: $ => seq('mixin', paren($._arg_list)),

        //
        // Import expression - evaluates to a string literal.
        //
        import_expression: $ => seq('import', paren($._expression)),

        new_expression: $ => prec.left(choice(
            seq('new', $.type),
            seq('new', $.type, bracket($._expression)),
            seq('new', $.type, paren(optional($._arg_list))),
            // TODO: newAnonClassExpression
        )),

        typeid_expression: $ => choice(
            seq('typeid', paren($.type)),
            seq('typeid', paren($._expression))
        ),

        is_expression: $ => prec.left(seq('is', choice(
            paren($.type, optional($.identifier)),
            paren($.type, optional($.identifier), ':', $._type_specialization),
            paren($.type, optional($.identifier), ':', $._type_specialization, ',', commaSep1($._template_parameter)),
            paren($.type, optional($.identifier), $.equalequal, $._type_specialization, ',', commaSep1($._template_parameter)),
        ))),

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

        function_literal: $ => choice(
            // TODO: function function ...
            // TODO: delegate ...
            // TODO: seq(optional(_ref_auto_ref), $_param_with_member_attrs, $._func_literal_body2
            // TODO: block_statement
            seq($.identifier, '=>', $._expression),
        ),

        _ref_auto_ref: $ => seq(optional('auto'), 'ref)'),

        _func_literal_body2: $ => choice(
            seq('=>', $._expression),
            // TODO: specified_function_body
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
            $._empty_statement,
            $._non_empty_statement,
        ),

        _empty_statement: $ => ';',

        _non_empty_statement: $ => choice(
            $._non_empty_statement_no_case_no_default,
            // TODO: caseStatement
            // TODO: caseRangeStatement
            // TODO: defaultStatement
        ),

        _scope_statement: $ => choice(
            $._non_empty_statement,
            $._block_statement,
        ),

        _non_empty_statement_no_case_no_default: $ => choice(
            $._labeled_statement,
            $._expression_statement,
            $._declaration_statement,
            $.if_statement,
            $.while_statement,
            $.do_statement,
            // TODO: many :-)
            // for_statement
            // foreach_statement
            $.switch_statement,
            $.final_switch_statement,
            $.continue_statement,
            $.break_statement,
            $.return_statement,
            $.goto_statement,
            $.with_statement,
            $.synchronized_statement,
            // try_statement
            // scope_guard_statement
            // asm_statement
            // mixin_statement
            // foreach_range_stateement
            // pragma_statement
            // conditional_statement
            // static_foreach_statement
            // static assert
            // template_mixin
            $.import_declaration,
        ),

        _labeled_statement: $ => seq('$identifier', ':', optional($._statement)),

        _block_statement: $ => brace(repeat($._statement)),

        _expression_statement: $ => seq(commaSep1($._statement), ';'),

        _declaration_statement: $ => seq(repeat($._storage_class), $._declaration),

        if_statement: $ =>
            seq('if',
                paren(field('condition', $._if_condition)),
                field('then', $._scope_statement),
                optional(seq('else', field('else', $._scope_statement)))),

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

        // TODO : for/foreach

        switch_statement: $ =>
            seq('switch', paren(commaSep1($._expression), $._scope_statement)),

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

        synchronized_statement: $ => choice(
            seq('synchronized', $._scope_statement),
            seq('synchronized', paren($._comma_expression), $._scope_statement)
        ),

        //
        // 3.9 Structs and Unions
        //

        struct_declaration: $ => choice(
            seq('struct', $.identifier, ';'),
            seq('struct', $.identifier, brace(repeat($._decldef))),
            seq('struct', brace(repeat($._decldef))), // anonymous struct
            // TODO: struct_template_declaration
        ),

        union_declaration: $ => choice(
            seq('union', $.identifier, ';'),
            seq('union', $.identifier, brace(repeat($._decldef))),
            seq('union', brace(repeat($._decldef))), // anonymous union
            // TODO: union_template_declaration
        ),

        //
        // 3.10 Classes
        //

        alias_this: $ => seq('alias', $.identifier, 'this', ';'),

        //
        // 3.11 Interfaces
        //
        interface_declaration: $ =>
            choice(
                seq('interface', $.identifier, ';'),
                // TODO: base interface
                // TODO: interface template Declaration
            ),

        //
        // 3.12 Enums
        //
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
        _enum_members: $=> commaSep1($.enum_member),

        _enum_member_attribute: $ =>
            choice(
                $.deprecated_attr,
                $.user_defined_attr,
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

        _anonymous_enum_members: $=> commaSep1($._anonymous_enum_member),


        //
        // 3.13 Functions
        //

        //
        // 3.14 Templates
        //

        template_instance: $ => prec.left(PREC.TEMPLATE, choice(
            seq($.identifier, '!', paren(optional($._template_argument))),
            seq($.identifier, '!', $._template_single_arg)
        )),

        _template_argument: $ => choice($.type, $._symbol, $._expression),

        _symbol: $ => seq(optional($.dot), $._symbol_tail),

        _symbol_tail: $ => prec.right(choice(
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
            // TODO: template_alias_parameter
            $._template_sequence_parameter,
        ),

        _template_parameters: $ => paren(commaSep($._template_parameter)),

        _template_type_parameter: $ => seq(
            optional('this'), // covers TemplateThisParameter
            $.identifier,
            optional(seq(':', $.type)),
            optional(seq('=', $.type))
        ),

        _template_value_parameter: $ => prec.left(PREC.TEMPLATE, seq(
            $._basic_type,
            $._declarator,
            optional(seq(':', $._conditional_expression)),
            optional(seq('=', choice($._expression, $._special_keyword))))),

        _template_sequence_parameter: $ => seq($.identifier, '...'),

    },

    conflicts: $ => [
        [
            $.deprecated_attr,
            $._storage_class,
        ],
        [
            $._storage_class,
            $._type_ctor,
        ],
        [
            $._storage_class,
            $._attr,
        ],
        [
            $._basic_type,
            $._expression,
        ],
        [
            $._initializer,
            $._kv_pair,
        ],
        [
            $.mixin_type,
            $.mixin_expression,
        ],
        [
            $.mixin_type,
            $.mixin_declaration,
        ],
        [
            $._symbol_tail,
            $._conditional_expression,
        ],
        [
            $._storage_class,
            $.enum_declaration
        ]
    ],
})

function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)))
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