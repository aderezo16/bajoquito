// ===================== TUTORIAL =====================
const TUTS={
 1:[{sel:'#objCard',t:'Tus objetivos',d:'Cada objetivo cumplido es una estrella. La etiqueta dice si vas en camino o en riesgo según cómo terminarías si sigues igual.',next:1},
    {sel:'#mission',t:'Qué conviene hacer',d:'Aquí verás siempre las prioridades del mes. Los puntos de color coinciden con los de cada edificio.',next:1},
    {sel:'.vsw',t:'Dos vistas de Quito',d:'Aquí cambias entre la ciudad y el Metro bajo tierra. El taller y la bodega están abajo.',next:1},
    {sel:'[data-hs=taller]',t:'Empieza por el taller',d:'Toca el taller y cocheras.',wait:'open-taller'},
    {sel:'#prevMant',inL:1,t:'¿Cuánto mantenimiento?',d:'Cada opción te muestra lo que ganas y lo que pierdes. Por ahora, déjalo en normal.',next:1,close:1},
    {sel:'[data-hs=bodega]',t:'Ahora la bodega',d:'La luz roja indica que hace falta tu atención. Toca la bodega.',wait:'open-bodega'},
    {sel:'#layer [data-act=compra]',inL:1,t:'Inicia la compra',d:'Usa 1 de tus 2 fichas de acción. La compra arranca ahora mismo.',wait:'act-compra',close:1},
    {sel:'#fichas',t:'Tus fichas de acción',d:'Cada mes tienes 2. Las acciones grandes usan una. Ajustar el taller, los trenes o reparar no gasta fichas.',next:1},
    {sel:'#pApr',t:'La felicidad de la ciudad',d:'Es tu meta de fondo: trenes seguidos, sin fallas y estaciones cuidadas. Si baja de 20, pierdes el cargo.',next:1},
    {sel:'[data-win=correo]',t:'Tu bandeja',d:'Tu bandeja de entrada. Lo urgente te aparece en pantalla; lo demás llega aquí volando, y el número dice cuántos pendientes tienes.',next:1},
    {sel:'#pSal',t:'El estado técnico, siempre a la vista',d:'Así están tus trenes. Si bajan de 80, aparecen fallas. Tócalo para ir al taller.',next:1},
    {sel:'#closeBtn',t:'Cierra el mes',d:'Cuando termines, cierra el mes. Verás el informe con todo lo que pasó y por qué.',wait:'close-month'},
    {m:2,sel:'#pCaja',t:'¿De dónde viene el dinero?',d:'Toca la caja para ver qué entra y qué sale cada mes. Ciérralo cuando termines.',wait:'open-fin'},
    {m:2,sel:'#closeBtn',t:'Ahora sigues tú',d:'Atiende las luces de colores, usa tus fichas y cierra los meses. Cumple tus 3 objetivos para ganar las 3 estrellas.',next:1}],
 2:[{sel:'#pCaja',t:'Las cuentas, primero',d:'En este episodio la caja manda. Toca aquí para ver qué entra y qué sale. Ciérralo cuando termines.',wait:'open-fin'},
    {sel:'[data-hs=municipio]',t:'El Municipio',d:'Aquí le pides más apoyo al Alcalde. Te escucha más si la ciudad está contenta.',next:1},
    {sel:'[data-hs=concejo]',t:'El Concejo',d:'Aquí se pide subir la tarifa. 21 concejales votan; necesitas 11.',next:1},
    {sel:'.ist',t:'Las estaciones',d:'Las estaciones no tienen locales, pero pueden vender publicidad. También tienen escaleras que a veces se dañan.',next:1},
    {sel:'[data-win=gallito]',t:'Gallito: lo que canta Quito',d:'La red social de la ciudad. Lo que decides se comenta aquí. Una queja que nadie atiende crece y llega a la prensa.',next:1}],
 3:[{sel:'[data-hs=terminal]',t:'La terminal de buses',d:'Aquí negocias con los operadores privados. Cada acuerdo suma buses que llevan gente al Metro: los verás en la avenida.',next:1}]
};
function tut(){const c=$('coach');if(!G||!(G.mini||G.tut)){c.classList.remove('on');return}const T=G.mini||G.tut,st=T.list[T.i];
 if(!st){if(T===G.mini){PROG.tut[T.key]=1;G.mini=null;save();setTimeout(tut,60);c.classList.remove('on');return}G.tut=null;PROG.tut[G.ep.id]=1;save();c.classList.remove('on');return}
 if(st.m&&G.s.mes<st.m){c.classList.remove('on');return}
 if(LAYER().innerHTML&&!st.inL){c.classList.remove('on');return}
 {const m_=st.sel.match(/data-hs=(\w+)/);if(m_&&viewOf(m_[1])&&viewOf(m_[1])!==VIEW){setView(viewOf(m_[1]),1);setTimeout(tut,60);return}if(m_&&window.BQ3D&&BQ3D.focus(m_[1],tut)){c.classList.remove('on');return}if(st.sel==='.ist'&&!document.querySelector('.ist')){}}
 const el=document.querySelector(st.sel);if(!el){c.classList.remove('on');return}
 const r=el.getBoundingClientRect(),sr=stage.getBoundingClientRect(),x=(r.left-sr.left)/K,y=(r.top-sr.top)/K,w=r.width/K,h=r.height/K,pd=6;
 c.classList.add('on');Object.assign($('spot').style,{left:x-pd+'px',top:y-pd+'px',width:w+pd*2+'px',height:h+pd*2+'px'});
 const b=$('cbubble');b.innerHTML=`<div class="stepn">Paso ${T.i+1} de ${T.list.length}</div><b>${st.t}</b>${st.d}<div class="row"><button class="skip" data-tskip>Saltar tutorial</button>${st.next?'<button class="btn" data-tnext style="min-height:38px;font-size:14px;padding:0 16px">Entendido</button>':''}</div>`;
 const bx=Math.max(16,Math.min(1440-366,x+(w>700?w/2-175:0))),below=y+h+210<900;Object.assign(b.style,{left:bx+'px',top:(below?y+h+16:Math.max(16,y-200))+'px'})}
function tutAdvance(){const T=G.mini||G.tut;if(!T)return;const st=T.list[T.i];T.i++;if(st&&st.close&&LAYER().innerHTML&&!LAYER().querySelector('.closing'))closeLayer();setTimeout(tut,320)}
function tutDone(k){if(G&&(G.mini||G.tut)){const T=G.mini||G.tut,st=T.list[T.i];if(st&&st.wait===k)tutAdvance()}}

const DILTUT=[{sel:'#layer .cards',inL:1,t:'Una decisión difícil',d:'Cada carta dice lo que ganas (verde) y lo que pierdes (rojo). Toca la que prefieras.',wait:'dil-pick'},
 {sel:'#layer [data-confirm]',inL:1,t:'Confirma tu decisión',d:'Cuando estés seguro, confírmala. No hay vuelta atrás.',wait:'dil-confirm'}];
function dilTut(){if(G&&!PROG.tut.dil&&!G.mini){G.mini={key:'dil',i:0,list:DILTUT};setTimeout(tut,700)}}
