==================
Named bitfield
==================

struct s {
	int x : 3;
}

---

(source_file
  (struct_declaration
    (struct)
    (identifier)
    (aggregate_body
      (variable_declaration
        (type
          (int))
        (bitfield_declarator
          (identifier)
          (int_literal))))))

==================
Multiple bitfields on one line
==================

struct s {
	uint a : 5, flags : 3;
}

---

(source_file
  (struct_declaration
    (struct)
    (identifier)
    (aggregate_body
      (variable_declaration
        (type
          (uint))
        (bitfield_declarator
          (identifier)
          (int_literal))
        (bitfield_declarator
          (identifier)
          (int_literal))))))

==================
Bitfield with initializer and anonymous padding
==================

struct s {
	int x : 3 = 2;
	int : 0;
}

---

(source_file
  (struct_declaration
    (struct)
    (identifier)
    (aggregate_body
      (variable_declaration
        (type
          (int))
        (bitfield_declarator
          (identifier)
          (int_literal)
          (int_literal)))
      (variable_declaration
        (type
          (int))
        (bitfield_declarator
          (int_literal))))))
