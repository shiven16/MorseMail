from dataclasses import dataclass, field
from typing import List, Optional

@dataclass(frozen=True)
class Position:
    offset: int
    line: int
    column: int

@dataclass(frozen=True)
class Span:
    start: Position
    end: Position

@dataclass(frozen=True)
class Diagnostic:
    phase: str
    message: str
    span: Span

class CompilationError(Exception):
    def __init__(self, diagnostic: Diagnostic):
        self.diagnostic = diagnostic
        super().__init__(diagnostic.message)

@dataclass(frozen=True)
class Token:
    kind: str
    value: str
    span: Span
    leading_hws: int = 0
    content_start: Optional[Position] = None

@dataclass(frozen=True)
class Statement:
    operation: str
    value: str
    span: Span
    argument_span: Span
    content_start: Position

@dataclass(frozen=True)
class Program:
    statements: List[Statement]

@dataclass(frozen=True)
class OperationIR:
    operation: str
    words: List[List[str]]
    text: str
    source_span: Span

@dataclass(frozen=True)
class SignalEvent:
    kind: str
    units: int

@dataclass(frozen=True)
class Output:
    operation: str
    text: str
    notation: str
    events: List[SignalEvent]
    source_span: Span

@dataclass
class CompilationResult:
    ok: bool
    diagnostics: List[Diagnostic] = field(default_factory=list)
    tokens: List[Token] = field(default_factory=list)
    ast: Optional[Program] = None
    ir: List[OperationIR] = field(default_factory=list)
    outputs: List[Output] = field(default_factory=list)
