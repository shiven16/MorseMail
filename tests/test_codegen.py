import unittest
from morsemail.compiler import compile_source
from morsemail.codegen import lower

class CodegenTests(unittest.TestCase):
    def test_exact_boundaries(self):
        for words,events in [([],[]),([['.']],[('MARK',1)]),([['-']],[('MARK',3)]),([['.','.']],[('MARK',1),('GAP',3),('MARK',1)]),([['.'],['.']],[('MARK',1),('GAP',7),('MARK',1)]),([['.-']],[('MARK',1),('GAP',1),('MARK',3)])]:
            with self.subTest(words=words):self.assertEqual([(e.kind,e.units) for e in lower(words)],events)
    def test_sos(self):
        events=lower([['...','---','...']])
        self.assertEqual(sum(e.units for e in events),27)
        self.assertEqual(len(events),17)
        self.assertEqual(events[0].kind,'MARK');self.assertEqual(events[-1].kind,'MARK')
    def test_decode_no_events(self): self.assertEqual(compile_source('DECODE "..."').outputs[0].events,[])
    def test_empty_no_events(self): self.assertEqual(compile_source('SEND ""').outputs[0].events,[])
