import http.client,json,threading,unittest
from http.server import ThreadingHTTPServer
from morsemail.server import Handler

class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.thread.join()
    def request(self,method,path,body=None,headers=None):
        conn=http.client.HTTPConnection('127.0.0.1',self.server.server_port)
        conn.request(method,path,body,headers or {});response=conn.getresponse();data=response.read();status=response.status;conn.close();return status,data
    def test_ui_assets(self):
        for path in ['/','/styles.css','/app.js','/player.js','/stages.js','/ast.js','/studio.js','/export.js','/fonts/Manrope-OFL.txt','/fonts/PlexMono-OFL.txt']:
            self.assertEqual(self.request('GET',path)[0],200)
    def test_compile(self):
        status,data=self.request('POST','/api/compile',json.dumps({'source':'SEND "SOS"'}))
        self.assertEqual(status,200);self.assertEqual(json.loads(data)['outputs'][0]['notation'],'... --- ...')
    def test_compiler_error_is_result(self):
        status,data=self.request('POST','/api/compile',json.dumps({'source':'SEND'}));self.assertEqual(status,200);self.assertFalse(json.loads(data)['ok'])
    def test_bad_payload(self):
        for payload in ['{','[]','{"source":3}']:
            self.assertEqual(self.request('POST','/api/compile',payload)[0],400)
    def test_bounded_body(self):self.assertEqual(self.request('POST','/api/compile','x'*65537)[0],413)
    def test_cross_origin_rejected(self):self.assertEqual(self.request('POST','/api/compile','{}',{'Origin':'https://example.com'})[0],403)
    def test_unknown_route(self):self.assertEqual(self.request('GET','/../../README.md')[0],404)
    def test_unknown_post(self):self.assertEqual(self.request('POST','/other','{}')[0],404)

    def test_local_font_assets_have_font_mime_and_real_bytes(self):
        for name in ['manrope.ttf','plex-mono.ttf']:
            conn=http.client.HTTPConnection('127.0.0.1',self.server.server_port)
            conn.request('GET','/fonts/'+name)
            response=conn.getresponse()
            self.assertEqual(response.status,200)
            self.assertEqual(response.getheader('Content-Type'),'font/ttf')
            self.assertIn(response.read()[:4],[b'\x00\x01\x00\x00',b'OTTO'])
            conn.close()
