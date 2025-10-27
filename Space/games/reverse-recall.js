export default function mount(host){
  host.style.padding='var(--space)';
  const wrap=document.createElement('div'); wrap.style.display='grid'; wrap.style.gap='12px'; wrap.style.placeItems='center'; host.appendChild(wrap);
  const grid=document.createElement('div'); grid.style.display='grid'; grid.style.gridTemplateColumns='repeat(4,64px)'; grid.style.gap='8px'; wrap.appendChild(grid);
  const info=document.createElement('div'); info.style.color='var(--muted)'; wrap.appendChild(info);
  const ctrl=document.createElement('div'); ctrl.innerHTML='<button class="btn" id="start">Start</button> <button class="btn ghost" id="hint">Hint</button>'; wrap.appendChild(ctrl);
  const pads=[]; for(let i=0;i<4;i++){ const b=document.createElement('button'); b.className='btn'; b.style.width='64px'; b.style.height='64px'; b.style.borderRadius='10px'; b.style.background='var(--panel-2)'; b.textContent=['↑','→','↓','←'][i]; grid.appendChild(b); pads.push(b);} 
  let seq=[], input=[], level=1, playing=false;
  function flash(i){ const b=pads[i]; const old=b.style.background; b.style.background='linear-gradient(180deg,#caa8ff,#8e6df3)'; setTimeout(()=> b.style.background=old, 200); }
  function play(){
    playing=true; input=[]; info.textContent=`Level ${level}. Watch.`;
    let k=0; const id=setInterval(()=>{
      flash(seq[k]); k++;
      if(k>=seq.length){ clearInterval(id); playing=false; info.textContent='Echo it back—backwards.'; }
    }, 420);
  }
  function next(){ seq.push(Math.floor(Math.random()*4)); setTimeout(play, 400); }
  function fail(){ info.textContent='It echoes the other way.'; level=1; seq=[]; setTimeout(start, 600); }
  function start(){ level=1; seq=[Math.floor(Math.random()*4)]; play(); }
  pads.forEach((b,i)=> b.addEventListener('click',()=>{
    if(playing) return;
    flash(i); input.push(i);
    // Compare against full reversed sequence progressively to avoid off-by-one errors
    const reversed = seq.slice().reverse();
    const idx = input.length-1;
    if(input[idx] !== reversed[idx]){ fail(); return; }
    if(input.length===seq.length){ level++; info.textContent='Good. The echo deepens.'; next(); }
  }));
  ctrl.querySelector('#start').addEventListener('click', start);
  ctrl.querySelector('#hint').addEventListener('click', ()=>{ if(!seq.length) return; play(); });
  info.textContent='The room wants a backward answer.';
  return { cleanup(){} };
}
