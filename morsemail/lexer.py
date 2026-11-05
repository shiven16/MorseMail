"""Source scanning with scalar offsets and explicit horizontal trivia."""
import unicodedata
from .contracts import Position, Span, Token, Diagnostic, CompilationError

def lex(source):
    tokens=[]; i=0; line=1; col=1; hws=0
    def pos(): return Position(i,line,col)
    def fail(message,start,end=None):
        raise CompilationError(Diagnostic("lexical",message,Span(start,end or Position(start.offset+1,start.line,start.column+1))))
    while i<len(source):
        c=source[i]
        if c in ' \t':
            hws+=1; i+=1; col=col+1 if c==' ' else ((col-1)//8+1)*8+1; continue
        start=pos()
        if c in '\r\n':
            i+=2 if c=='\r' and source[i:i+2]=='\r\n' else 1
            line+=1; col=1
            tokens.append(Token('NEWLINE','\n',Span(start,pos()),hws)); hws=0; continue
        if c=='"':
            i+=1; col+=1; content=pos(); body=[]
            while i<len(source) and source[i]!='"':
                c=source[i]
                if c in '\r\n': fail('unterminated string',start)
                if (c.isspace() and c!=' ') or unicodedata.category(c).startswith('C'):
                    fail('character is not permitted inside a string',pos())
                body.append(c); i+=1; col+=1
            if i==len(source): fail('unterminated string',start)
            i+=1; col+=1
            tokens.append(Token('STRING',''.join(body),Span(start,pos()),hws,content)); hws=0; continue
        if c.isascii() and c.isalpha():
            begin=i
            while i<len(source) and (source[i].isascii() and (source[i].isalnum() or source[i]=='_')):
                i+=1; col+=1
            word=source[begin:i]
            if word not in ('SEND','DECODE'): fail(f"unknown command '{word}' (keywords are case-sensitive)",start,pos())
            tokens.append(Token(word,word,Span(start,pos()),hws)); hws=0; continue
        fail(f"invalid character {c!r}",start)
    tokens.append(Token('EOF','',Span(pos(),pos()),hws))
    return tokens
