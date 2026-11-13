"""Loopback-only UI and bounded JSON compile endpoint."""
import json
from dataclasses import asdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from .compiler import compile_source
WEB=Path(__file__).with_name('web')
LIMIT=65536

class Handler(BaseHTTPRequestHandler):
    def reply(self,status,data,content_type='application/json; charset=utf-8'):
        body=json.dumps(data).encode() if isinstance(data,dict) else data
        self.send_response(status)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('X-Content-Type-Options','nosniff')
        self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        assets={'/':('index.html','text/html'),'/export.js':('export.js','text/javascript'),'/studio.js':('studio.js','text/javascript'),'/fonts/Manrope-OFL.txt':('fonts/Manrope-OFL.txt','text/plain'),'/fonts/PlexMono-OFL.txt':('fonts/PlexMono-OFL.txt','text/plain'),'/fonts/manrope.ttf':('fonts/manrope.ttf','font/ttf'),'/fonts/plex-mono.ttf':('fonts/plex-mono.ttf','font/ttf'),'/ast.js':('ast.js','text/javascript'),'/stages.js':('stages.js','text/javascript'),'/app.js':('app.js','text/javascript'),'/player.js':('player.js','text/javascript'),'/styles.css':('styles.css','text/css')}
        asset=assets.get(self.path.split('?')[0])
        if not asset: self.reply(404,{'error':'Not found'}); return
        self.reply(200,(WEB/asset[0]).read_bytes(),asset[1] if asset[1].startswith('font/') else asset[1]+'; charset=utf-8')
    def do_POST(self):
        if self.path!='/api/compile': self.reply(404,{'error':'Not found'}); return
        if self.headers.get('Origin') and self.headers['Origin']!=f'http://{self.headers.get("Host")}':
            self.reply(403,{'error':'Same-origin requests only'}); return
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size<1 or size>LIMIT: self.reply(413,{'error':'Source request must be 1–65536 bytes'}); return
            data=json.loads(self.rfile.read(size))
            if not isinstance(data,dict) or not isinstance(data.get('source'),str): raise ValueError()
        except (ValueError,UnicodeError): self.reply(400,{'error':'Expected JSON with a source string'}); return
        self.reply(200,asdict(compile_source(data['source'])))
    def log_message(self,*args): pass

def serve(port=8765):
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    print(f'Morse Mail → http://127.0.0.1:{server.server_port}',flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
