"""Validate content, preserving source locations and word boundaries."""
from .contracts import OperationIR, Position, Span, Diagnostic, CompilationError
from .morse import MORSE, REVERSE

def analyze(program, source):
    result=[]
    for stmt in program.statements:
        value=stmt.value
        def fail(message,index=None,length=1):
            if index is None: span=stmt.argument_span
            else:
                p=stmt.content_start
                start=Position(p.offset+index,p.line,p.column+index)
                span=Span(start,Position(start.offset+length,start.line,start.column+length))
            raise CompilationError(Diagnostic('semantic',message,span))
        if stmt.operation=='SEND':
            normalized=''.join(chr(ord(c)-32) if 'a'<=c<='z' else c for c in value)
            for index,c in enumerate(normalized):
                if c==' ':
                    if index==0 or index==len(value)-1: fail('SEND text cannot begin or end with a word boundary',index)
                elif c not in MORSE: fail(f'unsupported SEND character {value[index]!r}',index)
            text=' '.join(word for word in normalized.split(' ') if word)
            words=[[MORSE[c] for c in word] for word in text.split(' ')] if text else []
        else:
            words=[]; current=[]; i=0; pending=None
            while i<len(value):
                c=value[i]
                if c==' ': i+=1; continue
                if c=='/':
                    if not current: fail('word separator must have a character group on both sides',i)
                    words.append(current); current=[]; pending=i; i+=1; continue
                if c not in '.-': fail(f'invalid Morse symbol {c!r}',i)
                start=i
                while i<len(value) and value[i] in '.-': i+=1
                group=value[start:i]
                if i<len(value) and value[i] not in ' /': fail(f'invalid Morse symbol {value[i]!r}',i)
                if group not in REVERSE: fail(f'invalid Morse group {group!r}',start,len(group))
                current.append(group); pending=None
            if pending is not None: fail('word separator must have a character group on both sides',pending)
            if current: words.append(current)
            if not words: fail('DECODE input must contain at least one Morse group')
            text=' '.join(''.join(REVERSE[g] for g in word) for word in words)
        result.append(OperationIR(stmt.operation,words,text,stmt.span))
    return result
