const get = (id) => document.getElementById(id);

document.querySelectorAll('.sidebar nav a').forEach((link) => link.addEventListener('click', () => {
  document.querySelectorAll('.sidebar nav a').forEach((item) => item.classList.remove('active'));
  link.classList.add('active');
}));

get('archiveSearch').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = get('searchQuery').value.trim();
  const scope = get('searchScope').value;
  if (!query) return;
  const githubQuery = `repo:beejmaxx/tesla-research-library path:${scope} ${query}`;
  window.open(`https://github.com/search?q=${encodeURIComponent(githubQuery)}&type=code`, '_blank', 'noopener');
});

document.querySelectorAll('.copy').forEach((button) => button.addEventListener('click', async () => {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Copy failed';
  }
  setTimeout(() => { button.textContent = original; }, 1400);
}));

const ui = {
  canvas:get('motorCanvas'), frequency:get('frequency'), poles:get('poles'), load:get('load'),
  frequencyValue:get('frequencyValue'), polesValue:get('polesValue'), loadValue:get('loadValue'),
  fieldSpeed:get('fieldSpeed'), rotorSpeed:get('rotorSpeed'), slip:get('slip'), phaseValue:get('phaseValue'),
  note:get('motorNote'), reverse:get('reverse'), reset:get('reset')
};
const context = ui.canvas.getContext('2d');
const palette = {line:'#50605a',orange:'#e96a47',blue:'#327e91',yellow:'#ddb34c',white:'#fff',muted:'#8d9b96',dark:'#17211f'};
let phase = 0;
let rotorAngle = 0;
let reversed = false;
let previousTime = performance.now();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function values(){
  const frequency=Number(ui.frequency.value),polePairs=Number(ui.poles.value),load=Number(ui.load.value);
  const slip=.008+load*.00078,synchronous=60*frequency/polePairs;
  return{frequency,polePairs,load,slip,synchronous,rotor:synchronous*(1-slip)};
}
function update(){
  const value=values();
  ui.frequencyValue.value=`${value.frequency} Hz`;ui.polesValue.value=`${value.polePairs} ${value.polePairs===1?'pair':'pairs'}`;ui.loadValue.value=`${value.load}%`;
  ui.fieldSpeed.textContent=Math.round(value.synchronous).toLocaleString();ui.rotorSpeed.textContent=Math.round(value.rotor).toLocaleString();ui.slip.textContent=(value.slip*100).toFixed(1);
  ui.note.textContent=value.load>75?'Heavier load slows the rotor. Greater slip induces stronger rotor currents, more torque and more heating.':value.load<15?'With little load, the rotor nearly catches the field. A small difference remains so induction can continue.':'The field moves slightly faster than the rotor. That difference induces rotor current and creates torque.';
}
function fit(){
  const bounds=ui.canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2),width=Math.max(280,Math.floor(bounds.width)),height=Math.max(390,Math.floor(bounds.height));
  if(ui.canvas.width!==width*ratio||ui.canvas.height!==height*ratio){ui.canvas.width=width*ratio;ui.canvas.height=height*ratio;context.setTransform(ratio,0,0,ratio,0,0)}return{width,height};
}
function line(x1,y1,x2,y2,color,width=1,dash=[]){context.beginPath();context.moveTo(x1,y1);context.lineTo(x2,y2);context.strokeStyle=color;context.lineWidth=width;context.setLineDash(dash);context.stroke();context.setLineDash([])}
function arrow(cx,cy,angle,length,color,width){if(length<0){angle+=Math.PI;length=Math.abs(length)}const x2=cx+Math.cos(angle)*length,y2=cy+Math.sin(angle)*length;line(cx,cy,x2,y2,color,width);context.save();context.translate(x2,y2);context.rotate(angle);context.beginPath();context.moveTo(0,0);context.lineTo(-10,-5);context.lineTo(-7,0);context.lineTo(-10,5);context.closePath();context.fillStyle=color;context.fill();context.restore()}
function draw(){
  const{width,height}=fit();context.clearRect(0,0,width,height);const cx=width/2,cy=height/2,outer=Math.min(width,height)*.4,rotorR=outer*.52,value=values(),direction=reversed?-1:1,fieldAngle=direction*phase/value.polePairs-Math.PI/2,currentA=Math.sin(phase),currentB=Math.sin(phase+direction*Math.PI/2);
  context.save();context.translate(cx,cy);context.strokeStyle=palette.line;context.lineWidth=1;context.beginPath();context.arc(0,0,outer,0,Math.PI*2);context.stroke();context.beginPath();context.arc(0,0,outer*.8,0,Math.PI*2);context.stroke();
  for(let i=0;i<32;i++){const angle=i/32*Math.PI*2,phaseA=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle)),amp=phaseA?currentA:currentB;context.save();context.translate(Math.cos(angle)*outer*.9,Math.sin(angle)*outer*.9);context.rotate(angle);context.fillStyle=phaseA?palette.orange:palette.blue;context.globalAlpha=.35+.55*Math.abs(amp);context.fillRect(-5,-3,10,6);context.restore()}
  for(let i=0;i<9;i++){const offset=(i-4)*outer*.11,spread=Math.sqrt(Math.max(0,outer*outer-offset*offset))*.7,px=-Math.sin(fieldAngle)*offset,py=Math.cos(fieldAngle)*offset;line(px-Math.cos(fieldAngle)*spread,py-Math.sin(fieldAngle)*spread,px+Math.cos(fieldAngle)*spread,py+Math.sin(fieldAngle)*spread,palette.yellow,i===4?1.7:.7,[3,7])}context.restore();
  arrow(cx,cy,-Math.PI/2,outer*.67*currentA,palette.orange,3);arrow(cx,cy,0,outer*.67*currentB,palette.blue,3);arrow(cx,cy,fieldAngle,outer*.73,palette.yellow,5);
  context.save();context.translate(cx,cy);context.rotate(rotorAngle);context.fillStyle='#2b3935';context.strokeStyle=palette.white;context.lineWidth=1;context.beginPath();context.arc(0,0,rotorR,0,Math.PI*2);context.fill();context.stroke();context.beginPath();context.arc(0,0,rotorR*.18,0,Math.PI*2);context.fillStyle=palette.dark;context.fill();context.stroke();for(let i=0;i<16;i++){const angle=i/16*Math.PI*2;context.beginPath();context.arc(Math.cos(angle)*rotorR*.76,Math.sin(angle)*rotorR*.76,3.1,0,Math.PI*2);context.fillStyle=palette.white;context.fill()}line(-rotorR*.58,0,rotorR*.58,0,palette.orange,3);context.restore();
  context.fillStyle=palette.muted;context.textAlign='center';context.font='9px ui-monospace, monospace';context.fillText('STATOR',cx,cy-outer-13);context.fillText('ROTOR',cx,cy+rotorR+20);
}
function animate(time){const elapsed=Math.min((time-previousTime)/1000,.05);previousTime=time;if(!reducedMotion){const value=values(),rate=.45+(value.frequency-10)/90*1.65;phase+=elapsed*rate*Math.PI*2;rotorAngle+=elapsed*rate*Math.PI*2*(reversed?-1:1)*(1-value.slip)/value.polePairs}ui.phaseValue.textContent=`phase = ${Math.round((phase%(Math.PI*2))*180/Math.PI)}°`;draw();requestAnimationFrame(animate)}
[ui.frequency,ui.poles,ui.load].forEach(control=>control.addEventListener('input',update));
ui.reverse.addEventListener('click',()=>{reversed=!reversed;ui.reverse.setAttribute('aria-pressed',String(reversed));ui.reverse.textContent=reversed?'↺ Restore phases':'↻ Reverse phases'});
ui.reset.addEventListener('click',()=>{ui.frequency.value=50;ui.poles.value=1;ui.load.value=35;reversed=false;phase=0;rotorAngle=0;ui.reverse.setAttribute('aria-pressed','false');ui.reverse.textContent='↻ Reverse phases';update()});
update();requestAnimationFrame(animate);
