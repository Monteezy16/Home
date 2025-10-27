export default function mount(host, api){
  host.style.padding='var(--space)';
  const wrap=document.createElement('div'); wrap.style.display='grid'; wrap.style.gap='10px'; wrap.style.placeItems='center'; host.appendChild(wrap);
  const row=document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; wrap.appendChild(row);
  const dials=[createDial(),createDial(),createDial()]; dials.forEach(d=>row.appendChild(d.el));
  const actions=document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.flexWrap='wrap'; actions.style.justifyContent='center'; actions.innerHTML=`<button class="btn" id="try">Try</button><button class="btn ghost" id="hint">Hint</button><span id="msg" style="color:var(--muted)"></span>`; wrap.appendChild(actions);
  const msg=actions.querySelector('#msg');

  const solution = generateSolution(); // object {a,b,c}
  function createDial(){ const el=document.createElement('div'); el.style.display='grid'; el.style.placeItems='center'; el.style.width='68px'; el.style.height='68px'; el.style.border='var(--ring)'; el.style.borderRadius='50%'; el.style.background='var(--panel-2)'; el.style.boxShadow='var(--shadow)'; const val=document.createElement('div'); val.textContent='0'; val.style.fontSize='24px'; val.style.fontWeight='700'; el.appendChild(val); el.tabIndex=0; const obj={ value:0, el }; const spin=(d)=>{ obj.value=(obj.value+d+10)%10; val.textContent=String(obj.value); }; el.addEventListener('click',()=>spin(1)); el.addEventListener('wheel',(e)=>{ e.preventDefault(); spin(e.deltaY>0? -1:1); }, {passive:false}); el.addEventListener('keydown',e=>{ if(e.key==='ArrowUp'||e.key==='+') spin(1); else if(e.key==='ArrowDown'||e.key==='-') spin(-1); }); return obj; }
  function generateSolution(){ // consistent, solvable relations
    // Choose c then derive b and a
    const c = 3 + Math.floor(Math.random()*6); // 3..8
    const b = (2*c - 2) % 10; // clue: middle is twice last minus 2
    const a = (12 - b + 10) % 10; // clue: sum of first two is 12
    return {a,b,c};
  }
  function check(){ const [a,b,c]=dials.map(d=>d.value); if(a===solution.a && b===solution.b && c===solution.c){ msg.textContent='It clicks open.'; } else { msg.textContent='Not yet.'; } }
  function hint(){ const hints=[ 'Sum of first two is 12.', 'Middle is twice the last minus 2.', 'First shares parity with last.' ]; msg.textContent = hints[Math.floor(Math.random()*hints.length)]; }
  actions.querySelector('#try').addEventListener('click', check);
  actions.querySelector('#hint').addEventListener('click', hint);

  return { cleanup(){}, hint, reveal(){ const [a,b,c]=[solution.a,solution.b,solution.c]; dials[0].value=a; dials[1].value=b; dials[2].value=c; dials.forEach((d,i)=> d.el.querySelector('div').textContent=String([a,b,c][i])); msg.textContent='You feel a faint shame as the tumblers align.'; } };
}

