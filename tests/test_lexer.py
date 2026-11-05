import unittest
from morsemail.lexer import lex
from morsemail.contracts import CompilationError

class LexerTests(unittest.TestCase):
    def test_tokens_and_spans(self):
        tokens=lex('SEND "SOS"')
        self.assertEqual([t.kind for t in tokens],['SEND','STRING','EOF'])
        self.assertEqual(tokens[1].value,'SOS')
        self.assertEqual(tokens[1].content_start.column,7)
        self.assertEqual(tokens[1].leading_hws,1)
        self.assertEqual(tokens[-1].span.start.column,11)
    def test_line_endings(self):
        for newline in ['\n','\r\n','\r']:
            with self.subTest(newline=newline):
                tokens=lex('SEND "A"'+newline+'DECODE "."')
                self.assertEqual(tokens[2].kind,'NEWLINE')
                self.assertEqual(tokens[3].span.start.line,2)
                self.assertEqual(tokens[3].span.start.column,1)
    def test_tab_stops(self):
        tokens=lex('\tSEND\t"A"')
        self.assertEqual(tokens[0].span.start.column,9)
        self.assertEqual(tokens[1].span.start.column,17)
        self.assertEqual(tokens[1].leading_hws,1)
    def test_empty(self): self.assertEqual([t.kind for t in lex('')],['EOF'])
    def test_empty_string(self): self.assertEqual(lex('SEND ""')[1].value,'')
    def test_keyword_without_space(self): self.assertEqual(lex('SEND"A"')[1].leading_hws,0)
    def test_unicode_reaches_semantics(self): self.assertEqual(lex('SEND "é"')[1].value,'é')
    def test_keywords_inside_strings(self): self.assertEqual(lex('SEND "DECODE"')[1].value,'DECODE')
    def test_errors(self):
        for source,column in [('send "SOS"',1),('SENDX "A"',1),('SEND "A" #',10),('SEND "SOS',6),('SEND "A\nB"',6),('SEND "A\tB"',8),('SEND "\x00"',7),('SEND "\u200b"',7),('SEND "\u00a0"',7),('DECODE 123',8)]:
            with self.subTest(source=source),self.assertRaises(CompilationError) as ctx: lex(source)
            self.assertEqual(ctx.exception.diagnostic.phase,'lexical')
            self.assertEqual(ctx.exception.diagnostic.span.start.column,column)
