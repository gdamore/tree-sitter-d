module.exports = grammar({

    name: 'd',

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
        $._rbrace,
        $._lbrace,
        $._div,
        $._div_eq,
        $.S_AND,        // &
        $.S_AND_EQ,     // &=
        $.S_AND_AND,    // &&
        $.S_OR,         // |
        $.S_OR_EQ,      // |=
        $.S_OR_OR,      // ||
        $.S_MINUS,      // -
        $.S_MINUS_EQ,   // -=
        $.S_DEC,        // --
        $.S_PLUS,       // +
        $.S_PLUS_EQ,    // +=
        $.S_INC,        // ++
        $.S_LT,         // <
        $.S_LTE,        // <=
        $.S_LSHIFT,     // <<
        $.S_LSHIFT_EQ,  // <<=
        $.S_GT,         // >
        $.S_GTE,        // >=
        $.S_RSHIFT_EQ,  // >>=
        $.S_URSHIFT_EQ, // >>>=
        $.S_RSHIFT,     // >>
        $.S_URSHIFT,    // >>>
        $.S_NOT,        // !
        $.S_NOT_EQ,     // !=
        $.S_LPAREN,     // (
        $.S_RPAREN,     // )
        $.S_LBRACKET,   // []
        $.S_RBRACKET,   // ]
        $.S_QUEST,      // ?
        $.S_COMMA,      // ,
        $.S_SEMI,       // ;
        $.S_COLON,      // :
        $.S_DOLLAR,     // $
        $.S_EQ,         // =
        $.S_EQ_EQ,      // ==
        $.S_LAMBDA,     // =>
        $.S_MUL,        // *
        $.S_MUL_EQ,     // *=
        $.S_MOD,        // %
        $.S_MOD_EQ,     // %=
        $.S_XOR,        // ^
        $.S_XOR_EQ,     // ^=
        $.S_POW,        // ^^
        $.S_POW_EQ,     // ^^=
        $.S_TILDE,      // ~
        $.S_APPEND,     // ~=
        $.S_AT,         // @
        $.S_BOM,        // \uFEFF
        $.S_DOT,        // .
        $.S_RANGE,      // ..
        $.S_ELLIPSES,   // ...
        $.K_ABSTRACT,
        $.K_ALIAS,
        $.K_ALIGN,
        $.K_ASM,
        $.K_ASSERT,
        $.K_AUTO,
        $.K_BODY, // obsolete
        $.K_BOOL,
        $.K_BREAK,
        $.K_BYTE,
        $.K_CASE,
        $.K_CAST,
        $.K_CATCH,
        $.K_CDOUBLE, // obsolete
        $.K_CENT,    // obsolete
        $.K_CFLOAT,  // obsolete
        $.K_CHAR,
        $.K_CLASS,
        $.K_CONST,
        $.K_CONTINUE,
        $.K_CREAL, // obsolete
        $.K_DCHAR,
        $.K_DEBUG,
        $.K_DEFAULT,
        $.K_DELEGATE,
        $.K_DELETE, // obsolete
        $.K_DEPRECATED,
        $.K_DO,
        $.K_DOUBLE,
        $.K_ELSE,
        $.K_ENUM,
        $.K_EXPORT,
        $.K_EXTERN,
        $.K_FALSE,
        $.K_FINAL,
        $.K_FINALLY,
        $.K_FLOAT,
        $.K_FOR,
        $.K_FOREACH,
        $.K_FOREACH_REVERSE,
        $.K_FUNCTION,
        $.K_GOTO,
        $.K_IDOUBLE, // obsolete
        $.K_IF,
        $.K_IFLOAT, // obsolete
        $.K_IMMUTABLE,
        $.K_IMPORT,
        $.K_IN,
        $.K_INOUT,
        $.K_INT,
        $.K_INTERFACE,
        $.K_INVARIANT,
        $.K_IREAL,
        $.K_IS,
        $.K_LAZY,
        $.K_LONG,
        $.K_MACRO,
        $.K_MIXIN,
        $.K_MODULE,
        $.K_NEW,
        $.K_NOTHROW,
        $.K_NULL,
        $.K_OUT,
        $.K_OVERRIDE,
        $.K_PACKAGE,
        $.K_PRAGMA,
        $.K_PRIVATE,
        $.K_PROTECTED,
        $.K_PUBLIC,
        $.K_PURE,
        $.K_REAL,
        $.K_REF,
        $.K_RETURN,
        $.K_SCOPE,
        $.K_SHARED,
        $.K_SHORT,
        $.K_STATIC,
        $.K_STRUCT,
        $.K_SUPER,
        $.K_SWITCH,
        $.K_SYNCHRONIZED,
        $.K_TEMPLATE,
        $.K_THIS,
        $.K_THROW,
        $.K_TRUE,
        $.K_TRY,
        $.K_TYPEID,
        $.K_TYPEOF,
        $.K_UBYTE,
        $.K_UCENT,
        $.K_UINT,
        $.K_ULONG,
        $.K_UNION,
        $.K_UNITTEST,
        $.K_USHORT,
        $.K_VERSION,
        $.K_VOID,
        $.K_WCHAR,
        $.K_WHILE,
        $.K_WITH,
        $.K__FILE,
        $.K__FILE_FULL_PATH,
        $.K__MODULE,
        $.K__LINE,
        $.K__FUNCTION,
        $.K__PRETTY_FUNCTION,
        $.K__GSHARED,
        $.K__TRAITS,
        $.K__VECTOR,
        $.K__PARAMETERS,
        $.K__DATE,      // string literal date
        $.K__EOF,       // end of file - ends scanning
        $.K__TIME,      // string literal time
        $.K__TIMESTAMP, // string literal timestamp
        $.K__VENDOR,    // string literal vendor
        $.K__VERSION,   // integer literal version
    ],

    extras: $ => [
        /[ \t\r\n\u2028\u2029]/,
        $.comment,
        $.directive,
    ],

    word: $ => $.identifier,

    rules: {
        source_file: $ => seq(optional(choice($.bom, $.shebang)),
            repeat($._module)),

        _module: $ => choice($.identifier, $.int_literal, $.float_literal, $.char_literal, $.string_literal),
        string_literal: $ => choice($._dqstring, $._bqstring, $._rqstring),
    }
})