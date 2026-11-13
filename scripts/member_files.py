"""List/check exact ownership, optionally stage one member's files. Never commit/push."""
import argparse,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--member',choices=['1','2','3','4','5'])
    parser.add_argument('--stage',action='store_true')
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    manifest=json.loads((ROOT/'docs/file_ownership.json').read_text())
    listed=[path for member in manifest['members'].values() for path in member['files']]
    if args.check:
        actual={str(p.relative_to(ROOT)) for folder in ['morsemail','tests','scripts','docs','.github'] for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts}
        actual.update(str(p.relative_to(ROOT)) for p in (ROOT/'examples').glob('*') if p.is_file())
        actual.update(['README.md','.gitignore'])
        duplicates=sorted({p for p in listed if listed.count(p)>1})
        missing=sorted(actual-set(listed)); nonexistent=sorted(set(listed)-actual)
        if duplicates or missing or nonexistent:
            print(json.dumps({'duplicates':duplicates,'unassigned':missing,'nonexistent':nonexistent},indent=2));return 1
        print(f'Ownership verified: {len(listed)} files, exactly one owner each.');return 0
    if not args.member:parser.error('--member is required unless using --check')
    files=manifest['members'][args.member]['files']
    print('\n'.join(files))
    if args.stage:subprocess.run(['git','add','--',*files],cwd=ROOT,check=True)
    return 0
if __name__=='__main__':raise SystemExit(main())
