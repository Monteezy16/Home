export default function mount(host){
  host.style.padding='var(--space)';
  const wrap=document.createElement('div'); wrap.style.display='grid'; wrap.style.gap='12px'; wrap.style.placeItems='center'; host.appendChild(wrap);
  const grid=document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(3,56px)'; grid.style.gap='8px'; wrap.appendChild(grid);
  const info=document.createElement('div'); info.style.color='var(--muted)'; wrap.appendChild(info);
  const ctrl=document.createElement('div'); ctrl.innerHTML='<button class="btn" id="start">Start</button> <button class="btn ghost" id="hint">Hint</button>'; wrap.appendChild(ctrl);
  const cells=[]; for(let i=0;i<9;i++){ const b=document.createElement('button'); b.className='btn'; b.style.width='56px'; b.style.height='56px'; b.style.borderRadius='8px'; b.style.background='var(--panel-2)'; grid.appendChild(b); cells.push(b);} 
  let seq=[], input=[], level=1, playing=false;
  function flash(i){ const b=cells[i]; const old=b.style.background; b.style.background='linear-gradient(180deg,#ffd49a,#f0a24a)'; setTimeout(()=> b.style.background=old, 160); }
  function play(){ playing=true; input=[]; info.textContent=`Level ${level}. Watch.`; let k=0; const id=setInterval(()=>{ flash(seq[k]); k++; if(k>=seq.length){ clearInterval(id); playing=false; info.textContent='Repeat the pattern.'; } }, 340); }
  function next(){ seq.push(Math.floor(Math.random()*9)); play(); }
  function fail(){ info.textContent='The grid forgets you. Again.'; level=1; seq=[]; setTimeout(start, 600); }
  function start(){ level=1; seq=[Math.floor(Math.random()*9)]; play(); }
  cells.forEach((b,i)=> b.addEventListener('click',()=>{ if(playing) return; flash(i); input.push(i); const idx=input.length-1; if(input[idx]!==seq[idx]) { fail(); return; } if(input.length===seq.length){ level++; info.textContent='Closer.'; next(); } }));
  ctrl.querySelector('#start').addEventListener('click', start);
  ctrl.querySelector('#hint').addEventListener('click', ()=>{ if(!seq.length) return; play(); });
  info.textContent='Listen with your eyes.';
  return { cleanup(){} };
}

