const $ = (id) => document.getElementById(id);

const ui = {
  canvas: $('motorCanvas'), frequency: $('frequency'), poles: $('poles'), load: $('load'),
  frequencyOut: $('frequencyOut'), polesOut: $('polesOut'), loadOut: $('loadOut'),
  syncSpeed: $('syncSpeed'), rotorSpeed: $('rotorSpeed'), slipOut: $('slipOut'),
  currentA: $('currentA'), currentB: $('currentB'), time: $('timeReadout'),
  play: $('playBtn'), direction: $('directionBtn'), reset: $('resetBtn'), explanation: $('explanation'),
  waveA: document.querySelector('#waveA .wave-line-a'), waveB: document.querySelector('#waveB .wave-line-b')
};

const ctx = ui.canvas.getContext('2d');
const colors = { ink: '#15201e', bg: '#15201e', line: '#53605b', orange: '#ef6844', blue: '#287d91', yellow: '#e5b84e', white: '#fffdf7', muted: '#9aa59f' };
let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let reversed = false;
let phase = 0;
let rotorAngle = 0;
let last = performance.now();

function values() {
  const frequency = +ui.frequency.value;
  const polePairs = +ui.poles.value;
  const load = +ui.load.value;
  const slip = 0.008 + load * 0.00078;
  const synchronous = 60 * frequency / polePairs;
  return { frequency, polePairs, load, slip, synchronous, rotor: synchronous * (1 - slip) };
}

function updateUI() {
  const v = values();
  ui.frequencyOut.value = `${v.frequency} Hz`;
  ui.polesOut.value = `${v.polePairs} ${v.polePairs === 1 ? 'pair' : 'pairs'}`;
  ui.loadOut.value = `${v.load}%`;
  ui.syncSpeed.textContent = Math.round(v.synchronous).toLocaleString();
  ui.rotorSpeed.textContent = Math.round(v.rotor).toLocaleString();
  ui.slipOut.textContent = (v.slip * 100).toFixed(1);
  ui.explanation.textContent = v.load < 15
    ? 'With little load, the rotor nearly catches the field. A small speed difference remains so induction—and torque—can continue.'
    : v.load > 75
      ? 'The heavier load slows the rotor. Greater slip induces stronger rotor currents, producing more torque—and more heating.'
      : 'The field is moving slightly faster than the rotor. That difference induces current in the rotor bars—and creates torque.';
  drawWaves();
}

function wavePath(offset, reverse = false) {
  const points = [];
  for (let x = 0; x <= 260; x += 4) {
    const angle = (x / 260) * Math.PI * 4 + phase + offset * (reverse ? -1 : 1);
    points.push(`${x === 0 ? 'M' : 'L'}${x} ${(24 - Math.sin(angle) * 17).toFixed(2)}`);
  }
  return points.join(' ');
}

function drawWaves() {
  ui.waveA.setAttribute('d', wavePath(0));
  ui.waveB.setAttribute('d', wavePath(Math.PI / 2, reversed));
  const a = Math.sin(phase);
  const b = Math.sin(phase + (reversed ? -1 : 1) * Math.PI / 2);
  ui.currentA.value = `${a >= 0 ? '+' : ''}${a.toFixed(2)}`;
  ui.currentB.value = `${b >= 0 ? '+' : ''}${b.toFixed(2)}`;
  ui.time.textContent = `phase = ${Math.round(((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) * 180 / Math.PI)}°`;
}

function fitCanvas() {
  const rect = ui.canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(370, Math.floor(rect.height));
  if (ui.canvas.width !== width * dpr || ui.canvas.height !== height * dpr) {
    ui.canvas.width = width * dpr; ui.canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return { width, height };
}

function line(x1, y1, x2, y2, color, width = 1, dash = []) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
}

function arrow(cx, cy, angle, length, color, width) {
  if (length < 0) { angle += Math.PI; length = Math.abs(length); }
  const x2 = cx + Math.cos(angle) * length;
  const y2 = cy + Math.sin(angle) * length;
  line(cx, cy, x2, y2, color, width);
  ctx.save(); ctx.translate(x2, y2); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -6); ctx.lineTo(-9, 0); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}

function drawMotor() {
  const { width, height } = fitCanvas();
  ctx.clearRect(0, 0, width, height);
  const cx = width / 2, cy = height / 2 - 4;
  const outer = Math.min(width, height) * .39;
  const rotorR = outer * .52;
  const v = values();
  const direction = reversed ? -1 : 1;
  const fieldAngle = direction * phase / v.polePairs - Math.PI / 2;
  const ia = Math.sin(phase), ib = Math.sin(phase + direction * Math.PI / 2);

  ctx.save(); ctx.translate(cx, cy);
  ctx.strokeStyle = colors.line; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, outer, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, outer * .79, 0, Math.PI * 2); ctx.stroke();

  for (let i = 0; i < 32; i++) {
    const a = i / 32 * Math.PI * 2;
    const activeA = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a));
    const amp = activeA ? ia : ib;
    const r = outer * .89;
    ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a);
    ctx.fillStyle = activeA ? colors.orange : colors.blue;
    ctx.globalAlpha = .35 + .55 * Math.abs(amp);
    ctx.fillRect(-5, -3, 10, 6); ctx.restore();
  }

  for (let i = 0; i < 10; i++) {
    const offset = (i - 4.5) * outer * .105;
    const spread = Math.sqrt(Math.max(0, outer * outer - offset * offset)) * .72;
    const px = -Math.sin(fieldAngle) * offset;
    const py = Math.cos(fieldAngle) * offset;
    line(px - Math.cos(fieldAngle) * spread, py - Math.sin(fieldAngle) * spread, px + Math.cos(fieldAngle) * spread, py + Math.sin(fieldAngle) * spread, colors.yellow, i === 4 || i === 5 ? 1.8 : .7, [3, 7]);
  }
  ctx.restore();

  arrow(cx, cy, -Math.PI / 2, outer * .68 * ia, colors.orange, 3);
  arrow(cx, cy, 0, outer * .68 * ib, colors.blue, 3);
  arrow(cx, cy, fieldAngle, outer * .73, colors.yellow, 5);

  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotorAngle);
  ctx.fillStyle = '#293632'; ctx.strokeStyle = colors.white; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, 0, rotorR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, rotorR * .2, 0, Math.PI * 2); ctx.fillStyle = colors.ink; ctx.fill(); ctx.stroke();
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    ctx.beginPath(); ctx.arc(Math.cos(a) * rotorR * .76, Math.sin(a) * rotorR * .76, 3.5, 0, Math.PI * 2); ctx.fillStyle = colors.white; ctx.globalAlpha = .9; ctx.fill();
  }
  ctx.globalAlpha = 1; line(-rotorR * .58, 0, rotorR * .58, 0, colors.orange, 3); ctx.restore();

  ctx.font = '10px "DM Mono", monospace'; ctx.fillStyle = colors.muted; ctx.textAlign = 'center';
  ctx.fillText('STATOR COILS', cx, cy - outer - 16);
  ctx.fillText('CONDUCTING ROTOR', cx, cy + rotorR + 24);
}

function animate(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (running) {
    const v = values();
    const visualRate = .45 + (v.frequency - 10) / 90 * 1.75;
    const direction = reversed ? -1 : 1;
    phase += dt * visualRate * Math.PI * 2;
    rotorAngle += dt * visualRate * Math.PI * 2 * direction * (1 - v.slip) / v.polePairs;
  }
  drawWaves(); drawMotor(); requestAnimationFrame(animate);
}

[ui.frequency, ui.poles, ui.load].forEach((el) => el.addEventListener('input', updateUI));
ui.play.addEventListener('click', () => {
  running = !running;
  ui.play.innerHTML = running ? '<span aria-hidden="true">Ⅱ</span> Pause' : '<span aria-hidden="true">▶</span> Play';
});
ui.direction.addEventListener('click', () => {
  reversed = !reversed; ui.direction.setAttribute('aria-pressed', String(reversed));
  ui.direction.textContent = reversed ? '↺ Restore phases' : '↻ Reverse phases';
});
ui.reset.addEventListener('click', () => {
  ui.frequency.value = 50; ui.poles.value = 1; ui.load.value = 35;
  reversed = false; running = true; phase = 0; rotorAngle = 0;
  ui.direction.textContent = '↻ Reverse phases'; ui.direction.setAttribute('aria-pressed', 'false');
  ui.play.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause'; updateUI();
});

updateUI(); requestAnimationFrame(animate);
