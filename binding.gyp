{
  "targets": [
    {
      "target_name": "tree_sitter_d_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
      ],
      "include_dirs": [
        "src",
      ],
      "sources": [
        "bindings/node/binding.cc",
        "src/parser.c",
	"src/scanner.c",
        # NOTE: if your language has an external scanner, add it here.
      ],
      "cflags_c": [
        "-std=c11",
      ],
      # Recent Node.js releases ship a config.gypi that builds with thin LTO
      # and forward the clang/lld options (-flto=thin and /opt:lldltojobs=2)
      # into every native addon's compile and link lines. MSVC's link.exe
      # rejects /opt:lldltojobs=2 with "LNK1117: syntax error", which breaks
      # the Windows build. We have no need for LTO on this small binding, so
      # strip those inherited options on every platform.
      "cflags!": [ "-flto", "-flto=thin" ],
      "cflags_c!": [ "-flto", "-flto=thin" ],
      "cflags_cc!": [ "-flto", "-flto=thin" ],
      "ldflags!": [ "-flto", "-flto=thin", "/opt:lldltojobs=2" ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "AdditionalOptions!": [ "-flto", "-flto=thin" ],
        },
        "VCLinkerTool": {
          "AdditionalOptions!": [ "-flto", "-flto=thin", "/opt:lldltojobs=2" ],
        },
      },
    }
  ]
}
