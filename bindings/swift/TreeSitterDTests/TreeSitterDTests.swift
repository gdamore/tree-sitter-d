import XCTest
import SwiftTreeSitter
import TreeSitterD

final class TreeSitterDTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_d())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading D grammar")
    }
}
