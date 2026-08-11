const byId = (id) => document.getElementById(id);
const ui = {
  canvas: byId('motorCanvas'), frequency: byId('frequency'), poles: byId('poles'), load: byId('load'),
  frequencyValue: byId('frequencyValue'), polesValue: byId('polesValue'), loadValue: byId('loadValue'),
  fieldSpeed: byId('fieldSpeed'), rotorSpeed: byId('rotorSpeed'), slip: byId('slip'),
  phaseValue: byId('phaseValue'), note: byId('motorNote'), reverse: byId('reverse'), reset: byId('reset')
};
const context = ui.canvas.getContext('2d');
const palette = { ink:'#10221f', line:'#50605a', orange:'#e96543', blue:'#297b90', yellow:'#e1b54b', white:'#fffdf7', muted:'#96a19c' };
let phase = 0;
let rotorAngle = 0;
let reversed = false;
let previousTime = performance.now();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function modelValues() {
  const frequency = Number(ui.frequency.value);
  const polePairs = Number(ui.poles.value);
  const load = Number(ui.load.value);
  const slip = 0.008 + load * 0.00078;
  const synchronous = 60 * frequency / polePairs;
  return { frequency, polePairs, load, slip, synchronous, rotor: synchronous * (1 - slip) };
}

function updateReadouts() {
  const value = modelValues();
  ui.frequencyValue.value = `${value.frequency} Hz`;
  ui.polesValue.value = `${value.polePairs} ${value.polePairs === 1 ? 'pair' : 'pairs'}`;
  ui.loadValue.value = `${value.load}%`;
  ui.fieldSpeed.textContent = Math.round(value.synchronous).toLocaleString();
  ui.rotorSpeed.textContent = Math.round(value.rotor).toLocaleString();
  ui.slip.textContent = (value.slip * 100).toFixed(1);
  ui.note.textContent = value.load > 75
    ? 'The heavier load slows the rotor. Greater slip induces stronger rotor currents, producing more torque and more heating.'
    : value.load < 15
      ? 'With little load, the rotor nearly catches the field. A small speed difference remains so induction can continue.'
      : 'The field moves slightly faster than the rotor. That difference induces rotor current and creates torque.';
}

function fitCanvas() {
  const bounds = ui.canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const width = Math.max(300, Math.floor(bounds.width));
  const height = Math.max(390, Math.floor(bounds.height));
  if (ui.canvas.width !== width * ratio || ui.canvas.height !== height * ratio) {
    ui.canvas.width = width * ratio;
    ui.canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  return { width, height };
}

function drawLine(x1, y1, x2, y2, color, width = 1, dash = []) {
  context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2);
  context.strokeStyle = color; context.lineWidth = width; context.setLineDash(dash); context.stroke(); context.setLineDash([]);
}

function drawArrow(cx, cy, angle, length, color, width) {
  if (length < 0) { angle += Math.PI; length = Math.abs(length); }
  const x2 = cx + Math.cos(angle) * length;
  const y2 = cy + Math.sin(angle) * length;
  drawLine(cx, cy, x2, y2, color, width);
  context.save(); context.translate(x2, y2); context.rotate(angle);
  context.beginPath(); context.moveTo(0, 0); context.lineTo(-11, -6); context.lineTo(-8, 0); context.lineTo(-11, 6); context.closePath();
  context.fillStyle = color; context.fill(); context.restore();
}

function renderMotor() {
  const { width, height } = fitCanvas();
  context.clearRect(0, 0, width, height);
  const cx = width / 2, cy = height / 2;
  const outer = Math.min(width, height) * 0.4;
  const rotorRadius = outer * 0.52;
  const value = modelValues();
  const direction = reversed ? -1 : 1;
  const fieldAngle = direction * phase / value.polePairs - Math.PI / 2;
  const currentA = Math.sin(phase);
  const currentB = Math.sin(phase + direction * Math.PI / 2);

  context.save(); context.translate(cx, cy);
  context.strokeStyle = palette.line; context.lineWidth = 1;
  context.beginPath(); context.arc(0, 0, outer, 0, Math.PI * 2); context.stroke();
  context.beginPath(); context.arc(0, 0, outer * 0.8, 0, Math.PI * 2); context.stroke();
  for (let i = 0; i < 32; i += 1) {
    const angle = i / 32 * Math.PI * 2;
    const phaseA = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle));
    const amplitude = phaseA ? currentA : currentB;
    context.save(); context.translate(Math.cos(angle) * outer * 0.9, Math.sin(angle) * outer * 0.9); context.rotate(angle);
    context.fillStyle = phaseA ? palette.orange : palette.blue; context.globalAlpha = 0.35 + 0.55 * Math.abs(amplitude);
    context.fillRect(-5, -3, 10, 6); context.restore();
  }
  for (let i = 0; i < 9; i += 1) {
    const offset = (i - 4) * outer * 0.11;
    const spread = Math.sqrt(Math.max(0, outer * outer - offset * offset)) * 0.7;
    const px = -Math.sin(fieldAngle) * offset, py = Math.cos(fieldAngle) * offset;
    drawLine(px - Math.cos(fieldAngle) * spread, py - Math.sin(fieldAngle) * spread, px + Math.cos(fieldAngle) * spread, py + Math.sin(fieldAngle) * spread, palette.yellow, i === 4 ? 1.8 : 0.7, [3, 7]);
  }
  context.restore();

  drawArrow(cx, cy, -Math.PI / 2, outer * 0.67 * currentA, palette.orange, 3);
  drawArrow(cx, cy, 0, outer * 0.67 * currentB, palette.blue, 3);
  drawArrow(cx, cy, fieldAngle, outer * 0.73, palette.yellow, 5);

  context.save(); context.translate(cx, cy); context.rotate(rotorAngle);
  context.fillStyle = '#293a35'; context.strokeStyle = palette.white; context.lineWidth = 1;
  context.beginPath(); context.arc(0, 0, rotorRadius, 0, Math.PI * 2); context.fill(); context.stroke();
  context.beginPath(); context.arc(0, 0, rotorRadius * 0.18, 0, Math.PI * 2); context.fillStyle = palette.ink; context.fill(); context.stroke();
  for (let i = 0; i < 16; i += 1) {
    const angle = i / 16 * Math.PI * 2;
    context.beginPath(); context.arc(Math.cos(angle) * rotorRadius * 0.76, Math.sin(angle) * rotorRadius * 0.76, 3.2, 0, Math.PI * 2); context.fillStyle = palette.white; context.fill();
  }
  drawLine(-rotorRadius * 0.58, 0, rotorRadius * 0.58, 0, palette.orange, 3); context.restore();
  context.fillStyle = palette.muted; context.textAlign = 'center'; context.font = '9px "DM Mono", monospace';
  context.fillText('STATOR COILS', cx, cy - outer - 14); context.fillText('CONDUCTING ROTOR', cx, cy + rotorRadius + 22);
}

function animate(time) {
  const elapsed = Math.min((time - previousTime) / 1000, 0.05); previousTime = time;
  if (!reducedMotion) {
    const value = modelValues();
    const visualRate = 0.45 + (value.frequency - 10) / 90 * 1.65;
    phase += elapsed * visualRate * Math.PI * 2;
    rotorAngle += elapsed * visualRate * Math.PI * 2 * (reversed ? -1 : 1) * (1 - value.slip) / value.polePairs;
  }
  ui.phaseValue.textContent = `phase = ${Math.round((phase % (Math.PI * 2)) * 180 / Math.PI)}°`;
  renderMotor(); requestAnimationFrame(animate);
}

[ui.frequency, ui.poles, ui.load].forEach((control) => control.addEventListener('input', updateReadouts));
ui.reverse.addEventListener('click', () => {
  reversed = !reversed; ui.reverse.setAttribute('aria-pressed', String(reversed));
  ui.reverse.textContent = reversed ? '↺ Restore phases' : '↻ Reverse phases';
});
ui.reset.addEventListener('click', () => {
  ui.frequency.value = 50; ui.poles.value = 1; ui.load.value = 35; reversed = false; phase = 0; rotorAngle = 0;
  ui.reverse.setAttribute('aria-pressed', 'false'); ui.reverse.textContent = '↻ Reverse phases'; updateReadouts();
});
updateReadouts(); requestAnimationFrame(animate);
