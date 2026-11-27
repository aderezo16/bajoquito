// ===================== STAGE =====================
// The interface keeps its 1440×900 stage, scaled to the window. The city behind it is the 3D scene (src/main.ts),
// reached through window.BQ3D. Everything that used to draw the illustrated map now talks to the 3D city.
const stage=$('stage');let K=1;
function fit(){const w=innerWidth,h=innerHeight;K=Math.min(w/1440,h/900);stage.style.transform=`translate(${(w-1440*K)/2}px,${(h-900*K)/2}px) scale(${K})`;if(G&&(G.tut||G.mini))tut()}
addEventListener('resize',fit);
const B3=()=>window.BQ3D||null;
// ===================== BUILDINGS =====================
const FAC={taller:['sub','wrench','Taller y cocheras'],bodega:['sub','box','Bodega'],control:['sub','train','Control de trenes'],municipio:['sup','landmark','Municipio'],concejo:['sup','users','Concejo'],medios:['sup','mega','Medios'],terminal:['sup','bus','Terminal de buses']};
let VIEW='sup',trains=[],phase=0,speedBoost=1,SEL=null;
const SCOL={red:'#E5484D',amb:'#F2A93B',ok:'#3DBE8B'};
function bStatus(id){const s=G.s;
 if(id==='taller')return s.salud<65?'red':(s.salud<78||s.mant==='r')?'amb':'ok';
 if(id==='bodega')return s.compra||s.emerg?'ok':s.rep<25?'red':s.rep<45?'amb':'ok';
 if(id==='control')return s.frec>=7?'amb':'ok';
 if(id==='municipio')return projEnd().caja<0?(s.caja<1?'red':'amb'):'ok';
 if(id==='concejo')return 'ok';
 if(id==='terminal')return G.ep.id===3&&s.integ+s.integPend<60?'amb':'ok';
 if(id==='medios')return s.apr<45?'red':s.apr<52?'amb':'ok';
 return 'ok'}
function setView(v,quiet){if(v!==VIEW){VIEW=v;SFX.click&&!quiet&&SFX.click()}B3()&&B3().setView(VIEW);$('isoSub').style.display=VIEW==='sub'?'':'none';$('isoSup').style.display=VIEW==='sup'?'':'none';if(G&&SCREEN==='game')renderGame();else drawDyn()}
function viewOf(id){return FAC[id]?FAC[id][0]:/^st\d/.test(id)?null:null}
function markSel(id){SEL=id;B3()&&B3().select(id)}
function viewSwitch(){const lk=G&&G.ep.id===1,b=(k,t,icn)=>`<button data-view="${k}" aria-pressed="${VIEW===k}">${k==='sup'&&lk?ic('lock',16,'currentColor',2):icn}${t}</button>`;
 const up='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/></svg>',dn='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h18M6 8h12M4 20a8 8 0 0 1 16 0z"/><path d="M12 12v4"/></svg>';
 const alertOther=!lk&&Object.keys(FAC).some(id=>viewOf(id)!==VIEW&&(id==='control'||G.ep.bld.includes(id))&&bStatus(id)!=='ok');
 return `<div class="vsw">${b('sup','Superficie',up)}${b('sub','Bajo tierra',dn)}${alertOther?`<i class="vdot" style="${VIEW==='sup'?'right':'left'}:8px"></i>`:''}</div>`}
// markers: the 3D scene moves them every frame (BQ3D.placeMarkers); here they start hidden until placed
function isoMarks(){const s=G.s,e=G.ep;let o='';
 for(const id in FAC){const [v,icn,name]=FAC[id];if(v!==VIEW)continue;if(!(id==='control'||e.bld.includes(id))||(G.hideNew&&e.newB.includes(id)))continue;
  const st=bStatus(id),isNew=e.newB.includes(id)&&s.mes===1;
  o+=`<div class="im m3 ${st} ${SEL===id?'sel':''}" data-hs="${id}" tabindex="0" role="button" aria-label="${name}" style="visibility:hidden"><span class="imc">${ic(icn,16,'#DCE6FA',1.9)}<i style="background:${SCOL[st]}"></i></span><span class="imt">${name}</span>${isNew?'<span class="new">NUEVO</span>':''}<span class="imstem"></span></div>`}
 if(e.bld.includes('st')&&!(G.hideNew&&e.newB.includes('st')))for(let i=0;i<15;i++){const bad=!s.eq[i]||(s.lastFalla&&s.lastFalla.st===i&&s.lastFalla.m>=s.mes-1);
  o+=`<div class="ist m3 ${bad?'bad':''}" data-hs="st${i}" tabindex="0" role="button" aria-label="Estación ${STN[i]}" style="visibility:hidden"><span class="imt">${STN[i]}</span>${bad?`<span class="isb">${ic('alert',12,'#fff',2.4)}</span>`:''}</div>`}
 setTimeout(()=>B3()&&B3().placeMarkers(),0);
 return o}
const q$=s=>document.querySelector(s),qa=s=>document.querySelectorAll(s);
function scandal(s){return s.log.some(l=>l.m===s.mes-1&&['grave','viral','sucio','robo','cri','crip'].includes(l.k))}
// ===================== THE CITY REACTS =====================
// Everything the illustrated map used to show, handed to the 3D scene as plain numbers.
function drawDyn(){const s=G?G.s:{salud:85,pax:213,frec:5,lastFalla:null,eq:Array(15).fill(1),loc:Array(15).fill(0),integ:40,integPend:0,rep:55,mant:'n',apr:55,sat:70,cri:[],lv:{seg:'n',lim:'n',ene:'n'},log:[],mes:1,tarifa:.45};
 const moy=((s.mes||1)-1)%12+1,mx=Math.max(...SHARE),wait=(s.frec/5)*(s.salud<50?1.3:1);
 const showProt=!!(G&&G.ep.bld.includes('municipio')&&s.apr<46),brS=[0,1,2,3,4,5].some(i=>!s.eq[i]);
 const bad=G&&s.log.find(l=>l.m>=s.mes-1&&l.tone==='bad');
 const Z=G&&typeof zones==='function'?zones(s).map(z=>({k:z.k,n:z.n,mood:z.mood})):[];
 const city={
  playing:!!G,salud:s.salud,frec:s.frec,mant:(G&&G.prevMant)||s.mant,rep:s.rep,
  happy:G?cl(fel(s)/100,0,1):.72,
  stations:Array.from({length:15},(_,i)=>({crowd:Math.min(1,SHARE[i]/mx*(s.pax/213)*wait*.85),broken:!s.eq[i],
   fault:!!(G&&s.lastFalla&&s.lastFalla.st===i&&s.lastFalla.m>=s.mes-1),
   dark:((s.cri||[]).some(c=>c.k==='apagon')&&i>=1&&i<=3)?.85:s.lv&&s.lv.ene==='a'?.35:0,
   ad:s.loc[i]?{t:s.loc[i].t,on:!!s.loc[i].on}:null,dirty:!!(s.lv&&s.lv.lim==='r')})),
  protest:showProt?(brS?'ESCALERAS YA':s.tarifa>.45?'NO AL ALZA':'MEJOR METRO'):null,
  tv:!!(G&&G.ep.bld.includes('medios')&&scandal(s)),
  led:(bad?bad.t:`El Metro mueve ${Math.round(s.pax)} mil viajes al día`),
  zones:Z,buses:Math.min(8,2+Math.floor((s.integ||40)/18)),terminalBuses:Math.max(1,Math.min(4,Math.floor((s.integ||40)/22))),
  rain:!!(G&&([3,4,10,11].includes(moy)||(s.cri||[]).some(c=>c.k==='lluvia'))),
  locked:!!(G&&G.ep.id===1),stationsOpen:!!(G&&G.ep.bld.includes('st')),month:moy,view:VIEW};
 B3()&&B3().apply(city);
 markSel(G&&G.win?(/^st\d/.test(G.win.id)?null:G.win.id):null);$('isoSup').classList.toggle('locked',!!(G&&G.ep.id===1))}
function shade_(c,f){const n=parseInt(c.slice(1),16),r=Math.round(((n>>16)&255)*f),g=Math.round(((n>>8)&255)*f),b=Math.round((n&255)*f);return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}
function placeTrains(){B3()&&B3().speed(speedBoost)}
function setBuildings(list){B3()&&B3().setBuildings(list)}
function riseBuilding(id,delay){setTimeout(()=>{if(VIEW!=='sup')setView('sup',1);B3()&&B3().rise(id);SFX.rise();
 banner('Nuevo: '+{municipio:'Municipio',concejo:'Concejo Metropolitano',medios:'Medios',terminal:'Terminal de buses'}[id])},delay)}
function banner(t){const d=document.createElement('div');d.className='bannerx';d.textContent=t;$('fx').appendChild(d);setTimeout(()=>d.remove(),2700)}
