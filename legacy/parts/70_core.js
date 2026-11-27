// ===================== GAME CORE =====================
function startEp(id){const e=EPS.find(x=>x.id===id);const s=newState(Object.assign({meses:e.months},JSON.parse(JSON.stringify(e.init))));
 G={ep:e,s,ended:false,used:[],msgs:{},toast:null,reports:[],tut:null,prev:null,dilDone:{},posts:[],mail:[],newPosts:0,mid:0,mailSel:null,mailTab:0,gTab:0,ofi:{amt:1,why:null}};PE=null;
 if(id>=2){gPost({who:'c1',place:'Usa el Metro en La Carolina',tag:'#MetroUIO',tone:'good',text:'Hoy los trenes pasaron cada 5 minutos y llegué a tiempo a la oficina. Así sí.'});gPost({who:'pren',place:'Periodista · El Andino',tag:'#CuántoCuestaElMetro',tone:'mix',text:'¿Sabía que el pasaje del Metro cubre una parte pequeña de lo que cuesta cada viaje? Esta semana publicamos las cifras.'});G.newPosts=0}
 LAYER().innerHTML='';SCREEN='game';trains=[];setBlur(false);$('coach').classList.remove('on');VIEW=id===1?'sub':'sup';$('isoSub').style.display=VIEW==='sub'?'':'none';$('isoSup').style.display=VIEW==='sup'?'':'none';
 const pre=e.bld.filter(b=>!e.newB.includes(b));setBuildings(pre.concat(id===1?[]:[]));
 G.tBase=G.tCur=tsnap(s);G.tm=s.mes;renderGame();
 if(e.newB.length){G.hideNew=true;G.intro=true;if(e.newB.some(b=>viewOf(b)==='sup'))setView('sup',1);const g0=G;
  whenClear(()=>{if(G!==g0)return;const bs=e.newB.filter(b=>b!=='st');bs.forEach((b,i)=>riseBuilding(b,500+i*1200));
   if(e.newB.includes('st'))setTimeout(()=>{if(G!==g0)return;banner('Nuevo: ahora puedes gestionar cada estación');qa('.shit').forEach(p=>p.classList.add('flash'));setTimeout(()=>qa('.shit').forEach(p=>p.classList.remove('flash')),1600)},500+bs.length*1200);
   setTimeout(()=>{if(G!==g0)return;G.hideNew=false;G.intro=false;renderGame();letter()},1100+bs.length*1200+(e.newB.includes('st')?1900:0))})}
 else letter()}
function whenClear(fn,t0=Date.now()){const busy=LAYER().innerHTML||$('coach').classList.contains('on')||$('fx').querySelector('.bannerx');if(!busy||Date.now()-t0>8000){setTimeout(fn,250);return}setTimeout(()=>whenClear(fn,t0),200)}
function tsnap(s){return{salud:s.salud,caja:s.caja,pax:s.pax,apr:s.apr,cap:s.cap}}
const TTH={salud:.5,caja:.1,pax:.5,apr:.5,cap:.5,fel:.5};
function trendI(k){const s=G.s;if(!G.pj)return '';const d=G.pj[k]-(k==='fel'?(s.apr+s.sat)/2:s[k]);if(Math.abs(d)<TTH[k]*2)return '';const up=d>0,hot=G.hot&&G.hot[k]&&Date.now()-G.hot[k]<2600;
 return `<i class="trd ${up?'up':'dn'} ${hot?'hot':''}" title="${up?'Va al alza':'Va a la baja'}"><svg width="11" height="11" viewBox="0 0 10 10"><path d="${up?'M5 1.2 L9 8.2 H1Z':'M5 8.8 L9 1.8 H1Z'}" fill="#fff"/></svg></i>`}
function floatNums(k,d){if(k==='apr'||k==='cap')return;const b=$({salud:'pSal',caja:'pCaja',pax:'pPax',apr:'pApr',cap:'pCap',fel:'pApr'}[k]);if(!b)return;const r=b.getBoundingClientRect(),sr=stage.getBoundingClientRect(),x=(r.left-sr.left)/K+r.width*.55,y=(r.top-sr.top)/K+r.height-6;
 const n=Math.min(3,Math.max(2,Math.ceil(Math.abs(d)/(k==='caja'?.3:2)))),part=d/n,up=d>0;
 const f=v=>{const a=Math.abs(v);return (up?'+':'−')+(k==='caja'?a.toFixed(1).replace('.',',')+' M':k==='pax'?(a>=1?Math.round(a):a.toFixed(1).replace('.',','))+' mil':(a>=1?Math.round(a):a.toFixed(1).replace('.',',')))};
 for(let i=0;i<n;i++)setTimeout(()=>{const e=document.createElement('div');e.className='fnum '+(up?'up':'dn');e.textContent=f(part);e.style.left=(x-34+i*30)+'px';e.style.top=(y+(i%2)*10)+'px';$('fx').appendChild(e);setTimeout(()=>e.remove(),1500)},i*260)}
function projEnd(){if(!G)return null;if(!PE)PE=project(G.s,{},Math.max(0,G.ep.months-G.s.mes+1));return PE}
function invalidate(){PE=null}
function letter(){const e=G.ep;show(`<div class="modal" style="width:760px;padding:44px 52px">
 <div style="display:flex;justify-content:space-between;align-items:flex-start;font-size:13px;color:var(--mute);font-weight:600"><span>Despacho del Alcalde · Quito</span><span>Episodio ${e.id} de 4</span></div>
 <h1 style="margin:20px 0 10px">${e.name}</h1>
 <p style="margin:0 0 6px">Estimado gerente:</p><p style="margin:0 0 14px">${e.letter}</p>
 <div style="font-weight:700;font-size:14px;margin-bottom:8px">Le encargamos, en ${e.months} meses:</div>
 <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">${e.goals.map(g=>`<div style="display:flex;gap:10px;align-items:center;font-size:16px">${star(22,false)}<span>${g.t}</span></div>`).join('')}</div>
 <p style="margin:0;font-size:14px;color:var(--mute)">Si la ciudad pierde la confianza (felicidad bajo 20), o si la caja cae por debajo de −USD 5 M, tendremos que pedirle la renuncia.</p>
 <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px"><div style="font-family:Caveat,cursive;font-size:30px;line-height:1">Marcelo Vinueza<div style="font-family:Inter;font-size:12px;color:var(--mute);font-weight:600">Jefe de despacho</div></div><button class="btn" data-start>Asumir el encargo</button></div>
</div>`);SFX.open()}
function afterLetter(){closeLayer();startTut();renderGame()}
function startTut(){const T=TUTS[G.ep.id];if(T&&!PROG.tut[G.ep.id]){G.tut={i:0,list:T};setTimeout(tut,300)}else{G.toast=G.toast||{p:'rosa',t:'Bienvenido, gerente. Los puntos de color sobre cada edificio te dicen dónde hace falta tu atención.'};renderGame();monthStart()}}
// ---------- render ----------
function goalState(g){const s=G.s,cur=g.st(s);if(cur==='ok')return['Cumplido','#3DBE8B','check'];if(cur==='bad')return['Fallado','#E5484D','x'];if(cur==='pend')return['Pendiente','#F2A93B','clock'];const pe=projEnd();return g.end(pe)?['En camino','#3DBE8B','check']:['En riesgo','#F2A93B','alert']}
function missions(){const s=G.s,e=G.ep,b=e.bld,M=[],pe=projEnd();
 if(b.includes('bodega')&&!s.compra&&!s.emerg&&s.rep<50)M.push(['red','Comprar repuestos','La bodega se vacía y comprar tarda 4–8 meses','bodega']);
 if(s.mant==='r')M.push(['amb','El mantenimiento está recortado','En 3 meses los trenes lo van a sentir','taller']);
 if(s.salud<70&&s.mant!=='f')M.push(['red','Los trenes están cansados','Sube el mantenimiento en el taller','taller']);
 if(b.includes('municipio')&&pe.caja<0)M.push([s.caja<1?'red':'amb','Las cuentas no cierran',`Al ritmo actual terminarás con ${money(pe.caja)}`,'fin']);
 const br=s.eq.map((x,i)=>x?null:i).filter(x=>x!=null);if(b.includes('st')&&br.length)M.push(['amb','Escaleras dañadas en '+STN[br[0]],'Repararlas cuesta USD 0,15 M','st'+br[0]]);
 if(b.includes('terminal')&&s.integ+s.integPend<60)M.push(['amb','Conecta los barrios con el Metro','Negocia con los buses en la terminal','terminal']);
 if(b.includes('st')&&s.loc.filter(l=>l).length<3&&s.ap>0)M.push(['ok','Gana ingresos con publicidad','Licita publicidad en las estaciones más concurridas','stad']);
 const pm=pendCount();if(pm&&M.length<3)M.push(['amb',pm+' pendiente'+(pm>1?'s':'')+' en la bandeja','Tu equipo espera instrucciones','correo']);
 if(fel(s)<45&&b.includes('concejo'))M.push(['amb','La ciudad está molesta','Con poca felicidad, el Concejo y el Alcalde te apoyan menos','apr']);
 if(!M.length)M.push(['ok','Todo en orden','Cierra el mes cuando estés listo','close']);M.sort((a,b)=>({red:0,amb:1,ok:2})[a[0]]-({red:0,amb:1,ok:2})[b[0]]);
 return M.slice(0,3)}
function renderGame(){if(!G)return;const s=G.s,e=G.ep,m=Math.min(s.mes,e.months);if(!G.ended)mailSync();if(G.tm!==s.mes){G.tBase=G.tCur||tsnap(s);G.tCur=tsnap(s);G.tm=s.mes}
 {const o=project(s,{},6).out[5],pj={salud:o.salud,caja:o.caja,pax:o.pax,apr:o.apr,cap:o.cap,fel:(o.apr+o.sat)/2};G.hot=G.hot||{};
  if(G.pj&&G.pjM===s.mes&&!G.intro){for(const k in pj){const d=pj[k]-G.pj[k];if(Math.abs(d)>=TTH[k]){if(LAYER().innerHTML){G.fq=G.fq||[];const ex=G.fq.find(x=>x[0]===k);if(ex)ex[1]+=d;else G.fq.push([k,d])}else{G.hot[k]=Date.now();setTimeout(()=>floatNums(k,d),60)}}}}
  G.pj=pj;G.pjM=s.mes}
 const pill=(icon,col,val,lab,id,win,bar,tk)=>`<button class="pill" id="${id}" data-win="${win}"><div class="ic" style="background:${col}">${ic(icon,20,'#fff',2)}</div><div><b>${val}${tk?trendI(tk):''}</b><span>${lab}</span>${bar!=null?`<i class="pbar"><i style="width:${bar}%;background:${col}"></i></i>`:''}</div><span class="more">›</span></button>`;
 const sc=s.salud>=75?'#2F9E70':s.salud>=60?'#D9961C':'#C9424A';
 const hs=(id,x,y,w,h,name)=>{if(!e.bld.includes(id)||(G.hideNew&&e.newB.includes(id)))return '';const st=bStatus(id),isNew=e.newB.includes(id)&&s.mes===1;return `<div class="hs ${st}" data-hs="${id}" tabindex="0" role="button" aria-label="${name}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${isNew?'<span class="new">NUEVO</span>':''}<span class="tag"><i style="background:${SCOL[st]}"></i>${name}</span></div>`};
 const gh=e.goals.map(g=>{const [lab,c,icn]=goalState(g);return `<div class="goal">${ic(icn,17,c,2.4)}<div style="flex:1">${g.t}${g.sub?`<small>${g.sub(s)}</small>`:''}</div><span class="chipst" style="background:${c}22;color:${c}">${lab}</span></div>`}).join('');
 const okc=e.goals.filter(g=>goalState(g)[0]==='Cumplido'||goalState(g)[0]==='En camino').length;
 const ms=missions();
 UI().innerHTML=`
 <div class="hud">
  <div class="dial" style="background:conic-gradient(var(--gold) 0 ${(m-1)/e.months*100}%,rgba(255,255,255,.14) ${(m-1)/e.months*100}% 100%)"><div><span class="hd" style="font-weight:600;font-size:20px">${m}</span><span style="font-size:10px;font-weight:700;color:#9DB0DA">de ${e.months}</span></div></div>
  <div style="line-height:1.2;min-width:128px"><div class="hd" style="font-weight:600;font-size:21px;text-transform:capitalize">${mesName(m)}${s.mes>12?' · año 2':''}</div><div style="font-size:12.5px;color:#9DB0DA;font-weight:600">${season(s.mes)?`<span class="seas">${season(s.mes)}</span>`:`Episodio ${e.id} · ${e.name}`}</div></div>
  <div style="display:flex;gap:8px;margin-left:6px">
   ${pill('wrench',sc,Math.round(s.salud)+'<small>/100</small>','trenes','pSal','taller',s.salud,'salud')}${pill('coin','#D9961C',money(s.caja),'caja','pCaja','fin',null,'caja')}${pill('users','#2F79E0',Math.round(s.pax)+' mil','pasajeros/día','pPax','pax',null,'pax')}${pill('heart','#C9424A',fel(s),'felicidad','pApr','apr',null,'fel')}
  </div>
  <div style="margin-left:auto;display:flex;gap:8px"><button class="hbtn" data-win="correo">${ic('inbox',21)}Bandeja<span class="badge" id="bdMail" style="background:var(--red);display:none"></span></button><button class="hbtn gal-b" data-win="gallito">${gallito(24,'#E8A93C')}Gallito<span class="badge" id="bdGal" style="background:#C98A2B;display:none"></span></button><button class="ibtn" data-snd aria-label="Sonido">${ic(AU.on?'sound':'mute',20)}</button><button class="ibtn" data-pause aria-label="Menú">${ic('menu',21)}</button></div>
 </div>
 <div class="rail">
  <button data-win="hub">${ic('compass',23)}Qué hacer</button>
  <button data-win="fin">${ic('chart',23)}Finanzas</button>
  <button data-win="informes">${ic('doc',23)}Informes</button>
  <button data-win="ficha">${ic('id',23)}Mi ficha</button>
 </div>
 ${(G.tut||PROG.panelOpen)?`<div class="side-r">
  <div class="box" id="objCard"><h3><span>Objetivos</span><span style="display:flex;align-items:center;gap:10px"><span class="stars">${[0,1,2].map(k=>star(16,k<okc)).join('')}</span>${G.tut?'':`<button class="fold" data-panel aria-label="Ocultar panel">${ic('x',15,'#9DB0DA',2.2)}</button>`}</span></h3>${gh}<div style="font-size:11.5px;color:#7F8FB8;margin-top:6px">"En camino" y "En riesgo" proyectan cómo terminarás si sigues igual.</div></div>
  <div class="box" id="mission"><h3><span>Qué conviene hacer</span></h3><div class="mis">${ms.map(([c,t,d,go])=>`<div class="misi"><i style="background:${SCOL[c]}"></i><span><b>${t}</b><small>${d}</small></span></div>`).join('')}</div></div>
 </div>`:`<button class="side-tab" data-panel id="objCard"><span class="stars">${[0,1,2].map(k=>star(15,k<okc)).join('')}</span><b>Objetivos</b>${ms.filter(x=>x[0]!=='ok').length?`<span class="stab-n">${ms.filter(x=>x[0]!=='ok').map(x=>`<i style="background:${SCOL[x[0]]}"></i>`).join('')}</span>`:''}${ic('back',16,'#9DB0DA',2)}</button>`}
 ${viewSwitch()}${isoMarks()}${VIEW==='sup'&&e.id===1?`<div class="lockc">${ic('lock',26,'#FFC857',2)}<b class="hd">La ciudad se abre en el episodio 2</b><span>Por ahora, todo pasa bajo tierra.</span><button class="btn2" data-view="sub">Volver bajo tierra</button></div>`:''}
 ${criBar()}
 <div class="dock" id="dock">
  <div class="fichas" id="fichas"><span class="flab">Acciones</span>${Array.from({length:P.ap},(_,k)=>`<i class="tok ${k<s.ap?'on':''}" id="tok${k}">${k<s.ap?ic('bolt',20,'#1B2340',2.2):''}</i>`).join('')}<b class="hd">${s.ap} de ${P.ap}</b></div>
  ${s.ap<=0?'<span class="nofich">Sin fichas: cierra el mes</span>':''}
  <button class="btn ${s.ap<=0?'pulseb':''}" id="closeBtn" data-endturn style="min-width:200px">Cerrar ${mesName(m)} ${ic('arrow',18,'#fff',2.2)}</button>
 </div>
 ${G.toast?`<div class="toast" id="toast"><div style="flex:none">${portrait(G.toast.p,56)}</div><div><b>${PEOPLE[G.toast.p].n}</b><p>${G.toast.t}</p>${G.toast.mail?`<button class="link" data-mailopen="${G.toast.mail}" style="margin-top:6px;font-size:14px">Leer el correo →</button>`:''}</div><button class="x" data-tx aria-label="Cerrar">×</button></div>`:''}`;
 drawDyn();renderRailBadges();clearTimeout(G.dT);G.dT=setTimeout(deliverMail,650)}
