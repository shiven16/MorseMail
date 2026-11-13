"""Pure, side-effect-free phase orchestration."""
from .contracts import CompilationResult, CompilationError
from .lexer import lex
from .parser import parse
from .semantic import analyze
from .codegen import generate

def compile_source(source):
    result=CompilationResult(ok=False)
    try:
        result.tokens=lex(source)
        result.ast=parse(result.tokens)
        result.ir=analyze(result.ast,source)
        result.outputs=generate(result.ir)
        result.ok=True
    except CompilationError as exc:
        result.diagnostics=[exc.diagnostic]
        result.outputs=[]
    return result
