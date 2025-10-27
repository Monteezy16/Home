export default function mount(host, api){
  host.style.padding='var(--space)';
  const wrap=document.createElement('div'); wrap.style.display='grid'; wrap.style.gap='10px'; wrap.style.placeItems='center'; wrap.style.position='relative'; wrap.style.width='100%'; wrap.style.height='100%'; host.appendChild(wrap);
  const canvas=document.createElement('canvas'); canvas.style.background='#0b0b10'; canvas.style.border='var(--ring)'; canvas.style.borderRadius='12px'; canvas.style.maxWidth='100%'; canvas.style.height='auto'; wrap.appendChild(canvas);
  const info=document.createElement('div'); info.style.color='var(--muted)'; info.textContent='Arrow keys to move. Eat the runes; avoid your tail.'; wrap.appendChild(info);

  const ctx=canvas.getContext('2d');
  const N=20; let cell=26; // will be recalculated on resize
  let snake=[{x:10,y:10}]; let dir={x:1,y:0}; let food=spawnFood(); let alive=true; let tickMs=140; let timer=null; let score=0;

  function spawnFood(){
    while(true){ const f={x:Math.floor(Math.random()*N), y:Math.floor(Math.random()*N)}; if(!snake.some(s=>s.x===f.x&&s.y===f.y)) return f; }
  }
  function runeGlyph(){ const runes=['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᛟ','ᛞ']; return runes[Math.floor(Math.random()*runes.length)]; }
  let glyph=runeGlyph();
  function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); // grid mist
    ctx.fillStyle='rgba(255,255,255,0.02)'; for(let i=0;i<=N;i++){ ctx.fillRect(i*cell,0,1,canvas.height); ctx.fillRect(0,i*cell,canvas.width,1);} 
    // food rune
    ctx.save(); ctx.translate(food.x*cell+cell/2, food.y*cell+cell/2); ctx.fillStyle='#caa8ff'; ctx.font=`${Math.floor(cell*0.6)}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(glyph,0,0); ctx.restore();
    // snake shadow
    for(let i=0;i<snake.length;i++){ const s=snake[i]; const t=i/snake.length; const col=`rgba(140,120,200,${0.5+0.5*(1-t)})`; ctx.fillStyle=col; ctx.fillRect(s.x*cell+2, s.y*cell+2, cell-4, cell-4); }
  }
  function step(){ if(!alive) return; const head={x:snake[0].x+dir.x, y:snake[0].y+dir.y}; if(head.x<0||head.y<0||head.x>=N||head.y>=N){ die(); return; } if(snake.some(s=>s.x===head.x&&s.y===head.y)){ die(); return; } snake.unshift(head); if(head.x===food.x && head.y===food.y){ score++; food=spawnFood(); glyph=runeGlyph(); if(score%5===0 && tickMs>80){ tickMs=Math.max(70, tickMs-6); restartTimer(); } } else { snake.pop(); } draw(); }
  function die(){ alive=false; info.textContent='The serpent bites its own tail. Press New to try again.'; clearInterval(timer); try{ api && api.recordScore && api.recordScore('spooky-snake', { score }); }catch{} }
  function restartTimer(){ clearInterval(timer); timer=setInterval(step, tickMs); }
  function turn(nx,ny){ if((-nx===dir.x && -ny===dir.y)) return; dir={x:nx,y:ny}; }
  // Responsive sizing
  function resize(){
    // fit canvas within wrap, maintain square; respect some padding for controls
    const dpr = Math.min(devicePixelRatio||1, 2);
    const maxW = wrap.clientWidth;
    const maxH = Math.max(320, wrap.clientHeight - 160);
    const size = Math.floor(Math.min(maxW, maxH));
    cell = Math.floor(size / N);
    const w = cell * N, h = cell * N;
    canvas.style.width = w+'px';
    canvas.style.height = h+'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
    // adjust pad position/size
    if(pad){ const b = Math.max(56, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight) * 0.16));
      pad.style.gridTemplateColumns = `repeat(3,${b}px)`; pad.style.gridTemplateRows = `repeat(3,${b}px)`; pad.querySelectorAll('button').forEach(btn=>{ btn.style.width=b+'px'; btn.style.height=b+'px'; }); }
  }

  // Keyboard
  const keyHandler=(e)=>{ if(e.key==='ArrowUp') turn(0,-1); else if(e.key==='ArrowDown') turn(0,1); else if(e.key==='ArrowLeft') turn(-1,0); else if(e.key==='ArrowRight') turn(1,0); };
  window.addEventListener('keydown', keyHandler);

  // Mobile touch controls (D-pad)
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints>0);
  let pad; if(isTouch){
    pad = document.createElement('div'); pad.style.position='absolute'; pad.style.left='50%'; pad.style.bottom='8px'; pad.style.transform='translateX(-50%)'; pad.style.display='grid'; pad.style.gap='8px'; pad.style.touchAction='none';
    const mk=(label,dx,dy)=>{ const b=document.createElement('button'); b.className='btn'; b.textContent=label; b.style.width='64px'; b.style.height='64px'; b.style.borderRadius='50%'; b.style.background='var(--panel-2)'; b.style.fontSize='18px'; const act=(ev)=>{ ev.preventDefault(); turn(dx,dy); }; b.addEventListener('touchstart', act, {passive:false}); b.addEventListener('click', act); return b; };
    pad.appendChild(document.createElement('div'));
    pad.appendChild(mk('↑',0,-1));
    pad.appendChild(document.createElement('div'));
    pad.appendChild(mk('←',-1,0));
    const mid=document.createElement('div'); pad.appendChild(mid);
    pad.appendChild(mk('→',1,0));
    pad.appendChild(document.createElement('div'));
    pad.appendChild(mk('↓',0,1));
    pad.appendChild(document.createElement('div'));
    wrap.appendChild(pad);
  }
  const onResize=()=>resize();
  window.addEventListener('resize', onResize);
  resize();
  restartTimer();
  return { cleanup(){ clearInterval(timer); window.removeEventListener('keydown', keyHandler); window.removeEventListener('resize', onResize); if(pad) try{ wrap.removeChild(pad); }catch{} }, hint(){ info.textContent='You can graze the rune’s edge—be precise.'; }, reveal(){ info.textContent='Try hugging the outer ring; turn inward near the rune.'; } };
}
