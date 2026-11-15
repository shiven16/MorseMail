/* One AudioContext clock drives both sound and visible mark state. */
class MorsePlayer {
  constructor(lamp, status, onState = () => {}) {
    this.lamp=lamp;this.status=status;this.onState=onState;this.muted=false;this.generation=0;this.nodes=[];this.context=null;this.frame=0;this.playing=false;
  }
  setMuted(value) { this.muted=value;if(this.master&&this.context)this.master.gain.setValueAtTime(value?0:0.16,this.context.currentTime); }
  light(on) {this.lamp.classList.toggle('on',on);this.lamp.setAttribute('aria-label',on?'Signal light on':'Signal light off');const label=document.getElementById('signal-label');if(label)label.textContent=on?'SIGNAL ON':'SIGNAL OFF';}
  stop(message='Stopped. Ready to replay.') {this.generation++;cancelAnimationFrame(this.frame);for(const n of this.nodes){try{n.stop();}catch(_){}n.disconnect();}this.nodes=[];if(this.master){this.master.disconnect();this.master=null;}this.playing=false;this.light(false);this.status.textContent=message;this.onState(false);}
  async play(outputs,unit=100,frequency=600) {
    this.stop('Preparing signal…');const generation=this.generation;
    const send=outputs.filter(o=>o.operation==='SEND'&&o.events.length);
    if(send.reduce((n,o)=>n+o.events.length,0)>12000){this.status.textContent='Signal too large to play (12,000 event limit). Shorten the source.';return;}
    if(!send.length){this.status.textContent='No SEND signals to play.';return;}
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw new Error('Web Audio is unavailable in this browser.');
      if(!this.context)this.context=new Audio();
      await this.context.resume();if(generation!==this.generation)return;
      this.master=this.context.createGain();this.master.gain.value=this.muted?0:0.16;this.master.connect(this.context.destination);
      const timeline=[];let elapsed=0;
      send.forEach((o,index)=>{if(index)elapsed+=0.7;for(const event of o.events){const end=elapsed+event.units*unit/1000;timeline.push({start:elapsed,end,mark:event.kind==='MARK'});elapsed=end;}});
      const start=this.context.currentTime+0.06;
      for(const event of timeline){if(!event.mark)continue;const osc=this.context.createOscillator();const gain=this.context.createGain();osc.frequency.value=frequency;gain.gain.setValueAtTime(0,start+event.start);gain.gain.linearRampToValueAtTime(1,start+event.start+0.003);gain.gain.setValueAtTime(1,start+event.end-0.003);gain.gain.linearRampToValueAtTime(0,start+event.end);osc.connect(gain);gain.connect(this.master);osc.start(start+event.start);osc.stop(start+event.end);osc.onended=()=>{osc.disconnect();gain.disconnect();};this.nodes.push(osc);}
      this.playing=true;this.onState(true);let index=0;
      const tick=()=>{if(generation!==this.generation)return;const time=this.context.currentTime-start;while(index<timeline.length&&time>=timeline[index].end)index++;if(time>=elapsed){this.stop('Transmission complete.');return;}this.light(index<timeline.length&&time>=timeline[index].start&&timeline[index].mark);this.status.textContent=`Transmitting · ${Math.max(0,time).toFixed(1)} / ${elapsed.toFixed(1)} s`;this.frame=requestAnimationFrame(tick);};tick();
    }catch(error){if(generation===this.generation)this.stop(`Playback unavailable: ${error.message}`);}
  }
}
window.MorsePlayer=MorsePlayer;
