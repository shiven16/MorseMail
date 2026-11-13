"""Lower validated groups to canonical notation and timed instructions."""
from .contracts import SignalEvent, Output

def lower(words):
    events=[]
    for wi,word in enumerate(words):
        if wi: events.append(SignalEvent('GAP',7))
        for ci,group in enumerate(word):
            if ci: events.append(SignalEvent('GAP',3))
            for mi,mark in enumerate(group):
                if mi: events.append(SignalEvent('GAP',1))
                events.append(SignalEvent('MARK',1 if mark=='.' else 3))
    return events

def generate(ir):
    return [Output(op.operation,op.text,' / '.join(' '.join(w) for w in op.words),lower(op.words) if op.operation=='SEND' else [],op.source_span) for op in ir]
