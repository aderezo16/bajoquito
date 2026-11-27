// ===================== LOOP =====================
let last=0;
function loop(ts){const dt=Math.min(100,ts-(last||ts));last=ts;phase=(phase+dt*.00002*(G?5/G.s.frec:1)*speedBoost)%1;placeTrains();requestAnimationFrame(loop)}
// ===================== EVENTS =====================
document.addEventListener('mouseover',ev=>{const h=ev.target.closest&&ev.target.closest('.shit');qa('.ist.hov').forEach(x=>x.classList.remove('hov'));if(h&&G&&G.ep.bld.includes('st')){const m=document.querySelector(`.ist[data-hs="${h.dataset.hs}"]`);if(m)m.classList.add('hov')}});
function gotoTarget(g){if(SIMPLE&&(g==='fin1'||g==='fin')){SFX.open();openWin('fin',0);tutDone('open-fin');return}if(SIMPLE&&(g==='cap'||g==='apr')){felSheet();return}if(g==='close'){closeMonth();return}
 if(g==='correo'){SFX.open();openMail();return}if(g==='cri'){const c=G.s.cri[0];if(c){openCrisis(c.k)}else banner('Esa crisis ya terminó');return}if(g==='gallito'){SFX.open();openGallito();return}
 if(g==='fin'){SFX.open();openCaja();tutDone('open-fin');return}if(g==='fin1'){SFX.open();openRecibo();return}if(g.startsWith('aj:')){SFX.open();openAjuste(g.slice(3));return}
 if(g==='taller1'||g==='control'){SFX.open();openWin('control',0);return}
 if(['pax','apr','cap'].includes(g)){SFX.open();panel(g);return}
 if(g==='st'||g==='st0'||g==='stad'){const br=G.s.eq.findIndex(x=>!x);if(br>=0&&g!=='stad'){openWin('st'+br,0);return}let bi=0,bv=-1;G.s.loc.forEach((l,i)=>{if(!l&&SHARE[i]>bv){bv=SHARE[i];bi=i}});SFX.open();openWin('st'+bi,1);return}
 if(/^st\d/.test(g)&&!G.ep.bld.includes('st')){banner('Las estaciones se abren en el episodio 2');return}
 if(!/^st\d/.test(g)&&!WIN[g])return;if(WIN[g]&&!G.ep.bld.includes(g)&&g!=='taller'){banner('Se abre en un episodio posterior');return}
 SFX.open();openWin(g,0);tutDone('open-'+g)}
document.addEventListener('click',ev=>{const t=ev.target,q=sel=>t.closest(sel);{const sr=stage.getBoundingClientRect();window.LASTC={x:(ev.clientX-sr.left)/K,y:(ev.clientY-sr.top)/K}}
 if(q('[data-tskip]')){if(G){if(G.mini){PROG.tut[G.mini.key]=1;G.mini=null}else{G.tut=null;PROG.tut[G.ep.id]=1}save()}tut();if(G&&!G.dilDone[G.s.mes])monthStart();return}
 if(q('[data-tnext]')){tutAdvance();return}
 const go=q('[data-go]');if(go){SFX.click();const g=go.dataset.go;if(g==='eps')episodesScreen();else if(g==='title')titleScreen();else if(g==='how')howTo();else if(g==='src')sources();return}
 if(q('[data-snd]')){AU.on=!AU.on;PROG.sound=AU.on;save();SFX.click();q('[data-snd]').innerHTML=ic(AU.on?'sound':'mute',20);return}
 if(q('[data-unlock]')){PROG.unlockAll=!PROG.unlockAll;save();episodesScreen();return}
 if(q('[data-reset]')){SFX.click();show(`<div class="modal" style="width:440px;padding:30px 32px"><h1 style="font-size:24px;margin:0 0 8px">¿Empezar de cero?</h1><p style="margin:0 0 20px;color:var(--mute)">Se borran tus estrellas, los episodios abiertos y los tutoriales vistos.</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btnp" data-close>Cancelar</button><button class="btn" data-reset-ok>Reiniciar todo</button></div></div>`);return}
 if(q('[data-reset-ok]')){try{localStorage.removeItem(KEY)}catch(e){}PROG={stars:{},unlockAll:false,sound:true,tut:{}};AU.on=true;save();G=null;closeLayer();titleScreen();banner('Todo listo para empezar de nuevo');return}
 const ep=q('[data-ep]');if(ep){SFX.click();startEp(+ep.dataset.ep);return}
 if(!G){if(q('[data-close]')){SFX.click();closeLayer()}return}
 if(q('[data-start]')){SFX.click();afterLetter();return}
 if(q('[data-restart]')){startEp(G.ep.id);return}
 if(q('[data-pause]')){SFX.click();pauseMenu();return}
 if(q('[data-endturn]')){closeMonth();return}
 const vw=q('[data-view]');if(vw){setView(vw.dataset.view);tutDone('view');return}
 if(q('[data-close-rep]')){SFX.click();afterReport();return}
 if(q('[data-after]')){SFX.click();closeLayer();renderGame();return}
 const rp=q('[data-rep]');if(rp){report(+rp.dataset.rep,SCREEN==='game'&&!LAYER().querySelector('.ms2'));return}
 const cr=q('[data-cri]');if(cr){openCrisis(cr.dataset.cri);return}
 const co=q('[data-crop]');if(co&&!co.disabled){const [k,j]=co.dataset.crop.split(':');cropAct(k,+j);return}
 const sw_=q('[data-sub]');if(sw_){SFX.open();if(sw_.dataset.sub==='lag')lagWin();return}
 const bn=q('[data-banc]');if(bn){SFX.open();bancWin(bn.dataset.banc);return}
 const sa=q('[data-sact]');if(sa&&!sa.disabled){doAct(sa.dataset.sact,JSON.parse(sa.dataset.arg));return}
 const sv=q('[data-svc]');if(sv){const v=sv.dataset.svc;G.s.lv=Object.assign({},SVC[v]);invalidate();SFX.click();renderGame();openWin('fin',0);return}
 const mg=q('[data-mgo]');if(mg){const ml=G.mail.find(x=>x.id===+mg.dataset.mgo);if(ml){ml.read=true;SFX.open();closeLayer();const g=ml.go;setTimeout(()=>{if(g==='gal')openGallito(0);else gotoTarget(g)},120)}return}
 const ru=q('[data-reu]');if(ru&&!ru.disabled){doAct('reunion',ru.dataset.reu);return}
 const of=q('[data-off]');if(of){const [k,v]=of.dataset.off.split(':');G.off[k]=+v;SFX.click();openWin('terminal',0);return}
 if(q('[data-mesa]')&&!q('[data-mesa]').disabled){doAct('integ',Object.assign({},G.off));return}
 if(q('[data-close]')){SFX.click();closeLayer();tut();return}
 if(q('[data-tx]')){G.toast=null;renderGame();return}
 const pk=q('[data-pick]');if(pk){G.pick=+pk.dataset.pick;SFX.click();document.querySelectorAll('.dcard').forEach((c,i)=>c.setAttribute('aria-pressed',i===G.pick));document.querySelector('[data-confirm]').disabled=false;tutDone('dil-pick');return}
 if(q('[data-confirm]')&&G.pick!=null){const d=G.curDil,o=d.o[G.pick];{const c0=G.s.cap;o[3](G.s);if(SIMPLE)capSync(G.s,c0)}invalidate();G.s.log.unshift({m:G.s.mes,t:'Decidiste: '+o[0].toLowerCase(),d:d.tt+' · pedido de '+PEOPLE[d.p].n+'.',tone:''});gDecision(d,G.pick);SFX.act();tutDone('dil-confirm');closeLayer();advise();renderGame();tut();return}
 const tb=q('[data-tab]');if(tb&&G.win){SFX.click();openWin(G.win.id,+tb.dataset.tab);return}
 const gt=q('[data-goto]');if(gt){gotoTarget(gt.dataset.goto);return}
 const w=q('[data-win]');if(w){SFX.open();const k=w.dataset.win;panel(k);if(k==='fin')tutDone('open-fin');if(k==='correo')tutDone('open-correo');if(k==='gallito')tutDone('open-gallito');return}
 const mo=q('[data-mailopen]');if(mo){SFX.open();G.toast=null;openMail(+mo.dataset.mailopen);return}
 const ml=q('[data-mail]');if(ml){SFX.click();openMail(+ml.dataset.mail);return}
 const mt_=q('[data-mtab]');if(mt_){SFX.click();G.mailTab=+mt_.dataset.mtab;G.mailSel=null;openMail();return}
 const ma=q('[data-mact]');if(ma&&!ma.disabled){const [id,j,pp]=ma.dataset.mact.split(':');mailAction(+id,+j,!!pp);return}
 const lt=q('[data-later]');if(lt){closeLayer();tut();flyEnv(1);return}
 if(q('[data-panel]')){PROG.panelOpen=!PROG.panelOpen;save();SFX.click();renderGame();return}
 const fp=q('[data-fin]');if(fp){SFX.open();flowWin(fp.dataset.fin);return}
 if(q('[data-caja]')){SFX.click();openCaja();return}
 if(q('[data-recibo]')){SFX.click();openRecibo();return}
 const aj=q('[data-aj]');if(aj){SFX.open();openAjuste(aj.dataset.aj);return}
 const mr=q('[data-march]');if(mr){const m_=G.mail.find(x=>x.id===+mr.dataset.march);if(m_){m_.arch=!m_.arch;G.mailSel=null;SFX.card();openMail()}return}
 const gt_=q('[data-gtab]');if(gt_){SFX.click();openGallito(+gt_.dataset.gtab);return}
 const lv=q('[data-lv]');if(lv){const [k,v]=lv.dataset.lv.split(':');G.s.lv[k]=v;invalidate();SFX.click();renderGame();openAjuste(k);return}
 const oa=q('[data-ofi-amt]');if(oa){G.ofi.amt=+oa.dataset.ofiAmt;SFX.click();openWin('municipio',0);return}
 const ow=q('[data-ofi-why]');if(ow){G.ofi.why=ow.dataset.ofiWhy;SFX.click();openWin('municipio',0);return}
 if(q('[data-ofi-send]')&&!q('[data-ofi-send]').disabled){const o=G.ofi;SFX.stamp();doAct('transf',{amt:o.amt,why:o.why,match:WHY[o.why][1](G.s)});return}
 const ad=q('[data-ad]');if(ad&&!ad.disabled){const [i,tt]=ad.dataset.ad.split(':');doAct('loc',{i:+i,t:tt});return}
 const a=q('[data-act]');if(a&&!a.disabled){doAct(a.dataset.act);return}
 const rr=q('[data-repair]');if(rr){repair(G.s,+rr.dataset.repair);invalidate();SFX.coin();renderGame();openWin('st'+rr.dataset.repair,0);banner('Escaleras reparadas');return}
 const mt=q('[data-mant]');if(mt){G.s.mant=mt.dataset.mant;invalidate();SFX.click();renderGame();if(G.win&&G.win.id==='taller')openWin('taller',G.win.tab);else openMantPop();return}
 const fr=q('[data-frec]');if(fr){G.s.frec=+fr.dataset.frec;invalidate();trains=[];SFX.click();renderGame();if(G.win&&G.win.id==='control')openWin('control',0);else openFrecPop();return}
 if(q('[data-mpop]')){SFX.open();openMantPop();return}if(q('[data-fpop]')){SFX.open();openFrecPop();return}if(q('[data-fallas]')){SFX.open();openFallas();return}if(q('[data-taller]')){SFX.click();openWin('taller',0);return}
 const ps=q('[data-pst]');if(ps){SFX.click();openPax(+ps.dataset.pst);return}
 const hs=q('[data-hs]');if(hs&&!G.ended&&/^st\d/.test(hs.dataset.hs)&&!G.ep.bld.includes('st')){banner('Las estaciones se abren en el episodio 2');return}
 if(hs&&!G.ended&&viewOf(hs.dataset.hs)==='sup'&&G.ep.id===1)return;
 if(hs&&!G.ended){SFX.open();openWin(hs.dataset.hs,0);tutDone('open-'+hs.dataset.hs);if(G.tut)setTimeout(tut,320);return}
});
document.addEventListener('keydown',ev=>{if((ev.key==='Enter'||ev.key===' ')&&ev.target.dataset&&ev.target.dataset.hs){ev.preventDefault();ev.target.click()}if(ev.key==='Escape'&&LAYER().querySelector('[data-close]'))closeLayer()});
function pauseMenu(){show(`<div class="modal" style="width:420px;padding:32px 34px;display:flex;flex-direction:column;gap:12px"><h1 style="font-size:28px;margin-bottom:6px">Pausa</h1><button class="btn" data-close>Volver al juego</button><button class="btnp" data-restart>Reiniciar el episodio</button><button class="btnp" data-go="eps">Salir a episodios</button><button class="btnp" data-go="how">Cómo se juega</button></div>`)}
function howTo(){show(`<div class="modal" style="width:820px;padding:38px 46px"><h1>Cómo se juega</h1><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 30px;margin-top:20px;font-size:15px;line-height:1.5">
 ${[['flag','Cumple tus 3 objetivos','Cada episodio tiene metas. Cada meta cumplida es una estrella.'],['compass','Sigue las luces','Rojo y ámbar sobre un edificio indican que necesita tu atención. "Qué conviene hacer" te sugiere el siguiente paso.'],['cal','Usa tus 2 fichas de acción','Las acciones grandes ocurren de inmediato y usan 1 ficha. El taller y las reparaciones no gastan puntos.'],['chart','Mira el efecto antes de decidir','Cada opción muestra cómo quedarán los trenes, la caja y los pasajeros en los próximos meses.'],['users','Decide en los dilemas','Personas del sistema te piden decisiones. No hay respuestas perfectas.'],['doc','Cierra el mes y lee el informe','El expediente explica de dónde vino y a dónde fue el dinero, y por qué cambió cada indicador.']].map(([i,t,d])=>`<div style="display:flex;gap:14px"><span style="width:42px;height:42px;border-radius:3px;background:var(--ink);color:#fff;display:grid;place-items:center;flex:none">${ic(i,21,'#fff')}</span><div><b>${t}</b><br>${d}</div></div>`).join('')}
 </div><div style="text-align:right;margin-top:24px"><button class="btn" data-close>Entendido</button></div></div>`)}
function sources(){show(`<div class="modal" style="width:820px;padding:38px 46px"><h1>Fuentes y metodología</h1><p>Prototipo educativo de un proyecto independiente. No es una herramienta oficial ni una proyección: simplifica la realidad para mostrar las restricciones de gestionar un servicio público.</p>
 <p><b>Datos reales:</b> 15 estaciones y 22,5 km; 16 trenes en servicio y 2 de reserva; intervalo de 5 minutos en hora pico; unos 213.000 viajes por día laborable; tarifa de USD 0,45; deuda de construcción de USD 60 a 70 M al año; necesidad de unos 400.000 pasajeros diarios para ser sostenible.</p>
 <p><b>Supuestos del juego:</b> costos de operación y mantenimiento, subsidio municipal, tiempos de contratación, probabilidades de aprobación, ingresos por locales y efectos de cada decisión.</p>
 <p style="font-size:14px">Fuentes: <a href="https://metrodequito.gob.ec/wp-content/uploads/2025/06/Rendicion-de-Cuentas-2024_diagramado-web.pdf" style="color:var(--ink)">Rendición de cuentas EPMMQ 2024</a> · <a href="https://www.primicias.ec/quito/metro-mantenimiento-viajes-usuarios-trenes-estaciones-104666/" style="color:var(--ink)">Primicias, sep. 2025</a> · <a href="https://www.elcomercio.com/actualidad/quito/metro-de-quito-recibe-una-calificacion-de-99-sobre-10-de-la-ciudadania/" style="color:var(--ink)">El Comercio, ago. 2026</a> · <a href="https://www.elcomercio.com/actualidad/quito/ciudades-redujeron-brecha-pasajes-costo-operacion-metro/" style="color:var(--ink)">El Comercio, brecha de costos</a></p>
 <div style="text-align:right;margin-top:16px"><button class="btn" data-close>Cerrar</button></div></div>`)}
