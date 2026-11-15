"""Run the interactive UI or compile files from the terminal."""
import argparse,json,sys
from pathlib import Path
from dataclasses import asdict
from .compiler import compile_source
from .player import render_player

def main(argv=None):
    argv=sys.argv[1:] if argv is None else argv
    if argv and argv[0]=='serve':
        parser=argparse.ArgumentParser(); parser.add_argument('--port',type=int,default=8765)
        args=parser.parse_args(argv[1:])
        from .server import serve
        serve(args.port); return 0
    parser=argparse.ArgumentParser(description='Compile MorseScript or run `python -m morsemail serve`.')
    parser.add_argument('file'); parser.add_argument('--inspect',action='store_true'); parser.add_argument('--json',action='store_true'); parser.add_argument('--html')
    args=parser.parse_args(argv)
    try:
        with Path(args.file).open(encoding='utf-8',newline='') as stream:
            source=stream.read()
    except (OSError,UnicodeError) as exc: print(f'File error: {exc}',file=sys.stderr); return 2
    result=compile_source(source)
    if args.json or args.inspect: print(json.dumps(asdict(result),indent=2,ensure_ascii=False))
    if not result.ok:
        for d in result.diagnostics: print(f'{d.span.start.line}:{d.span.start.column}: {d.phase}: {d.message}',file=sys.stderr)
        if args.html: print('No new player generated.',file=sys.stderr)
        return 1
    if not (args.json or args.inspect):
        for o in result.outputs: print(o.notation if o.operation=='SEND' else o.text)
    if args.html:
        try:
            path=Path(args.html); path.parent.mkdir(parents=True,exist_ok=True); path.write_text(render_player(result),encoding='utf-8')
        except OSError as exc: print(f'Export error: {exc}',file=sys.stderr); return 2
    return 0
