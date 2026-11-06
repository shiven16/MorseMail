import unittest
from morsemail.compiler import compile_source
from morsemail.morse import MORSE, REVERSE

class SemanticTests(unittest.TestCase):
    def test_valid_cases(self):
        cases=[('SEND "SOS"','... --- ...'),('SEND "A  B"','.- / -...'),('SEND "A1?"','.- .---- ..--..'),('SEND "A/B"','.- -..-. -...'),('SEND ""',''),('SEND "!&;=_$@"','-.-.-- .-... -.-.-. -...- ..--.- ...-..- .--.-.'),('DECODE "... --- ..."','SOS'),('DECODE ".-  -..."','AB'),('DECODE "-..-."','/'),('DECODE ".-..-."','"'),('DECODE ".../---"','S O'),('DECODE " ... / --- "','S O'),('DECODE ".- .-.-.-"','A.')]
        for source,expected in cases:
            with self.subTest(source=source):
                result=compile_source(source);self.assertTrue(result.ok,result.diagnostics)
                output=result.outputs[0]
                self.assertEqual(output.notation if output.operation=='SEND' else output.text,expected)
    def test_hello(self):
        result=compile_source('SEND "Hello World"')
        self.assertEqual(result.outputs[0].text,'HELLO WORLD')
        self.assertEqual(result.outputs[0].notation,'.... . .-.. .-.. --- / .-- --- .-. .-.. -..')
    def test_all_mappings(self):
        self.assertEqual(len(MORSE),54);self.assertEqual(len(REVERSE),54)
        for character,code in MORSE.items():
            with self.subTest(character=character):
                self.assertEqual(compile_source(f'DECODE "{code}"').outputs[0].text,character)
                if character!='"': self.assertEqual(compile_source(f'SEND "{character}"').outputs[0].notation,code)
    def test_errors(self):
        cases=[('SEND "CAFÉ"',10),('SEND "é"',7),('SEND "#"',7),('SEND " A"',7),('SEND "A "',8),('SEND " "',7),('DECODE ".-x"',11),('DECODE "..--"',9),('DECODE "/ ..."',9),('DECODE "... / / ---"',15),('DECODE ".../"',12),('DECODE "...//---"',13),('DECODE ""',8),('DECODE "   "',8)]
        for source,col in cases:
            with self.subTest(source=source):
                result=compile_source(source);self.assertFalse(result.ok)
                self.assertEqual(result.diagnostics[0].phase,'semantic')
                self.assertEqual(result.diagnostics[0].span.start.column,col)
                self.assertEqual(result.outputs,[])
    def test_ascii_lowercase_roundtrip(self):
        text='abcdefghijklmnopqrstuvwxyz 0123456789 !&;=_$@'
        enc=compile_source(f'SEND "{text}"').outputs[0]
        self.assertEqual(compile_source(f'DECODE "{enc.notation}"').outputs[0].text,text.upper())
    def test_multiline_unicode_position(self):
        r=compile_source('SEND "OK"\n\tSEND "é"')
        self.assertEqual((r.diagnostics[0].span.start.line,r.diagnostics[0].span.start.column),(2,15))

    def test_random_roundtrips(self):
        import random
        rng=random.Random(42)
        alphabet=''.join(c for c in MORSE if c!='"')+'abcdefghijklmnopqrstuvwxyz'
        for _ in range(200):
            words=[''.join(rng.choice(alphabet) for _ in range(rng.randint(1,15))) for _ in range(rng.randint(1,5))]
            text=(' ' * rng.randint(1,4)).join(words)
            enc=compile_source(f'SEND "{text}"')
            self.assertTrue(enc.ok)
            decoded=compile_source(f'DECODE "{enc.outputs[0].notation}"')
            self.assertEqual(decoded.outputs[0].text,' '.join(words).upper())
