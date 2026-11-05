import unittest
from morsemail.lexer import lex
from morsemail.parser import parse
from morsemail.contracts import CompilationError

class ParserTests(unittest.TestCase):
    def test_program(self):
        p=parse(lex('\nSEND "A"\n\nDECODE "-..."\n'))
        self.assertEqual([s.operation for s in p.statements],['SEND','DECODE'])
        self.assertEqual(p.statements[0].value,'A')
        self.assertEqual(p.statements[0].content_start.column,7)
    def test_empty(self):
        for source in ['','\n\n',' \t\n ']: self.assertEqual(parse(lex(source)).statements,[])
    def test_final_newline_optional(self):
        self.assertEqual(len(parse(lex('SEND "A"')).statements),1)
    def test_semantics_not_checked(self): self.assertEqual(parse(lex('DECODE "..--"')).statements[0].value,'..--')
    def test_errors(self):
        for source,col in [('SEND',5),('SEND"A"',5),('SEND "A" DECODE ".-"',10),('SEND "A" "B"',10),('"A"',1),('SEND\n"A"',5)]:
            with self.subTest(source=source),self.assertRaises(CompilationError) as ctx: parse(lex(source))
            self.assertEqual(ctx.exception.diagnostic.phase,'syntax')
            self.assertEqual(ctx.exception.diagnostic.span.start.column,col)
