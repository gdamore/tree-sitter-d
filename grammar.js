module.exports = grammar({

    name: 'd',

    externals: $ => [
        $.endFile,
        $.lineComment,
        $.blockComment,
        $.nestingComment,
        $.identifier,
        $.bom,
        $.directive,
        $.shebang,
    ],

    extras: $=> [
        /[ \t\r\n\u2028\u2029]/,
        $.lineComment,
        $.blockComment,
        $.nestingComment,
        $.directive,
    ],

    word: $ => $.identifier,

    rules: {
        source_file: $=> seq(optional(choice($.bom, $.shebang)), repeat($.identifier))
    }
})