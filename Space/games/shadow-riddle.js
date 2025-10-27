export default function mount(host, api){
  host.style.padding='var(--space)';
  const wrap=document.createElement('div'); wrap.style.display='grid'; wrap.style.gap='12px'; wrap.style.maxWidth='60ch'; host.appendChild(wrap);
  const r = pick();
  wrap.innerHTML = `
    <div style="color:var(--muted)">${r.text}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <input id="ans" class="btn" style="background:var(--panel-2)" placeholder="Answer"/>
      <button class="btn" id="submit">Speak</button>
      <button class="btn ghost" id="hint">Hint</button>
      <button class="btn ghost" id="reveal">Reveal</button>
    </div>
    <div id="out" style="color:var(--muted)"></div>`;
  const ans=wrap.querySelector('#ans'), out=wrap.querySelector('#out');
  function check(){
    const v=(ans.value||'').trim().toLowerCase();
    if(!v){ out.textContent='Say something true.'; return; }
    if(r.answers.some(a=>v===a)){
      out.innerHTML = 'The room nods.<br/>' + explainHTML(r);
    } else {
      out.textContent='The room waits.';
    }
  }
  wrap.querySelector('#submit').addEventListener('click', check);
  wrap.querySelector('#hint').addEventListener('click', ()=>{ out.textContent=r.hint; });
  wrap.querySelector('#reveal').addEventListener('click', ()=>{ out.innerHTML=`It was "${r.answers[0]}".` + '<br/>' + explainHTML(r); });
  ans.addEventListener('keydown',e=>{ if(e.key==='Enter') check(); }); ans.focus();
  return { cleanup(){}, hint(){ out.textContent=r.hint; }, reveal(){ out.innerHTML=`It was \"${r.answers[0]}\".` + '<br/>' + explainHTML(r); } };
}

function pick(){
  const list=[
    { text:'It follows you when the moon is out, but never ahead. What is it?', answers:['shadow'], hint:'It needs light to exist.', explain:'A shadow forms when light is blocked. It stays behind the object, never ahead of the light.' },
    { text:'I am taken before you see me, and kept after you forget me. What am I?', answers:['photograph','a photograph','photo'], hint:'Paper memory.', explain:'You “take” a photograph before seeing it, and it preserves a memory you might later forget.' },
    { text:'What walks on four in the morning, two at noon, three in the evening?', answers:['man','human'], hint:'The old riddle about ages.', explain:'A person crawls as a baby (morning), walks as an adult (noon), and uses a cane when old (evening).' },
    { text:'What has a mouth but never speaks, and a bed but never sleeps?', answers:['river','a river'], hint:'It runs.', explain:'A river has a mouth and a riverbed; it flows, but does not speak or sleep.' },
    { text:'What gets sharper the more you use it?', answers:['mind','the mind','wit'], hint:'Not metal.', explain:'The mind (or wit) improves with use and practice.' },
    { text:'I have cities but no houses, mountains but no trees, seas but no water. What am I?', answers:['map','a map'], hint:'Flat.', explain:'A map can depict cities, mountains, and seas without containing them.' },
    { text:'The more you take, the more you leave behind. What are they?', answers:['footsteps','steps','footstep'], hint:'You make them by moving.', explain:'Every step you take leaves footprints behind.' },
    { text:'What can fill a room but takes up no space?', answers:['light'], hint:'It chases the dark.', explain:'Light can fill a room yet has no physical volume.' },
    { text:'What has many keys but opens no locks?', answers:['piano','a piano','keyboard','a keyboard'], hint:'Musical or mechanical.', explain:'A piano or keyboard has keys for playing or typing, not for locks.' },
    { text:'What invention lets you look right through a wall?', answers:['window','a window'], hint:'Common and clear.', explain:'A window is part of a wall and lets you see through.' },
    { text:'If you have me, you want to share me; if you share me, you no longer have me. What am I?', answers:['secret','a secret'], hint:'Keep it close.', explain:'A secret stops being a secret when shared.' },
  ];
  return list[Math.floor(Math.random()*list.length)];
}

function explainHTML(r){
  return `<span style="color:var(--muted)">${r.explain||''}</span>`;
}
