"""Small recursive-descent parser; string meaning belongs to semantics."""
from .contracts import Program, Statement, Span, Diagnostic, CompilationError

def parse(tokens):
    i=0; statements=[]
    def fail(message,token):
        raise CompilationError(Diagnostic('syntax',message,token.span))
    while tokens[i].kind!='EOF':
        if tokens[i].kind=='NEWLINE': i+=1; continue
        command=tokens[i]
        if command.kind not in ('SEND','DECODE'): fail('expected SEND or DECODE',command)
        i+=1; argument=tokens[i]
        if argument.kind!='STRING': fail(f'expected STRING after {command.kind}',argument)
        if not argument.leading_hws: fail(f'expected horizontal whitespace after {command.kind}',argument)
        statements.append(Statement(command.kind,argument.value,Span(command.span.start,argument.span.end),argument.span,argument.content_start))
        i+=1
        if tokens[i].kind not in ('NEWLINE','EOF'): fail('expected newline or end of input after statement',tokens[i])
    return Program(statements)
