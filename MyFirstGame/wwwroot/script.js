const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start');
const scoreDiv = document.getElementById('score');

const gridSize = 20; // 20x20 grid (400x400 canvas)
let snake;
let dir;
let food;
let score;
let timer;
let speed = 400; // ms per tick (slower)

function reset() {
  snake = [{x:9,y:9}];
  dir = {x:1,y:0};
  placeFood();
  score = 0;
  updateScore();
}

function placeFood() {
  while (true) {
    const x = Math.floor(Math.random()*gridSize);
    const y = Math.floor(Math.random()*gridSize);
    if (!snake.some(s=>s.x===x && s.y===y)) { food = {x,y, type: randomFruitType()}; break; }
  }
}

function randomFruitType(){
  const types = ['apple','banana','cherry','orange'];
  return types[Math.floor(Math.random()*types.length)];
}

function updateScore(){ scoreDiv.textContent = '分数: ' + score; }

function drawCell(x,y,color,isHead){
  const size = 20;
  const cx = x*size + size/2;
  const cy = y*size + size/2;
  const r = size*0.45;

  // radial gradient for a soft, rounded look
  const grad = ctx.createRadialGradient(cx, cy, r*0.2, cx, cy, r);
  if (color === 'green' || color === 'lime') {
    grad.addColorStop(0, isHead ? '#e6ffea' : '#d4f8d6');
    grad.addColorStop(0.6, color === 'lime' ? '#b7ffb7' : '#7ccf7c');
    grad.addColorStop(1, '#0b3d0b');
  } else if (color === 'red') {
    grad.addColorStop(0, '#ffd6d6');
    grad.addColorStop(0.6, '#ff6b6b');
    grad.addColorStop(1, '#7f0000');
  } else {
    grad.addColorStop(0, color);
    grad.addColorStop(1, color);
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fill();

  // draw a subtle 'fur' halo using small translucent dots around the segment
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const rx = cx + Math.cos(ang) * (r + 2 + Math.random() * 3);
    const ry = cy + Math.sin(ang) * (r + 2 + Math.random() * 3);
    const rr = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI*2);
    ctx.fill();
  }
}

function tick(){
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  // wrap around
  head.x = (head.x + gridSize) % gridSize;
  head.y = (head.y + gridSize) % gridSize;

  // collision with self
  if (snake.some(s => s.x===head.x && s.y===head.y)) {
    clearInterval(timer);
    alert('游戏结束! 分数: ' + score);
    return;
  }

  snake.unshift(head);
  if (head.x===food.x && head.y===food.y) {
    score += 10;
    placeFood();
    updateScore();
  } else {
    snake.pop();
  }

  // draw
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawFruit(food.x, food.y, food.type);
  for (let i=0;i<snake.length;i++) {
    drawCell(snake[i].x, snake[i].y, i===0 ? 'lime' : 'green', i===0);
  }
}

function drawFruit(x,y,type){
  const size = 20;
  const cx = x*size + size/2;
  const cy = y*size + size/2;
  const r = size*0.38;

  if (type === 'apple'){
    // apple body
    const grad = ctx.createRadialGradient(cx-3, cy-3, r*0.2, cx, cy, r);
    grad.addColorStop(0, '#fff0f0');
    grad.addColorStop(0.5, '#ff6b6b');
    grad.addColorStop(1, '#7f0000');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    // stem
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy-r*0.6); ctx.lineTo(cx, cy-r*1.05); ctx.stroke();
    // leaf
    ctx.fillStyle = '#2e8b2e'; ctx.beginPath(); ctx.ellipse(cx-3, cy-r*0.85, 4, 7, -0.7, 0, Math.PI*2); ctx.fill();
  } else if (type === 'banana'){
    // banana as a curved yellow ellipse
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.6);
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.ellipse(0, 0, r*1.3, r*0.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  } else if (type === 'cherry'){
    // two small cherries
    const r2 = r*0.7;
    ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(cx - r2*0.5, cy + r2*0.2, r2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r2*0.5, cy + r2*0.2, r2, 0, Math.PI*2); ctx.fill();
    // stems
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - r2*0.5, cy - r2*0.1); ctx.lineTo(cx - r2*0.2, cy - r2*0.9); ctx.moveTo(cx + r2*0.5, cy - r2*0.1); ctx.lineTo(cx + r2*0.2, cy - r2*0.9); ctx.stroke();
    // leaf
    ctx.fillStyle = '#2e8b2e'; ctx.beginPath(); ctx.ellipse(cx + r2*0.2, cy - r2*0.95, 3, 6, -0.6, 0, Math.PI*2); ctx.fill();
  } else if (type === 'orange'){
    // orange with texture
    ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    for (let i=0;i<6;i++){ ctx.beginPath(); ctx.arc(cx + Math.cos(i)*r*0.2, cy + Math.sin(i)*r*0.2, r*0.08, 0, Math.PI*2); ctx.fill(); }
    // small stem
    ctx.strokeStyle = '#5b3a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy - r*0.7); ctx.lineTo(cx, cy - r*1.05); ctx.stroke();
  } else {
    // fallback: simple red dot
    ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  }
}

window.addEventListener('keydown', e => {
  const k = e.key;
  if (k==='ArrowUp' && dir.y!==1) dir = {x:0,y:-1};
  if (k==='ArrowDown' && dir.y!==-1) dir = {x:0,y:1};
  if (k==='ArrowLeft' && dir.x!==1) dir = {x:-1,y:0};
  if (k==='ArrowRight' && dir.x!==-1) dir = {x:1,y:0};
});

startBtn.addEventListener('click', ()=>{
  if (timer) clearInterval(timer);
  reset();
  timer = setInterval(tick, speed);
});

// auto focus
canvas.tabIndex = 1000;
canvas.addEventListener('click', ()=>{
  canvas.focus();
  // start the game when canvas is clicked and game is not already running
  if (!timer) startBtn.click();
});
