export default function mount(host, api){
  host.style.placeItems='start';
  host.style.alignContent='start';
  host.style.padding='var(--space)';
  host.style.width='100%';
  const glyphs = ['◆','●','▲','■','✦','☽','✧','✴','✷','✪','☉','✕','◖','◗','◇','○','△','□','✹','✺','✤','✚','✱','✲','✳','✵'];

  let state = { phrase:'', mapping:new Map(), guess:new Map(), difficulty:2 };

  host.innerHTML = `
    <div style="display:grid;gap:14px;max-width:900px;margin:0 auto;width:100%">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="color:var(--muted)">Assign letters to glyphs to reveal the phrase.</div>
        <label style="display:flex;align-items:center;gap:6px">Difficulty
          <input id="diff" type="range" min="1" max="3" value="2"/>
        </label>
      </div>
      <div id="board" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center"></div>
      <div id="legend" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center"></div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn" id="hint">Hint</button>
        <button class="btn ghost" id="reveal">Reveal</button>
      </div>
      <div id="status" style="text-align:center;color:var(--muted)"></div>
    </div>`;
  const board = host.querySelector('#board');
  const legend = host.querySelector('#legend');
  const status = host.querySelector('#status');
  const diffInput = host.querySelector('#diff');

  function newRound(){
    const d = state.difficulty; // 1 easy, 2 normal, 3 hard
    const phrase = pickPhrase(d);
    state.phrase = phrase;
    const letters = [...new Set(phrase.replace(/[^A-Z]/g,''))];
    const mapping = new Map();
    const usedGlyphs = shuffle(glyphs).slice(0, letters.length);
    letters.forEach((L,i)=> mapping.set(usedGlyphs[i], L));
    state.mapping = mapping;
    state.guess = new Map();
    // pre-reveal based on difficulty
    const reveals = d===1 ? Math.min(3, letters.length) : d===2 ? 1 : 0;
    const revGlyphs = shuffle([...mapping.keys()]).slice(0, reveals);
    revGlyphs.forEach(G=> state.guess.set(G, mapping.get(G)));
    renderLegend(); renderBoard(); status.textContent='';
  }

  function renderBoard(){
    board.innerHTML='';
    for(const ch of state.phrase){
      if(ch===' '){ const sp=document.createElement('div'); sp.style.width='10px'; board.appendChild(sp); continue; }
      const glyph = getGlyphForLetter(ch);
      const tile=document.createElement('div'); tile.style.minWidth='28px'; tile.style.minHeight='40px'; tile.style.display='grid'; tile.style.placeItems='center'; tile.style.padding='6px 6px'; tile.style.border='var(--ring)'; tile.style.borderRadius='8px'; tile.style.background='var(--panel)'; tile.style.boxShadow='var(--shadow)';
      const assigned = state.guess.get(glyph)||' ';
      tile.innerHTML = `<div style="font-size:18px;opacity:.8">${glyph}</div><div style="font-weight:700;font-size:18px">${assigned}</div>`;
      board.appendChild(tile);
    }
  }
  function renderLegend(){
    legend.innerHTML='';
    for(const [G,L] of state.mapping){
      const btn=document.createElement('button'); btn.className='btn'; btn.style.minWidth='44px'; btn.style.display='grid'; btn.style.placeItems='center'; btn.title=`Assign for ${G}`; btn.innerHTML=`<div style="font-size:18px">${G}</div><div style="font-size:12px;color:var(--muted)">${state.guess.get(G)||'_'}</div>`;
      btn.addEventListener('click',()=>assign(G));
      legend.appendChild(btn);
    }
  }
  function assign(G){
    const letter = prompt(`Assign letter to ${G} (A-Z)`, '');
    if(!letter) return;
    const L = letter.toUpperCase().replace(/[^A-Z]/g,'');
    if(!L) return;
    state.guess.set(G, L[0]);
    renderLegend(); renderBoard(); checkWin();
  }
  function getGlyphForLetter(L){ for(const [G,LL] of state.mapping){ if(LL===L) return G; } return '?'; }
  function checkWin(){
    for(const [G,L] of state.mapping){ if((state.guess.get(G)||'')!==L) { status.textContent=''; return false; } }
    status.innerHTML = 'Solved. The glyphs fall silent.'; return true;
  }
  function hint(){
    for(const [G,L] of state.mapping){ if((state.guess.get(G)||'')!==L){ state.guess.set(G,L); break; } }
    renderLegend(); renderBoard(); checkWin();
  }
  function reveal(){ for(const [G,L] of state.mapping){ state.guess.set(G,L); } renderLegend(); renderBoard(); checkWin(); }

  diffInput.addEventListener('input', ()=>{ state.difficulty = parseInt(diffInput.value,10)||2; newRound(); });
  newRound();

  return { cleanup(){ board.innerHTML=''; }, hint, reveal };
}

function pickPhrase(difficulty){
  const easy = [
    'KEEP THE FLAME SMALL',
    'SILENCE IS KINDNESS',
    'FIND THE HIDDEN DOOR',
    'STAY CURIOUS',
  ];
  const normal = [
    'WE ARE MADE OF DUST',
    'EVERY LIGHT HAS A SHADOW',
    'THE ROOM LISTENS BACK',
    'GENTLE THOUGHTS MOVE STONES',
  ];
  const hard = [
    'WHEN YOU STARVE FEAR IT FADES',
    'NIGHT TEACHES THE LANGUAGE OF QUIET',
    'IN THE DARK WE MAP OURSELVES',
  ];
  const pool = difficulty===1? easy : difficulty===3? hard : normal;
  return pool[Math.floor(Math.random()*pool.length)];
}
function shuffle(a){ const arr=a.slice(); for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
