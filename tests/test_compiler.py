import unittest
from unittest.mock import patch
from morsemail.compiler import compile_source

class CompilerTests(unittest.TestCase):
    def test_order(self):
        r=compile_source('SEND "A"\nDECODE "-..."');self.assertTrue(r.ok)
        self.assertEqual([o.text for o in r.outputs],['A','B'])
        self.assertEqual([o.source_span.start.line for o in r.outputs],[1,2])
    def test_no_partial_output(self):
        r=compile_source('SEND "A"\nDECODE "..--"')
        self.assertFalse(r.ok);self.assertEqual(r.outputs,[]);self.assertEqual(r.ir,[])
    def test_earlier_phase_wins(self):
        r=compile_source('DECODE "..--"\nsend "SOS"')
        self.assertEqual(r.diagnostics[0].phase,'lexical')
    def test_failure_prevents_later_phases(self):
        with patch('morsemail.compiler.parse') as parser:
            compile_source('send "A"');parser.assert_not_called()
    def test_programming_error_visible(self):
        with patch('morsemail.compiler.lex',side_effect=RuntimeError('bug')):
            with self.assertRaises(RuntimeError):compile_source('')
    def test_empty(self):
        r=compile_source('');self.assertTrue(r.ok);self.assertEqual(r.outputs,[])
