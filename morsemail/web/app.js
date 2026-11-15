'use strict';
const $=id=>document.getElementById(id);
const samples={sos:'SEND "SOS"',hello:'SEND "Hello World"',decode:'DECODE ".... . .-.. .-.. --- / .-- --- .-. .-.. -.."',mixed:'SEND "SOS HELP"\nSEND "Hello World"\nDECODE "... --- ..."\nDECODE ".../---"\nSEND "A/B"',semantic:'DECODE "..--"',syntax:'SEND',lexical:'send "SOS"',empty:''};
let result=null,stage='tokens',requestId=0;
const descriptions={tokens:'The lexer turns source characters into located tokens.',ast:'The parser checks the grammar and builds an ordered syntax tree.',ir:'Semantic analysis validates every character, Morse group, and boundary.',events:'Code generation lowers SEND into MARK / GAP instructions in Morse units.'};
const player=new MorsePlayer($('lamp'),$('play-status'),playing=>{$('stop').disabled=!playing;$('unit').disabled=playing;$('frequency').disabled=playing;});
function duration(){if(!result)return 0;const sends=result.outputs.filter(o=>o.events.length);return sends.reduce((total,o)=>total+o.events.reduce((s,e)=>s+e.units,0)*Number($('unit').value)/1000,0)+Math.max(0,sends.length-1)*.7;}
let stagePage=0;
function showStage(){
  $('stage-description').textContent=descriptions[stage];
  const view=MorseStages.render($('stage-data'),result,stage,stagePage,page=>{stagePage=page;showStage();$('stage-data').focus({preventScroll:true});},{source:$('source').value,onSource:highlightSource,getUnitMs:()=>Number($('unit').value),onSignalSimulation:()=>{if(player.playing)player.stop('Playback stopped for silent simulation.');}});
  $('stage-count').textContent=view.state==='waiting'?'WAITING FOR SOURCE':view.state==='blocked'?'NOT COMPLETED':`${view.count} ${stage==='tokens'?(view.count===1?'TOKEN':'TOKENS'):(view.count===1?'STATEMENT':'STATEMENTS')}`;
  $('stage-data').setAttribute('aria-labelledby',`tab-${stage}`);
}

function renderOutputs(outputs,page=0){MorseStages.renderResults($('results'),outputs,page,next=>{renderOutputs(outputs,next);$('results').scrollTop=0;$('results').focus({preventScroll:true});});}
function highlightSource(span,reveal=false){
  const source=$('source');const range=MorseAST.sourceRange(source.value,span);
  if(!range){updateEditor();return;}
  source.setSelectionRange(range.start,range.end);
  $('source-count').textContent=`Selected L${span.start.line}:${span.start.column} → L${span.end.line}:${span.end.column}`;
  if(reveal){
    source.focus({preventScroll:true});
    const style=getComputedStyle(source),lineHeight=parseFloat(style.lineHeight)||30;
    source.scrollTop=Math.max(0,(span.start.line-1)*lineHeight-source.clientHeight/3);
    const measuring=document.createElement('canvas').getContext('2d');if(measuring)measuring.font=style.font;
    const glyphWidth=measuring?measuring.measureText('0').width:(parseFloat(style.fontSize)||15)*.6;
    source.scrollLeft=Math.max(0,(span.start.column-1)*glyphWidth-source.clientWidth/4);
    $('line-numbers').scrollTop=source.scrollTop;
    source.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  }
}
function invalidate(){stagePage=0;requestId++;result=null;player.stop('Source changed. Compile to update the signal.');$('play').disabled=true;$('export').disabled=true;$('duration').textContent='0.0 s';$('compile-state').textContent='Edited · compile again';$('compile-state').className='state';$('diagnostics').hidden=true;$('results').replaceChildren();const p=document.createElement('p');p.className='readable';p.textContent='Source changed. Compile to see updated results.';$('results').append(p);$('result-summary').textContent='Awaiting compilation';showStage();}
function updateEditor(){const text=$('source').value;$('line-numbers').textContent=text.split(/\r\n|\r|\n/).map((_,i)=>i+1).join('\n');$('source-count').textContent=`${Array.from(text).length} characters`;$('line-numbers').scrollTop=$('source').scrollTop;}
function element(tag,className,text){const node=document.createElement(tag);node.className=className;node.textContent=text;return node;}
async function compile(){stagePage=0;player.stop('Compiling…');result=null;$('play').disabled=true;$('export').disabled=true;const id=++requestId;const source=$('source').value;$('compile-state').textContent='Compiling…';$('compile-state').className='state';$('compile').disabled=true;$('results').replaceChildren();$('diagnostics').hidden=true;$('result-summary').textContent='Compiling source…';$('duration').textContent='0.0 s';showStage();
 try{const response=await fetch('/api/compile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Compile request failed');if(id!==requestId)return;result=data;$('results').replaceChildren();$('diagnostics').hidden=true;
 if(!data.ok){const d=data.diagnostics[0],p=d.span.start;$('compile-state').textContent='Compilation failed';$('compile-state').className='state error';$('diagnostics').hidden=false;$('diagnostics').replaceChildren(element('strong','',`${d.phase.toUpperCase()} ERROR · ${p.line}:${p.column}`),element('p','',d.message));const line=source.split(/\r\n|\r|\n/)[p.line-1]||'';$('diagnostics').append(element('pre','',line+'\n'+' '.repeat(Math.max(0,p.column-1))+'^'));$('result-summary').textContent='No output generated';$('play-status').textContent='Fix the diagnostic, then compile again.';}
 else{$('compile-state').textContent='Compiled successfully';$('compile-state').className='state success';renderOutputs(data.outputs);const count=data.outputs.length;$('result-summary').textContent=`${count} statement${count===1?'':'s'} · all stages passed`;$('play').disabled=!data.outputs.some(o=>o.events.length);$('export').disabled=false;$('duration').textContent=duration().toFixed(1)+' s';$('play-status').textContent=$('play').disabled?'Compiled. No SEND signal events.':'Ready to transmit. Press Play signal.';}showStage();}
 catch(error){if(id!==requestId)return;result=null;$('compile-state').textContent='Request failed';$('compile-state').className='state error';$('result-summary').textContent='No output generated';$('diagnostics').hidden=false;$('diagnostics').textContent=error.message;$('play-status').textContent='Compilation unavailable.';showStage();}
 finally{$('compile').disabled=false;}}
$('compile').onclick=compile;$('source').addEventListener('scroll',()=>{$('line-numbers').scrollTop=$('source').scrollTop;});$('source').addEventListener('input',()=>{invalidate();updateEditor();});$('source').addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();compile();}});$('sample').onchange=()=>{$('source').value=samples[$('sample').value];$('source').scrollTop=0;invalidate();updateEditor();};$('load-demo').onclick=()=>{$('sample').value='mixed';$('source').value=samples.mixed;$('source').scrollTop=0;invalidate();updateEditor();compile();};
$('play').onclick=()=>{MorseStages.pause($('stage-data'));if(result?.ok)player.play(result.outputs,Number($('unit').value),Number($('frequency').value));};$('stop').onclick=()=>player.stop();$('mute').onchange=e=>player.setMuted(e.target.checked);$('hide-light').onchange=e=>$('lamp').classList.toggle('hidden-light',e.target.checked);$('unit').onchange=()=>{$('duration').textContent=duration().toFixed(1)+' s';if(stage==='events')MorseStages.refreshTiming($('stage-data'));};
for(const button of document.querySelectorAll('[data-stage]')){button.tabIndex=button.dataset.stage===stage?0:-1;button.onclick=()=>{stage=button.dataset.stage;stagePage=0;for(const other of document.querySelectorAll('[data-stage]')){other.setAttribute('aria-selected',String(other===button));other.tabIndex=other===button?0:-1;}showStage();};button.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const tabs=[...document.querySelectorAll('[data-stage]')];const next=tabs[(tabs.indexOf(button)+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];next.focus();next.click();}};}
let exportStyles=null,exportJob=0;
$('export').onclick=async()=>{
  if(!result?.ok)return;
  const snapshot=result,revision=requestId,job=++exportJob;const button=$('export');button.disabled=true;button.textContent='Preparing export…';
  try{
    if(!exportStyles)exportStyles=MorseExport.inlineStyles().catch(error=>{exportStyles=null;throw error;});
    const css=await exportStyles;
    if(snapshot!==result||revision!==requestId)return;
    const html=MorseExport.buildPlayerHtml(snapshot,css,MorsePlayer.toString());
    const url=URL.createObjectURL(new Blob([html],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download='morse-mail-player.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(error){if(revision===requestId)$('result-summary').textContent=`Export failed: ${error.message}`;}
  finally{if(job===exportJob){button.textContent='Export player ↓';button.disabled=!result?.ok;}}
};

window.addEventListener('pagehide',()=>{player.stop();MorseStages.dispose($('stage-data'));});updateEditor();showStage();
