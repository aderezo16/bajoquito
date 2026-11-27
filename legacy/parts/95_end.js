// ===================== END =====================
function endEp(){const s=G.s,e=G.ep;G.ended=true;const fired=s.fin!=='mandato',met=fired?0:e.goals.filter(g=>g.end(s)).length;
 if(!fired&&met>(PROG.stars[e.id]||0)){PROG.stars[e.id]=met;save()}fired?SFX.fail():SFX.win();
 const T=s.hist.reduce((a,h)=>({v:a.v+h.viajes,i:a.i+h.ingT,c:a.c+h.costos,d:a.d+h.deuda,t:a.t+h.transf}),{v:0,i:0,c:0,d:0,t:0}),rec=s.hist.filter(h=>h.mant==='r').map(h=>h.m),fall=s.hist.filter(h=>h.falla);
 const L={mant:['Recortar mantenimiento hoy produce fallas mañana',`${e.id===1?'Heredaste el recorte de tu antecesor: llegó a los trenes en febrero y marzo, y no podías hacer nada para evitarlo. Lo que tú decidas hoy lo heredará quien venga después. ':''}${rec.length?`Recortaste el mantenimiento ${rec.length} mes(es), desde ${mesName(rec[0])}.`:'Nunca recortaste el mantenimiento.'} ${fall.length?`Tuviste ${fall.length} falla(s), ${fall.filter(h=>h.falla.g).length} grave(s).`:'No tuviste fallas.'} El efecto del mantenimiento llega con tres meses de retraso.`],
  compra:['Comprar en el sector público toma meses',s.compraEsperas.length?`Tus repuestos tardaron ${s.compraEsperas.join(' y ')} meses en llegar desde que iniciaste el proceso.`:s.compraFirst?'Iniciaste una compra, pero no llegó durante el episodio. Así de largos son los procesos.':'Nunca iniciaste una compra de repuestos.'],
  tarifa:['La tarifa no cubre el costo',`Cada pasajero pagó en promedio ${usd(T.i*1e6/T.v)}, pero su viaje costó ${usd(T.c*1e6/T.v)} contando la deuda. El Municipio puso ${money(T.t)} de subsidio durante tu gestión.`],
  deuda:['La deuda ya estaba comprometida',`Pagaste ${money(T.d)} de deuda de construcción sin poder decidir nada sobre ella.`],
  buses:['Los pasajeros dependen de otros',`La integración con buses pasó de 40 a ${Math.round(s.integ)}. Cada punto depende de acuerdos con operadores privados y con la Secretaría de Movilidad.`],
  pol:['Gestión y voluntad política',s.sol.length?`Pediste ${s.sol.length} cosa(s) a otras instituciones y te aprobaron ${s.sol.filter(x=>x.ok).length}. No basta con tener la razón técnica.`:'No pediste nada a otras instituciones durante el episodio.']};
 const next=EPS.find(x=>x.id===e.id+1);
 show(`<div class="modal" style="width:900px;padding:38px 48px;max-height:860px;overflow:auto">
  <div style="font-size:13px;font-weight:700;color:var(--mute)">Episodio ${e.id} · ${e.name}</div>
  <h1 style="margin:6px 0 14px">${fired?(s.fin==='cap'?'Te pidieron la renuncia: perdiste el respaldo político':'Te pidieron la renuncia: la caja quedó en rojo'):met===3?'Encargo cumplido':met?`Cumpliste ${met} de 3 objetivos`:'No cumpliste los objetivos'}</h1>
  <div style="display:flex;gap:30px;align-items:center;margin-bottom:10px"><div class="stars">${[0,1,2].map(k=>star(60,k<met,.2+k*.25)).join('')}</div>
   <div style="display:flex;flex-direction:column;gap:6px">${e.goals.map(g=>{const ok=!fired&&g.end(s);return `<div style="display:flex;gap:8px;align-items:center;font-size:15px;font-weight:600">${ic(ok?'check':'x',19,ok?'#2F9E70':'#C9424A',2.6)}${g.t}</div>`}).join('')}</div></div>
  <div class="hd" style="font-weight:600;font-size:20px;margin:16px 0 4px">Lo que tu gestión enseña</div>
  ${e.lessons.map(k=>`<div style="border-left:3px solid var(--or);padding:4px 0 4px 14px;margin:12px 0;font-size:15px;line-height:1.5"><b style="display:block">${L[k][0]}</b>${L[k][1]}</div>`).join('')}
  <p style="font-size:14px;color:var(--mute)">En la realidad, el Metro mueve unos 213.000 viajes por día laborable y sus usuarios lo califican con 9,9 sobre 10, pero para ser sostenible necesitaría cerca de 400.000.</p>
  <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:18px"><button class="btnp" data-go="eps">Episodios</button><button class="btnp" data-restart>Repetir</button>${next&&unlocked(next)?`<button class="btn" data-ep="${next.id}">Siguiente: ${next.name}</button>`:''}</div>
 </div>`)}
