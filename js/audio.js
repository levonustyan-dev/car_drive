export let audioCtx = null;
export let engineOsc = null, engineGain = null;
let engineInited = false;

export function initAudio(){
  if(engineInited) return;
  engineInited = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  engineOsc = audioCtx.createOscillator();
  engineOsc.type = 'sawtooth';
  engineOsc.frequency.value = 60;
  engineGain = audioCtx.createGain();
  engineGain.gain.value = 0;
  engineOsc.connect(engineGain);
  engineGain.connect(audioCtx.destination);
  engineOsc.start();
}

export function playBeep(freq, dur, vol=0.15){
  if(!audioCtx) return;
  const osc=audioCtx.createOscillator(), g=audioCtx.createGain();
  osc.frequency.value=freq;
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur);
  osc.connect(g); g.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime+dur);
}

export function playCrashSound(){
  if(!audioCtx) return;
  const bufSize=audioCtx.sampleRate*0.4;
  const buf=audioCtx.createBuffer(1,bufSize,audioCtx.sampleRate);
  const data=buf.getChannelData(0);
  for(let i=0;i<bufSize;i++) data[i]=(Math.random()*2-1)*(1-i/bufSize);
  const src=audioCtx.createBufferSource(), g=audioCtx.createGain();
  g.gain.value=0.4; src.buffer=buf; src.connect(g); g.connect(audioCtx.destination); src.start();
}
