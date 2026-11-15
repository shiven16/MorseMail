/* Read-only visualizations of compiler records. No language rules are duplicated here. */
(function (scope) {
  'use strict';
  const AST=typeof module!=='undefined'&&module.exports?require('./ast.js'):scope.MorseAST;
  const Studio=typeof module!=='undefined'&&module.exports?require('./studio.js'):scope.MorseStudio;
  const activeViews=new WeakMap();
  function model(result, stage) {
    if (!result) return {state:'waiting', items:[]};
    const failure = result.diagnostics?.[0]?.phase;
    const reached = stage === 'tokens' ? failure !== 'lexical'
      : stage === 'ast' ? !['lexical','syntax'].includes(failure)
      : stage === 'ir' ? result.ok : result.ok;
    if (!reached) return {state:'blocked', items:[], failure};
    if(stage==='ast'&&!result.ast)return {state:'missing',items:[]};
    const items = stage === 'tokens' ? result.tokens || []
      : stage === 'ast' ? result.ast?.statements || []
      : stage === 'ir' ? result.ir || [] : result.outputs || [];
    return {state:items.length ? 'ready':'empty', items};
  }
  function page(items, requested, size) {
    const pages = Math.max(1, Math.ceil(items.length / size));
    const index = Math.max(0, Math.min(requested, pages - 1));
    return {items:items.slice(index*size,(index+1)*size),index,pages,start:index*size,total:items.length};
  }
  function eventSummary(events) {
    let units=0,marks=0,gaps=0;
    for(const event of events){units+=event.units;if(event.kind==='MARK')marks++;else gaps++;}
    return {units,marks,gaps,count:events.length};
  }
  function short(text, limit=80) {
    const chars=Array.from(String(text ?? ''));
    return chars.length>limit?chars.slice(0,limit).join('')+'…':chars.join('');
  }
  function node(tag,cls,text) {
    const element=document.createElement(tag);element.className=cls;
    if(text!==undefined)element.textContent=text;
    return element;
  }
  function pager(data,change,label='items') {
    const row=node('nav','visual-pager');row.setAttribute('aria-label',`${label} pagination`);
    const previous=node('button','secondary','← Previous');previous.type='button';previous.disabled=data.index===0;previous.onclick=()=>change(data.index-1);
    const next=node('button','secondary','Next →');next.type='button';next.disabled=data.index===data.pages-1;next.onclick=()=>change(data.index+1);
    row.append(previous,node('span','',`${data.start+1}–${data.start+data.items.length} of ${data.total} ${label}`),next);
    return row;
  }
  function renderResults(host,outputs,requested=0,onPage=()=>{}) {
    host.replaceChildren();host.tabIndex=-1;
    if(!outputs.length){host.append(node('p','readable','Valid empty program. No outputs.'));return;}
    const current=page(outputs,requested,12);
    if(current.pages>1)host.append(pager(current,onPage,'results'));
    current.items.forEach((output,index)=>{
      const card=node('article','result-item');const label=node('div','result-label');
      label.append(node('strong','',output.operation),node('span','',`STATEMENT ${current.start+index+1}`));
      card.append(label,node('p','morse',output.operation==='SEND'?(output.notation||'(empty signal)'):output.text),node('div','readable',output.operation==='SEND'?output.text:output.notation),node('div','result-meta',`${output.events.length} SIGNAL EVENTS · LINE ${output.source_span.start.line}`));host.append(card);
    });
  }
  function render(host,result,stage,requested=0,onPage=()=>{},options={}) {
    activeViews.get(host)?.destroy();activeViews.delete(host);
    host.replaceChildren();const data=model(result,stage);
    if(stage==='ast'&&result?.ast&&['ready','empty'].includes(data.state)){activeViews.set(host,AST.mount(host,result.ast,options));return {count:data.items.length,state:data.state};}
    if(data.state!=='ready'){
      const empty=node('div','stage-empty');empty.append(node('span','stage-empty-symbol',data.state==='blocked'?'↳':'· − ·'));
      const title=data.state==='waiting'?'The journey starts with a compile.':data.state==='blocked'?'This stage was not completed.':data.state==='missing'?'No syntax tree is available.':'A valid program, with nothing to transform.';
      const detail=data.state==='waiting'?'Write source above and compile it to explore each step.':data.state==='blocked'?`Compilation stopped during ${data.failure} analysis. Fix the diagnostic above to continue.`:data.state==='missing'?'The compiler did not return an AST. Try compiling the source again.':stage==='ast'?'The syntax tree contains a Program root with zero statements.':stage==='ir'?'No statements means no semantic operation records.':'No statements means no signal instructions.';
      empty.append(node('h3','',title),node('p','',detail));
      if(data.state==='empty'&&stage==='ast')empty.append(node('div','tree-root','Program · 0 statements'));
      host.append(empty);return {count:data.items.length,state:data.state};
    }
    activeViews.set(host,Studio.mount(host,result,stage,options));
    return {count:data.items.length,state:data.state};
  }
  const api={model,page,eventSummary,short,render,renderResults,pause:host=>activeViews.get(host)?.pause?.(),refreshTiming:host=>activeViews.get(host)?.refreshTiming?.(),dispose:host=>{activeViews.get(host)?.destroy();activeViews.delete(host);}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else scope.MorseStages=api;
})(typeof window!=='undefined'?window:globalThis);
