"""Offline export uses the same tested browser playback engine."""
import json
import base64
from dataclasses import asdict
from pathlib import Path

def render_player(result):
    if not result.ok: raise ValueError('Cannot export a failed compilation')
    data=json.dumps(asdict(result)).replace('<','\\u003c')
    web=Path(__file__).with_name('web')
    css=web.joinpath('styles.css').read_text(encoding='utf-8')
    for name in ('manrope.ttf','plex-mono.ttf'):
        encoded=base64.b64encode(web.joinpath('fonts',name).read_bytes()).decode('ascii')
        css=css.replace('/fonts/'+name,'data:font/ttf;base64,'+encoded)
        license_name='Manrope-OFL.txt' if name=='manrope.ttf' else 'PlexMono-OFL.txt'
        license_text=web.joinpath('fonts',license_name).read_text(encoding='utf-8').replace('*/','* /')
        css+='\n/* '+license_name+'\n'+license_text+'\n*/'
    return ('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Morse Mail · Export</title><style>'+css+'</style><main style="max-width:900px;margin:50px auto;padding:24px"><p class="eyebrow">MORSE MAIL / OFFLINE TRANSMISSION</p><h1>Your message, in signal.</h1><div id="export-results"></div><section class="panel"><div id="lamp" class="lamp" aria-label="Signal light"></div><p id="play-status" aria-live="polite">Ready</p><button id="play" class="primary">▶ Play</button> <button id="stop" class="secondary">■ Stop</button> <label><input id="mute" type="checkbox"> Mute</label></section></main><script type="application/json" id="data">'+data+'</script><script>'+web.joinpath('player.js').read_text(encoding='utf-8')+"</script><script>const data=JSON.parse(document.getElementById('data').textContent);const box=document.getElementById('export-results');for(const o of data.outputs){const p=document.createElement('p');p.className='morse';p.textContent=o.operation==='SEND'?o.notation:o.text;box.append(p);}const player=new MorsePlayer(document.getElementById('lamp'),document.getElementById('play-status'));document.getElementById('play').onclick=()=>player.play(data.outputs,100,600);document.getElementById('stop').onclick=()=>player.stop();document.getElementById('mute').onchange=e=>player.setMuted(e.target.checked);</script></html>")
