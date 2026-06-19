/// <reference types="node" />

const assert = require("node:assert");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const Parser = require("tree-sitter");
const Query = Parser.Query;
const D = require(".");

const QUERIES_DIR = path.join(__dirname, "..", "..", "queries");

// Read a query file, verify it compiles against the grammar, and return its
// capture names. Constructing the Query throws if the query is malformed or
// references a node type the grammar doesn't have, so this doubles as a
// "queries still compile" guard against future grammar drift. The capture
// names are read straight from the source text (node-tree-sitter 0.21 doesn't
// expose them on the compiled Query).
function loadCaptureNames(file) {
  const src = fs.readFileSync(path.join(QUERIES_DIR, file), "utf8");
  new Query(D, src); // throws on a malformed query or unknown node type
  const names = [...src.matchAll(/@([A-Za-z0-9_.]+)/g)].map((m) => m[1]);
  assert.ok(names.length > 0, `${file}: no captures found`);
  return names;
}

// The base objects every textobjects file is expected to define, regardless
// of which suffix convention the editor uses.
const REQUIRED_OBJECTS = ["function", "class", "comment", "parameter", "test"];

function assertTextobjects(file, suffixRe, forbiddenRe) {
  const names = loadCaptureNames(file);

  // Every capture must use this file's suffix convention. This catches both
  // a wrong convention (e.g. .inside/.around in the nvim file, see #59) and
  // typos like `test.insid` that match neither convention.
  for (const name of names) {
    assert.match(name, suffixRe, `${file}: capture "${name}" violates the suffix convention`);
    assert.doesNotMatch(name, forbiddenRe, `${file}: capture "${name}" uses the wrong convention`);
  }

  // Sanity-check that the core objects are present, so a gutted or garbled
  // file can't pass just by having zero offending captures.
  const objects = new Set(names.map((n) => n.split(".")[0]));
  for (const obj of REQUIRED_OBJECTS) {
    assert.ok(objects.has(obj), `${file}: missing "${obj}" textobject`);
  }
}

// nvim-treesitter-textobjects convention: .inner / .outer
test("textobjects.scm uses the inner/outer convention", () => {
  assertTextobjects("textobjects.scm", /\.(inner|outer)$/, /\.(inside|around)$/);
});

// Helix convention: .inside / .around
test("helix-textobjects.scm uses the inside/around convention", () => {
  assertTextobjects("helix-textobjects.scm", /\.(inside|around)$/, /\.(inner|outer)$/);
});
