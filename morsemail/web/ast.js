/* Interactive projection of the real Program/Statement records. No parser rules here. */
(function(scope){
  'use strict';
  const WIDTH=240, HEIGHT=112, DRAW_LIMIT=320;
  const preview=(value,max=65)=>{const chars=Array.from(String(value??''));return chars.length>max?chars.slice(0,max).join('')+'…':chars.join('');};
  function buildModel(program){
    if(!program||!Array.isArray(program.statements))return null;
    const nodes=new Map();const statements=program.statements;
    if(statements.some(s=>!s||typeof s!=='object'||!['SEND','DECODE'].includes(s.operation)||typeof s.value!=='string'))return null;
    const root={id:'program',category:'program',type:'Program',label:'Program',value:`${statements.length} statement${statements.length===1?'':'s'}`,parent:null,children:[],span:statements.length&&statements[0].span&&statements.at(-1).span?{start:statements[0].span.start,end:statements.at(-1).span.end}:null,explanation:'The root is the whole parsed program. Its children preserve the source order of instructions. An empty program still has this root.',field:false};nodes.set(root.id,root);
    statements.forEach((statement,index)=>{
      const id=`statement-${index}`,commandId=`${id}-command`,literalId=`${id}-literal`;
      const operation=String(statement.operation??'');const value=String(statement.value??'');
      const s={id,category:'statement',type:'Statement',label:`${operation} statement`,value:`Instruction ${index+1}`,parent:'program',children:[commandId,literalId],span:statement.span||null,statementIndex:index,explanation:`This is one ${operation} instruction. The parser joined its command and quoted argument after checking whitespace and line boundaries. Content validation happens later in semantic analysis.`,field:false};
      const start=statement.span?.start;const commandSpan=start?{start,end:{offset:start.offset+operation.length,line:start.line,column:start.column+operation.length}}:null;
      const command={id:commandId,category:'command',type:'Statement.operation',label:'Command',value:operation,parent:id,children:[],span:commandSpan,statementIndex:index,explanation:`The operation field tells later compiler phases which conversion to perform. ${operation==='SEND'?'SEND encodes readable text.':'DECODE reads written Morse notation.'} This card projects a field of Statement, not a separate parser node.`,field:true};
      const literal={id:literalId,category:'literal',type:'Statement.value',label:'String literal',value,parent:id,children:[],span:statement.argument_span||null,statementIndex:index,explanation:'The value field preserves the original quoted string contents without delimiters. The source range includes the quotes. The parser does not uppercase or validate this value; the semantic analyzer does that later. This is a field projection, not an invented expression node.',field:true};
      root.children.push(id);for(const node of [s,command,literal])nodes.set(node.id,node);
    });
    return {nodes,root:'program',statementCount:statements.length};
  }
  function initialExpanded(model){const set=new Set(['program']);const children=model.nodes.get('program').children;if(model.statementCount<=3)for(const id of children)set.add(id);else if(model.statementCount<=8)set.add(children[0]);return set;}
  function visibleTree(model,expanded){
    const visible=[];const stack=[model.root];
    while(stack.length){const id=stack.pop(),node=model.nodes.get(id);if(!node)continue;visible.push(node);if(expanded.has(id))for(let i=node.children.length-1;i>=0;i--)stack.push(node.children[i]);}
    return visible;
  }
  function layout(model,expanded,direction='horizontal'){
    if(direction==='vertical'){
      const positions=new Map();const root=model.nodes.get('program');positions.set(root.id,{...root,x:24,y:24,width:210,height:HEIGHT});let y=152;
      if(expanded.has(root.id))for(const id of root.children){const statement=model.nodes.get(id),open=expanded.has(id);positions.set(id,{...statement,x:48,y,width:210,height:HEIGHT});if(open){statement.children.forEach((child,index)=>positions.set(child,{...model.nodes.get(child),x:80,y:y+128+index*140,width:210,height:HEIGHT}));y+=430;}else y+=128;}
      const nodes=[...positions.values()];let width=0,height=140;for(const n of nodes){width=Math.max(width,n.x+n.width+24);height=Math.max(height,n.y+n.height+24);}return {nodes,positions,width,height,direction};
    }
    const positions=new Map();const root=model.nodes.get('program');positions.set(root.id,{...root,x:28,y:50,width:224,height:HEIGHT});let y=28;
    if(expanded.has(root.id))for(const id of root.children){const statement=model.nodes.get(id);const open=expanded.has(id);positions.set(id,{...statement,x:300,y:y+(open?70:0),width:WIDTH,height:HEIGHT});if(open){statement.children.forEach((child,index)=>positions.set(child,{...model.nodes.get(child),x:596,y:y+index*140,width:WIDTH,height:HEIGHT}));y+=300;}else y+=112;}
    const nodes=[...positions.values()];let width=0,height=Math.max(160,y);for(const n of nodes){width=Math.max(width,n.x+n.width+28);height=Math.max(height,n.y+n.height+28);}return {nodes,positions,width,height,direction};
  }
  function sourceRange(source,span){
    if(!span?.start||!span?.end||!Number.isInteger(span.start.offset)||!Number.isInteger(span.end.offset))return null;
    const chars=Array.from(source);const start=Math.max(0,Math.min(chars.length,span.start.offset));const end=Math.max(start,Math.min(chars.length,span.end.offset));
    return {start:chars.slice(0,start).join('').length,end:chars.slice(0,end).join('').length,text:chars.slice(start,end).join('')};
  }
  function zoomAt(camera,newScale,point){const ratio=newScale/camera.scale;return {scale:newScale,x:point.x-(point.x-camera.x)*ratio,y:point.y-(point.y-camera.y)*ratio};}
  function fitCamera(bounds,width,height){const scale=Math.min(1,Math.max(.00001,Math.min((Math.max(80,width)-56)/bounds.width,(Math.max(80,height)-56)/bounds.height)));return {scale,x:(width-bounds.width*scale)/2,y:(height-bounds.height*scale)/2};}
  function inViewport(node,camera,width,height){const x=node.x*camera.scale+camera.x,y=node.y*camera.scale+camera.y;return x+node.width*camera.scale>=-70&&y+node.height*camera.scale>=-70&&x<=width+70&&y<=height+70;}
  function drawable(nodes,camera,width,height,selected,limit=DRAW_LIMIT){
    const visible=nodes.filter(n=>inViewport(n,camera,width,height));if(visible.length<=limit)return {nodes:visible,overview:false,total:visible.length};
    const sample=[];const step=visible.length/(limit-1);for(let i=0;i<limit-1;i++)sample.push(visible[Math.floor(i*step)]);const chosen=visible.find(n=>n.id===selected)||visible.at(-1);if(!sample.some(n=>n.id===chosen.id))sample.push(chosen);return {nodes:sample,overview:true,total:visible.length};
  }
  function relations(model,id){const direct=new Set([id]);const path=new Set();let node=model.nodes.get(id);if(!node)return {direct,path};for(const child of node.children)direct.add(child);while(node.parent){direct.add(node.parent);path.add(`${node.parent}>${node.id}`);node=model.nodes.get(node.parent);}for(const child of model.nodes.get(id).children)path.add(`${id}>${child}`);return {direct,path};}
  function el(tag,cls,text){const element=document.createElement(tag);element.className=cls;if(text!==undefined)element.textContent=text;return element;}
  function button(text,label,action,cls='ast-tool'){const b=el('button',cls,text);b.type='button';b.setAttribute('aria-label',label);b.title=label;b.onclick=action;return b;}
  function mount(host,program,options={}){
    const model=buildModel(program);if(!model){host.append(el('p','visual-footnote','No syntax tree is available. Compile valid syntax to explore it.'));return {destroy(){}};}
    let expanded=initialExpanded(model),selected='program',graph=layout(model,expanded),camera={x:24,y:24,scale:1},destroyed=false,frame=0;
    let layoutMode='auto',jumpInput=null,zoomInButton=null,zoomOutButton=null;let drag=null,pendingFocus=null;let structuralAnimation=null,animateChanges=true;const pointers=new Map();let pinch=null;
    const view=el('section','ast-explorer');host.append(view);
    const toolbar=el('div','ast-toolbar');const title=el('div','ast-toolbar-title');title.append(el('span','visual-kicker','PARSER OUTPUT / LIVE AST'),el('h3','','Explore the structure.'));const controls=el('div','ast-controls');toolbar.append(title,controls);view.append(toolbar);
    const body=el('div','ast-workspace');view.append(body);const main=el('div','ast-main');body.append(main);
    const viewport=el('div','ast-viewport');viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Interactive syntax tree canvas. Drag to pan, use plus or minus to zoom, arrow keys to pan.');main.append(viewport);
    const world=el('div','ast-world');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','ast-edges');svg.setAttribute('aria-hidden','true');const cards=el('div','ast-cards');world.append(svg,cards);viewport.append(world);
    const status=el('div','ast-canvas-status');status.setAttribute('aria-live','polite');main.append(status);
    const hint=el('p','ast-hint','Drag to pan · Ctrl/⌘ + wheel or +/− to zoom · Arrow keys move · Home fits the tree');main.append(hint);
    const inspector=el('details','ast-inspector');inspector.open=true;const summary=el('summary','ast-inspector-heading','Node inspector');const inspectorBody=el('div','ast-inspector-body');inspector.append(summary,inspectorBody);body.append(inspector);
    const legend=el('div','ast-legend');for(const [category,text]of [['program','Program / root'],['statement','Instruction'],['command','Command field'],['literal','String value']])legend.append(el('span',`ast-key category-${category}`,text));legend.append(el('p','','MorseScript v0.1 has two commands and quoted strings. Command and string cards project Statement fields. Expressions, identifiers, operators, and functions are not part of this grammar.'));view.append(legend);
    const zoomLabel=el('output','ast-zoom','100%');zoomLabel.setAttribute('aria-label','Tree zoom level');
    const dimensions=()=>({width:viewport.clientWidth||640,height:viewport.clientHeight||500});
    const nodeElements=new Map(),edgeElements=new Map();
    const layoutSelect=el('select','ast-layout-select');layoutSelect.setAttribute('aria-label','Tree layout');for(const [value,label]of [['auto','Auto layout'],['horizontal','Left → right'],['vertical','Top → bottom']]){const option=el('option','',label);option.value=value;layoutSelect.append(option);}layoutSelect.value='auto';layoutSelect.onchange=()=>{layoutMode=layoutSelect.value;rebuild();fit();};
    function rebuild(){animateChanges=true;structuralAnimation?.cancel();if(!scope.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)structuralAnimation=world.animate?.([{opacity:.55},{opacity:1}],{duration:180,easing:'ease-out'});graph=layout(model,expanded,layoutMode==='auto'?(dimensions().width<680?'vertical':'horizontal'):layoutMode);}
    function focusCanvas(){viewport.focus({preventScroll:true});}
    function schedule(){if(destroyed||frame)return;if(typeof requestAnimationFrame==='function')frame=requestAnimationFrame(()=>{frame=0;draw();});else draw();}
    function setCamera(next){camera=next;schedule();}
    function fit(){const {width,height}=dimensions();setCamera(fitCamera(graph,width,height));}
    function initialCamera(){const {width,height}=dimensions();const fitted=fitCamera(graph,width,height);return model.statementCount>3||fitted.scale<.8?{scale:.85,x:graph.direction==='vertical'?Math.max(8,(width-graph.width*.85)/2):24,y:24}:fitted;}
    function reset(){pendingFocus=null;if(jumpInput)jumpInput.value='1';layoutMode='auto';layoutSelect.value='auto';options.onSource?.(model.nodes.get('program').span,false);expanded=initialExpanded(model);rebuild();selected='program';renderInspector();setCamera(initialCamera());}
    function zoom(factor,point){const {width,height}=dimensions();const min=Math.min(.1,fitCamera(graph,width,height).scale);const scale=Math.max(min,Math.min(2.4,camera.scale*factor));setCamera(zoomAt(camera,scale,point||{x:width/2,y:height/2}));}
    function center(id){const n=graph.positions.get(id);if(!n)return;const {width,height}=dimensions();const scale=Math.max(.7,Math.min(1.2,camera.scale));setCamera({scale,x:width/2-(n.x+n.width/2)*scale,y:height/2-(n.y+n.height/2)*scale});}
    function reveal(id){const n=model.nodes.get(id);if(!n)return;let p=n.parent;while(p){expanded.add(p);p=model.nodes.get(p).parent;}rebuild();pendingFocus=id;select(id);center(id);}
    function select(id){if(!model.nodes.has(id))return;selected=id;renderInspector();inspector.open=true;options.onSource?.(model.nodes.get(id).span,false);schedule();}
    function toggle(id){const n=model.nodes.get(id);if(!n?.children.length)return;expanded.has(id)?expanded.delete(id):expanded.add(id);rebuild();if(pendingFocus&&!graph.positions.has(pendingFocus))pendingFocus=null;if(!graph.positions.has(selected)){selected=id;renderInspector();options.onSource?.(n.span,false);}schedule();}
    controls.append(layoutSelect,button('Expand all','Expand all branches',()=>{expanded=new Set([...model.nodes.values()].filter(n=>n.children.length).map(n=>n.id));rebuild();fit();}),button('Collapse all','Collapse all branches',()=>{pendingFocus=null;expanded.clear();rebuild();selected='program';renderInspector();options.onSource?.(model.nodes.get('program').span,false);fit();}),(zoomOutButton=button('−','Zoom out',()=>zoom(1/1.2))),zoomLabel,(zoomInButton=button('+','Zoom in',()=>zoom(1.2))),button('Fit','Fit complete visible tree',fit),button('↺','Reset tree view',reset));
    if(model.statementCount>8){const jump=el('form','ast-jump');const input=el('input','');jumpInput=input;input.type='number';input.min='1';input.max=String(model.statementCount);input.value='1';input.setAttribute('aria-label','Statement number');const go=el('button','ast-tool','Go');go.type='submit';jump.append(el('label','','Find statement'),input,go);jump.onsubmit=e=>{e.preventDefault();const index=Number(input.value)-1;if(Number.isInteger(index)&&index>=0&&index<model.statementCount)reveal(`statement-${index}`);};main.prepend(jump);}
    function renderInspector(){
      const n=model.nodes.get(selected);inspectorBody.replaceChildren();const type=el('span',`ast-category-label category-${n.category}`,n.type);inspectorBody.append(type,el('h4','',n.label));
      const value=el('pre','ast-inspector-value',n.value===''?'(empty string)':n.value);value.tabIndex=0;inspectorBody.append(value,el('p','ast-explanation',n.explanation));
      const fields=el('dl','ast-properties');fields.append(el('dt','','Parent'));const parent=el('dd','');parent.append(n.parent?button(model.nodes.get(n.parent).label,'Select parent node',()=>reveal(n.parent),'ast-inspector-link'):el('span','','None · root'));fields.append(parent,el('dt','','Children'),el('dd','',String(n.children.length)),el('dt','','Source position'),el('dd','',n.span?`L${n.span.start.line}:${n.span.start.column} → L${n.span.end.line}:${n.span.end.column}`:'No source range · empty program'));inspectorBody.append(fields);
      if(n.category==='program'&&n.span)inspectorBody.append(el('p','ast-field-note','Derived range: first statement through last statement. Leading and trailing blank lines are not AST nodes.'));
      if(n.field)inspectorBody.append(el('p','ast-field-note','Field projection · stored inside the Statement dataclass.'));
      if(n.children.length){const childList=el('div','ast-child-list');childList.tabIndex=-1;childList.setAttribute('role','group');childList.setAttribute('aria-label','Child node navigation');const showChildren=(page=0)=>{childList.replaceChildren();const begin=page*8;for(const id of n.children.slice(begin,begin+8)){const child=model.nodes.get(id);childList.append(button(`${child.label}${child.statementIndex!==undefined?' · '+(child.statementIndex+1):''}`,`Select ${child.label}${child.statementIndex!==undefined?' '+(child.statementIndex+1):''}`,()=>reveal(id),'ast-inspector-link'));}if(n.children.length>8){const nav=el('div','ast-child-pagination');const previous=button('←','Previous child nodes',()=>{showChildren(page-1);childList.focus({preventScroll:true});});previous.disabled=page===0;const next=button('→','Next child nodes',()=>{showChildren(page+1);childList.focus({preventScroll:true});});next.disabled=begin+8>=n.children.length;nav.append(previous,el('span','',`${begin+1}–${Math.min(begin+8,n.children.length)} / ${n.children.length}`),next);childList.append(nav);}};showChildren();inspectorBody.append(el('h5','visual-kicker','Navigate children'),childList);}
      if(n.span&&typeof options.source==='string'){
        const range=sourceRange(options.source,n.span);
        if(range){const snippet=el('pre','ast-source-snippet');snippet.append(el('mark','',preview(range.text,220)||'(empty range)'));inspectorBody.append(el('h5','visual-kicker','Original source'),snippet,button('Reveal in source ↗','Reveal selected node in source editor',()=>options.onSource?.(n.span,true),'ast-reveal'));}
      }
    }
    function makeCard(n){
      const wrapper=el('article',`ast-node category-${n.category}`);const choose=button('',`Select ${n.label}${n.statementIndex!==undefined?' '+(n.statementIndex+1):''}`,()=>select(n.id),'ast-node-select');choose.title=n.explanation;
      choose.append(el('span','ast-node-kind',n.type),el('strong','ast-node-label',n.label),el('span','ast-node-value',preview(n.value,50)||'“”'));
      choose.onkeydown=e=>{if(e.key==='ArrowLeft'&&n.parent){e.preventDefault();reveal(n.parent);}else if(e.key==='ArrowRight'&&n.children.length){e.preventDefault();reveal(n.children[0]);}else if(e.key===' '){e.preventDefault();n.children.length?toggle(n.id):select(n.id);}};
      wrapper.append(choose);
      let fold=null;if(n.children.length){fold=button('−',`Collapse ${n.label}${n.statementIndex!==undefined?' '+(n.statementIndex+1):''} branch`,()=>toggle(n.id),'ast-node-fold');wrapper.append(fold);}
      return {wrapper,choose,fold};
    }
    function draw(){
      if(destroyed)return;
      const {width,height}=dimensions();world.style.transform=`translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;world.style.width=graph.width+'px';world.style.height=graph.height+'px';svg.setAttribute('width',graph.width);svg.setAttribute('height',graph.height);const percent=camera.scale*100;zoomLabel.textContent=`${percent<1?percent.toPrecision(2):percent<10?percent.toFixed(1):Math.round(percent)}%`;zoomInButton.disabled=camera.scale>=2.4-1e-8;zoomOutButton.disabled=camera.scale<=Math.min(.1,fitCamera(graph,width,height).scale)+1e-9;
      const visible=drawable(graph.nodes,camera,width,height,selected);const keep=new Set(),edgeKeep=new Set();const highlighted=relations(model,selected);
      for(const n of visible.nodes){keep.add(n.id);let record=nodeElements.get(n.id);if(!record){record=makeCard(n);record.wrapper.style.animation=animateChanges?'ast-node-appear .22s ease-out both':'none';nodeElements.set(n.id,record);cards.append(record.wrapper);}const {wrapper,choose,fold}=record;wrapper.style.left=n.x+'px';wrapper.style.top=n.y+'px';wrapper.style.width=n.width+'px';wrapper.style.height=n.height+'px';wrapper.className=`ast-node category-${n.category}${selected===n.id?' is-selected':highlighted.direct.has(n.id)?' is-related':''}`;choose.setAttribute('aria-pressed',String(selected===n.id));if(fold){const open=expanded.has(n.id);fold.textContent=open?'−':'+';fold.setAttribute('aria-expanded',String(open));fold.setAttribute('aria-label',`${open?'Collapse':'Expand'} ${n.label}${n.statementIndex!==undefined?' '+(n.statementIndex+1):''} branch`);fold.title=fold.getAttribute('aria-label');}
        if(n.parent){const p=graph.positions.get(n.parent);if(!p)continue;const key=`${p.id}>${n.id}`;edgeKeep.add(key);let edge=edgeElements.get(key);if(!edge){edge=document.createElementNS('http://www.w3.org/2000/svg','path');edgeElements.set(key,edge);svg.append(edge);edge.setAttribute('pathLength','1');if(!animateChanges)edge.style.animation='none';}const x1=p.x+p.width,y1=p.y+p.height/2,x2=n.x,y2=n.y+n.height/2,mid=(x1+x2)/2;edge.setAttribute('d',graph.direction==='vertical'?`M ${p.x} ${y1} C ${p.x-24} ${y1}, ${p.x-24} ${y2}, ${n.x} ${y2}`:`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);edge.setAttribute('class',`ast-edge${highlighted.path.has(key)?' is-connected':''}`);}
      }
      for(const [id,record]of nodeElements)if(!keep.has(id)){record.wrapper.remove();nodeElements.delete(id);}for(const [id,edge]of edgeElements)if(!edgeKeep.has(id)){edge.remove();edgeElements.delete(id);}
      status.textContent=visible.overview?`Overview · drawing ${visible.nodes.length} of ${visible.total} on-screen nodes. Zoom in for detail.`:`${graph.nodes.length} expanded / ${model.nodes.size} visual node${model.nodes.size===1?'':'s'} · ${expanded.has('program')?'Branches follow source order':'Program collapsed'}`;
      if(pendingFocus&&nodeElements.has(pendingFocus)){nodeElements.get(pendingFocus).choose.focus({preventScroll:true});pendingFocus=null;}
      animateChanges=false;
    }
    viewport.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();if(pointers.size)return;const rect=viewport.getBoundingClientRect();zoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.008),{x:e.clientX-rect.left,y:e.clientY-rect.top});}},{passive:false});
    viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;let handled=true;switch(e.key){case '+':case '=':zoom(1.2);break;case '-':zoom(1/1.2);break;case 'Home':fit();break;case '0':reset();break;case 'ArrowLeft':setCamera({...camera,x:camera.x+55});break;case 'ArrowRight':setCamera({...camera,x:camera.x-55});break;case 'ArrowUp':setCamera({...camera,y:camera.y+55});break;case 'ArrowDown':setCamera({...camera,y:camera.y-55});break;default:handled=false;}if(handled)e.preventDefault();});
    viewport.addEventListener('pointerdown',e=>{if(e.button!==0||pointers.size>=2||e.target.closest('.ast-node'))return;e.preventDefault();focusCanvas();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});viewport.setPointerCapture(e.pointerId);if(pointers.size===1)drag={id:e.pointerId,x:e.clientX,y:e.clientY,camera:{...camera}};if(pointers.size===2){const [a,b]=[...pointers.values()];const rect=viewport.getBoundingClientRect();pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),camera:{...camera},center:{x:(a.x+b.x)/2-rect.left,y:(a.y+b.y)/2-rect.top}};}viewport.classList.add('is-panning');});
    viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];const rect=viewport.getBoundingClientRect();const distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch.distance>0){const {width,height}=dimensions();const min=Math.min(.1,fitCamera(graph,width,height).scale);const scale=Math.max(min,Math.min(2.4,pinch.camera.scale*distance/pinch.distance));const ratio=scale/pinch.camera.scale;setCamera({scale,x:(a.x+b.x)/2-rect.left-(pinch.center.x-pinch.camera.x)*ratio,y:(a.y+b.y)/2-rect.top-(pinch.center.y-pinch.camera.y)*ratio});}}else if(drag)setCamera({...drag.camera,x:drag.camera.x+e.clientX-drag.x,y:drag.camera.y+e.clientY-drag.y});});
    function endPointer(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);pinch=null;if(pointers.size===1){const [id,p]=[...pointers][0];drag={id,x:p.x,y:p.y,camera:{...camera}};}else drag=null;if(!pointers.size)viewport.classList.remove('is-panning');}
    viewport.addEventListener('pointerup',endPointer);viewport.addEventListener('pointercancel',endPointer);viewport.addEventListener('lostpointercapture',endPointer);
    renderInspector();options.onSource?.(model.nodes.get('program').span,false);rebuild();const d=dimensions();camera=initialCamera();draw();
    let observer=null;if(typeof ResizeObserver!=='undefined'){let lastWidth=d.width;observer=new ResizeObserver(()=>{if(destroyed)return;const next=dimensions();if(Math.abs(next.width-lastWidth)>1){lastWidth=next.width;rebuild();fit();}});observer.observe(viewport);}
    return {destroy(){destroyed=true;structuralAnimation?.cancel();if(frame&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(frame);observer?.disconnect();pointers.clear();},select:reveal,fit,reset,getState:()=>({selected,expanded:[...expanded],camera:{...camera},visible:graph.nodes.length,total:model.nodes.size})};
  }
  const api={buildModel,initialExpanded,visibleTree,layout,sourceRange,zoomAt,fitCamera,drawable,relations,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else scope.MorseAST=api;
})(typeof window!=='undefined'?window:globalThis);
