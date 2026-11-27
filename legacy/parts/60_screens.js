// ===================== SCREENS =====================
let G=null,SCREEN='title',PE=null;
const UI=()=>$('ui'),LAYER=()=>$('layer');
function setBlur(on){$('world').classList.toggle('blur',on);$('ui').classList.toggle('dim',on&&SCREEN==='game')}
function show(html){LAYER().innerHTML=html;setBlur(!!html);if(G&&(G.tut||G.mini))setTimeout(tut,30)}
function closeLayer(){LAYER().innerHTML='';setBlur(false);G&&(G.win=null);if(G&&!G.ended){renderGame();if(G.fq&&G.fq.length){const q_=G.fq.splice(0);q_.forEach(([k,d],i)=>{G.hot[k]=Date.now()+i*250;setTimeout(()=>floatNums(k,d),200+i*250)});setTimeout(renderGame,40)}}}
function titleScreen(){SCREEN='title';G=null;$('coach').classList.remove('on');show('');trains=[];setBuildings(['municipio','concejo','medios','terminal']);VIEW='sup';setView('sup',1);$('dBeac').innerHTML='';
 UI().innerHTML=`<div class="title"></div>
 <div style="position:absolute;left:96px;top:130px;width:580px;display:flex;flex-direction:column;gap:20px;animation:pop .6s">
  <div style="display:flex;align-items:center;gap:10px;color:var(--ice);font-weight:600;font-size:15px">${ic('train',20,'#9FD3FF')}Un juego sobre cómo funciona lo público</div>
  <h1 class="hd" style="margin:0;font-weight:700;font-size:104px;line-height:.92;letter-spacing:-.04em;color:#fff;text-shadow:0 0 50px rgba(61,139,255,.45)">Bajo<br>Quito</h1>
  <div style="width:84px;height:3px;background:var(--gold)"></div>
  <p style="margin:0;font-size:19px;line-height:1.55;color:#D7E1F7;max-width:470px">Dirige el Metro de Quito. Mantén los trenes andando, las cuentas en orden y al Concejo de tu lado.</p>
  <div style="display:flex;flex-direction:column;gap:12px;margin-top:10px;width:360px">
   <button class="btn" data-go="eps" style="min-height:56px;font-size:18px">Jugar</button>
   <div style="display:flex;gap:12px"><button class="btn2" data-go="how" style="flex:1">Cómo se juega</button><button class="btn2" data-go="src" style="flex:1">Fuentes</button></div>
  </div>
 </div>
 <div style="position:absolute;right:30px;top:26px"><button class="ibtn" data-snd aria-label="Sonido">${ic(AU.on?'sound':'mute',21)}</button></div>
 <div style="position:absolute;left:96px;bottom:30px;font-size:13px;color:#8EA0CC">Proyecto independiente · Prototipo v0.9 · Mezcla datos públicos del Metro de Quito con supuestos marcados</div>`}
function epArt(n){const A={1:['#F0A060','#5A4A90','<circle cx="160" cy="58" r="24" fill="#FFE3A0"/><rect x="20" y="110" width="180" height="70" fill="#2B3B80"/><path d="M20 110l30-20v20l30-20v20l30-20v20l30-20v20l30-20v20l30-20v20z" fill="#3E52A3"/><rect x="40" y="140" width="140" height="24" rx="8" fill="#EEF2FF"/><rect x="48" y="146" width="124" height="7" rx="2" fill="#FFC857"/>'],2:['#2C6BD6','#14245A','<path d="M60 92 110 64 160 92z" fill="#E9DFCB"/><rect x="62" y="92" width="96" height="70" fill="#F6F1E7"/>'+[0,1,2,3,4].map(i=>`<rect x="${70+i*20}" y="98" width="9" height="64" fill="#D8CCB2"/>`).join('')+[0,1,2,3,4].map(i=>`<ellipse cx="40" cy="${172-i*9}" rx="20" ry="6" fill="#FFC857" stroke="#B9851B" stroke-width="2"/>`).join('')],3:['#1E8F8A','#123E58','<path d="M10 150 C 70 110, 150 110, 210 70" stroke="#FFC857" stroke-width="4" fill="none" stroke-dasharray="10 8"/><rect x="20" y="122" width="72" height="42" rx="6" fill="#3DBE8B"/><rect x="28" y="130" width="56" height="12" rx="2" fill="#E7FFF4"/><circle cx="36" cy="166" r="7" fill="#0B1530"/><circle cx="76" cy="166" r="7" fill="#0B1530"/><rect x="118" y="56" width="90" height="32" rx="10" fill="#EEF2FF"/><rect x="126" y="64" width="74" height="8" rx="2" fill="#FFC857"/><rect x="118" y="80" width="90" height="4" fill="#FF6B2C"/>'],4:['#7A3E8F','#2A1B4D','<rect x="60" y="82" width="100" height="82" rx="4" fill="#E9DFCB"/><rect x="88" y="74" width="44" height="10" rx="2" fill="#0B1530"/><path d="M98 48 h22 v32 h-22z" fill="#FFFFFF" transform="rotate(-8 110 64)"/><path d="M84 120h52" stroke="#1B2340" stroke-width="4"/>']}[n];
 return `<svg width="290" height="170" viewBox="0 0 220 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="ea${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${A[0]}"/><stop offset="1" stop-color="${A[1]}"/></linearGradient></defs><rect width="220" height="180" fill="url(#ea${n})"/>${A[2]}</svg>`}
function episodesScreen(){SCREEN='eps';G=null;show('');setBlur(true);
 UI().innerHTML=`<div style="position:absolute;inset:0;background:rgba(3,7,20,.35)"></div>
 <div style="position:absolute;left:0;right:0;top:0;height:120px;display:flex;align-items:center;justify-content:space-between;padding:0 48px">
  <button class="ibtn" data-go="title" aria-label="Volver">${ic('back',22)}</button>
  <h1 class="hd" style="margin:0;font-weight:600;font-size:44px;color:#fff">Elige un episodio</h1>
  <div style="display:flex;align-items:center;gap:8px;background:rgba(9,17,42,.86);border:1px solid #2E4A8F;border-radius:4px;padding:8px 16px">${star(24)}<span class="hd" style="font-weight:600;font-size:20px">${totalStars()} / 12</span></div>
 </div>
 <div class="eps">${EPS.map((e,i)=>{const u=unlocked(e),st=PROG.stars[e.id]||0;
  return `<button class="ep ${u?'':'lock'}" ${u?`data-ep="${e.id}"`:'aria-disabled="true"'} style="animation-delay:${i*.08}s">
   <div style="position:relative;height:170px">${epArt(e.id)}${u?'':`<div style="position:absolute;inset:0;background:rgba(8,14,36,.74);display:grid;place-items:center"><div style="width:66px;height:66px;border-radius:4px;border:1px solid rgba(255,255,255,.35);display:grid;place-items:center;color:#fff">${ic('lock',32)}</div></div>`}<div class="hd" style="position:absolute;left:12px;top:12px;width:36px;height:36px;border-radius:3px;background:#0B1530;color:#fff;display:grid;place-items:center;font-weight:600;font-size:18px">${e.id}</div></div>
   <div style="padding:18px 20px 20px;display:flex;flex-direction:column;gap:10px;flex:1">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:700;color:var(--mute)"><span>${e.months} meses</span><span>${st===3?'Completo':st?'Jugado':u?'Disponible':'Bloqueado'}</span></div>
    <h2 class="hd" style="margin:0;font-weight:600;font-size:24px;line-height:1.1">${e.name}</h2>
    <p style="margin:0;font-size:14.5px;line-height:1.45;color:#3A4466;min-height:63px">${e.blurb}</p>
    <div class="stars">${[0,1,2].map(k=>star(26,k<st,.2+k*.1)).join('')}</div>
    <div style="margin-top:6px;font-size:13.5px;font-weight:600;color:${u?'var(--or)':'var(--mute)'}">${u?(st?'Jugar de nuevo →':'Empezar →'):e.id===2?'Termina el episodio 1 para abrirlo':`Consigue ${e.need} estrellas para abrirlo`}</div>
   </div></button>`}).join('')}</div>
 <div style="position:absolute;left:0;right:0;bottom:30px;text-align:center;color:#B9C6E6;font-size:15px">Cada episodio enseña algo nuevo y abre nuevos edificios. Sus 3 estrellas son sus 3 objetivos. <button data-unlock style="border:0;background:none;color:#7F8FB8;text-decoration:underline;font-size:13px;margin-left:10px">${PROG.unlockAll?'Volver a bloquear':'Abrir todos (modo revisión)'}</button></div>`}
