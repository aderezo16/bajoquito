// ===================== MODEL =====================
const P={base:213,tar0:.45,elast:-.3,frec:{4:1.06,5:1,6:.95,7:.9},wearF:{4:1.2,5:1,6:.9,7:.85},satF:{4:5,5:0,6:-5,7:-10},mant:{r:.6,n:1.2,f:1.8},mantEff:{r:1,n:3,f:4.5},wear:3,deuda:5.5,transf:9,dias:27,rep:6,ap:2,
 // fixed monthly costs (USD M), supuestos del juego
 fx:{sal:1.6,ene:1.1,seg:.55,lim:.4,agua:.15,ins:.35,sis:.25,adm:.2},
 salF:{4:1.12,5:1,6:.94,7:.88},eneF:{4:1.35,5:1,6:.8,7:.65},
 lvF:{seg:{r:.7,n:1,f:1.3},lim:{r:.7,n:1,f:1.25},ene:{a:.88,n:1}},
 lvSat:{seg:{r:-3,n:0,f:2},lim:{r:-4,n:0,f:2},ene:{a:-2,n:0}},
 lvDem:{seg:{r:-.025,n:0,f:.01},lim:{r:-.015,n:0,f:.005},ene:{a:-.01,n:0}}};
const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const SHARE=[25,9,11,8,14,9,16,8,10,12,7,12,17.5,6,22],STT=SHARE.reduce((a,b)=>a+b,0);
const STN=['Quitumbe','Morán Valverde','Solanda','El Calzado','El Recreo','La Magdalena','San Francisco','La Alameda','El Ejido','Universidad Central','La Pradera','La Carolina','Iñaquito','Jipijapa','El Labrador'];
const ZONE=i=>i<=5?'sur':i<=8?'centro':'norte';
const cl=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const locVal=i=>.015+SHARE[i]/STT*.25;
// advertising: one contract per station
const ADS={pan:{n:'Paneles en el andén',k:.6,setup:0,d:'Afiches fijos en paredes y pasillos. Barato y discreto.'},pdi:{n:'Pantallas digitales',k:1.15,setup:.12,d:'Pantallas con anuncios en movimiento. Hay que instalarlas: USD 120 mil.'},nam:{n:'Nombre patrocinado',k:2.4,setup:0,d:'Una marca se suma al nombre de la estación. Rinde mucho, pero a la gente no le gusta.',big:1}};
const ADK=['pan','pdi','nam'];
const adVal=(i,t)=>locVal(i)*ADS[t].k;
const adOk=(i,t)=>!ADS[t].big||SHARE[i]>=14;
function fixedLines(s){const f=s.fx,lv=s.lv;return [
 ['sal','Salarios del personal',f.sal*P.salF[s.frec],'users','Conductores, técnicos, atención y administración. Sube con la frecuencia.'],
 ['ene','Energía eléctrica',f.ene*P.eneF[s.frec]*P.lvF.ene[lv.ene],'bolt','Mover trenes y mantener encendidas 15 estaciones.'],
 ['seg','Seguridad',f.seg*P.lvF.seg[lv.seg],'shield','Guardias y monitoreo en estaciones y trenes.'],
 ['lim','Limpieza',f.lim*P.lvF.lim[lv.lim],'broom','Andenes, baños, trenes y pasillos.'],
 ['ins','Seguros',f.ins,'umbrella','Trenes, estaciones y responsabilidad civil.'],
 ['sis','Sistemas y recaudo',f.sis,'cpu','Torniquetes, tarjetas, señalización y datos.'],
 ['adm','Administración',f.adm,'id','Oficinas, legal, auditoría y contratación.'],
 ['agua','Agua y servicios básicos',f.agua,'drop','Agua, alcantarillado e internet.']]}
const costOpOf=s=>fixedLines(s).reduce((a,x)=>a+x[2],0);
function newState(ov){const s=Object.assign({mes:1,caja:12,pax:213,salud:85,sat:85,apr:55,cap:50,rep:55,integ:40,integPend:0,integCost:0,tarifa:.45,tarEf:.85,demBonus:1,riskBonus:0,tarPend:null,transf:9,otros:.15,fx:Object.assign({},P.fx),lv:{seg:'n',lim:'n',ene:'n'},limR:0,frec:5,mant:'n',mantHist:['n','n','n'],compra:null,emerg:null,contra:null,fallaGrave:-9,graves:0,log:[],hist:[],sol:[],fin:null,compraEsperas:[],compraFirst:null,meses:24,pre:false,tags:['tec','pol','bus'],ap:P.ap,eq:Array(15).fill(1),eqSince:Array(15).fill(0),loc:Array(15).fill(0),stOn:false,acts:[],virales:0,banc:{sur:55,emp:50,opo:30},trust:{sur:45,nor:40,val:35},cri:[],criHist:{},forced:null,recorteAt:0},ov||{});if(s.fxAdd){for(const k in s.fxAdd)s.fx[k]+=s.fxAdd[k];delete s.fxAdd}return s}
const mesName=m=>MES[(m-1)%12];
const SIMPLE=true;
function fel(s){return Math.round((s.apr+s.sat)/2)}
if(SIMPLE){P.mantEff.r=0}
function capSync(s,c0){const d=s.cap-c0;s.apr=cl(s.apr+d*.5);s.cap=fel(s)}
// transfer request: amount index (0:+1,0 1:+1,5 2:+2,0), reason match
const TRANSF={amt:[1,1.5,2],off:[.12,0,-.15],cap:[10,12,14],apr:[-2,-3,-5]};
// ---- Concejo: bancadas ----
const BANC={sur:{n:'Bancada del Sur',sh:'Sur',seats:7,col:'#3DBE8B',base:55,want:'Escaleras funcionando en las estaciones del sur',ok:s=>[0,1,2,3,4,5].every(i=>s.eq[i])},emp:{n:'Bancada Ciudad Productiva',sh:'Productiva',seats:7,col:'#3D8BFF',base:50,want:'Que el Metro no tenga números rojos',ok:s=>s.caja>=0},opo:{n:'Bancada de Oposición',sh:'Oposición',seats:7,col:'#E5484D',base:30,want:'Ninguna falla grave en los últimos 3 meses',ok:s=>s.mes-s.fallaGrave>3}};
const BKEYS=['sur','emp','opo'];
const ISSUE={t50:{sur:-.22,emp:.15,opo:-.1},t60:{sur:-.32,emp:.08,opo:-.18}};
function seatP(s,a,b){return cl(s.banc[b]/100+ISSUE[a][b]+(s.apr-50)/220+(s.cap-40)/300-(s.pre&&(s.mes>12||s.preAll)?.22:0),.02,.97)}
function voteP(s,a){let dp=[1];for(const b of BKEYS){const p=seatP(s,a,b);for(let k=0;k<BANC[b].seats;k++){const nd=Array(dp.length+1).fill(0);dp.forEach((v,i)=>{nd[i]+=v*(1-p);nd[i+1]+=v*p});dp=nd}}return dp.slice(11).reduce((a,b)=>a+b,0)}
function expYes(s,a){return BKEYS.reduce((t,b)=>t+BANC[b].seats*seatP(s,a,b),0)}
// ---- mesa con buses ----
const OPS=[{k:'sur',n:'Cooperativas del sur',want:'Una compensación justa por los pasajeros que dejan de llevar',w:[.17,.02,.04]},{k:'nor',n:'Operadores del norte',want:'Una tarjeta única que les asegure su parte del cobro',w:[.05,.24,.04]},{k:'val',n:'Buses de los valles',want:'Más tiempo para reorganizar sus rutas',w:[.07,.04,.22]}];
const COMP=[.15,.3,.45],COMPN=['Baja','Media','Alta'];
function opP(s,o,off){return cl(s.trust[o.k]/100+o.w[0]*off.comp+o.w[1]*off.card+o.w[2]*off.plazo-.12+(s.cap-40)/250,.03,.95)}
// ---- crisis con plazo ----
const CRI={
 apagon:{t:'Apagón en el sur',who:'op',zone:'sur',dur:1,d:'Una falla de la red eléctrica deja sin luz a tres estaciones del sur por las noches. La empresa eléctrica no da fecha.',sp:(s,mo,r)=>s.stOn&&r()<.07,
  ops:[{t:'Alquilar generadores',c:['USD 0,4 M','1 ficha'],ap:1,res:1,f:s=>{s.caja-=.4}},{t:'Esperar a la empresa eléctrica',c:['Sin costo','Riesgo: el sur a oscuras'],res:0}],pen:s=>{s.sat-=6;s.apr-=3;s.banc.sur-=8},penT:'Tres estaciones del sur pasaron noches a oscuras.'},
 recorte:{t:'El Municipio recorta el subsidio',who:'alc',dur:2,d:'Por la caída de ingresos de la ciudad, el Alcalde anuncia un recorte de USD 1,0 M al mes al subsidio del Metro. Hay dos meses para negociar.',sp:(s,mo,r,m)=>s.tags.includes('pol')&&(s.recorteAt===m||r()<.025),
  ops:[{t:'Negociar con el Alcalde',c:['1 ficha','−8 capital'],ap:1,res:1,f:(s,r)=>{s.cap-=8;if(r()<.35+s.cap/200)s.log.unshift({m:s.mes,t:'El Alcalde retiró el recorte',d:'La negociación funcionó: el subsidio se mantiene.',tone:'good'});else{s.transf-=.5;s.log.unshift({m:s.mes,t:'El recorte quedó a la mitad',d:'El subsidio baja USD 0,5 M al mes en lugar de 1,0.',tone:'mix'})}}},{t:'Aceptar el recorte',c:['−USD 1,0 M al mes'],res:1,f:s=>{s.transf-=1}}],pen:s=>{s.transf-=1},penT:'Nadie negoció: el subsidio bajó USD 1,0 M al mes.'},
 paro:{t:'Los técnicos amenazan con paro',who:'rosa',dur:2,d:'El sindicato de técnicos pide un aumento. Si no hay respuesta en dos meses, paralizan el mantenimiento y parte de la operación.',sp:(s,mo,r,m)=>m>2&&r()<.035,
  ops:[{t:'Negociar un aumento',c:['1 ficha','+USD 0,12 M al mes'],ap:1,res:1,f:s=>{s.fx.sal+=.12}},{t:'No ceder',c:['Sin costo','Riesgo de paro'],res:0}],pen:(s,x)=>{x.mult*=.75;s.apr-=5;s.salud-=4},penT:'Paro de técnicos: menos trenes y mantenimiento detenido.'},
 lluvia:{t:'Filtraciones por las lluvias',who:'rosa',dur:2,d:'El agua se filtra en el túnel cerca de El Recreo. Si no se repara, daña equipos y frena trenes.',sp:(s,mo,r)=>[3,4,10,11].includes(mo)&&s.tags.includes('tec')&&r()<.3,
  ops:[{t:'Reparar ya',c:['USD 0,25 M','1 ficha'],ap:1,res:1,f:s=>{s.caja-=.25}},{t:'Esperar a que pasen las lluvias',c:['Sin costo','Riesgo de daños'],res:0}],pen:s=>{s.salud-=6;s.riskBonus+=.12},penT:'Las filtraciones dañaron equipos del túnel.'},
 auditoria:{t:'La Contraloría pide información',who:'alc',dur:2,d:'Un examen especial pide todos los contratos del último año. Si no se responde a tiempo, hay sanción.',sp:(s,mo,r)=>s.tags.includes('pol')&&r()<.035,
  ops:[{t:'Asignar un equipo',c:['1 ficha'],ap:1,res:1,f:s=>{s.banc.opo+=4}},{t:'Responder después',c:['Sin costo','Riesgo de sanción'],res:0}],pen:s=>{s.cap-=10;s.banc.opo-=6},penT:'La Contraloría sancionó la demora.'},
 clases:{t:'Vuelven las clases',who:'op',dur:1,d:'En septiembre vuelven los estudiantes y los andenes se llenan. Con trenes tan espaciados no van a caber.',sp:(s,mo)=>mo===9&&s.frec>=6&&s.stOn,
  ops:[{t:'Volver a trenes cada 5 minutos',c:['Más sueldos y luz'],res:1,f:s=>{s.frec=5}},{t:'Mantener la frecuencia',c:['Andenes llenos'],res:0}],pen:s=>{s.sat-=6;s.apr-=3},penT:'Andenes desbordados en el regreso a clases.'}};
const CKEYS=Object.keys(CRI);
function resolveCri(s,k,j,rnd=Math.random){const c0=s.cap,r=resolveCri0(s,k,j,rnd);if(SIMPLE)capSync(s,c0);return r}
function resolveCri0(s,k,j,rnd=Math.random){const c=s.cri.find(x=>x.k===k),o=CRI[k].ops[j];if(!c||(o.ap&&s.ap<=0))return false;if(o.ap)s.ap--;if(o.f)o.f(s,rnd);if(o.res){s.cri=s.cri.filter(x=>x!==c);s.cap+=3;s.log.unshift({m:s.mes,t:'Atendiste: '+CRI[k].t.toLowerCase(),d:o.t+'.',tone:'good'})}else c.wait=1;s.acts.push({m:s.mes,a:'cri',arg:k});return true}
function probs(s){const pre=s.pre&&s.mes>12?.33:1;return{t50:voteP(s,'t50'),t60:voteP(s,'t60'),transf:cl(.25+(s.cap-30)/80+(s.apr-50)/150,0,.95),integ:cl(.35+(s.cap-30)/80,0,.95)}}
function pTransf(s,arg){const a=arg||{};const k=a.amt==null?1:a.amt;return cl(probs(s).transf+TRANSF.off[k]+(a.why==null?0:a.match?.06:-.06),0,.95)}
function canAct(s,a,allowed,arg){if(s.ap<=0)return false;if(allowed&&!allowed.includes(a))return false;
 switch(a){case'compra':return !s.compra;case'emerg':return !s.emerg&&s.mes-s.fallaGrave<=2;case't50':return s.tarifa<.5&&!s.tarPend;case't60':return s.tarifa<.6&&!s.tarPend;case'transf':return true;case'integ':return s.integ+s.integPend<100;case'loc':{const i=typeof arg==='object'?arg.i:arg,t=typeof arg==='object'?arg.t:'pan';return s.loc[i]===0&&adOk(i,t)}case'campana':return true;case'reunion':return true;case'rendicion':return true}return false}
const EVENTOS=[
 {g:'tec',w:'rosa',t:'Lluvias fuertes inundan la estación La Magdalena',d:'El drenaje de la ciudad no depende del Metro. Limpiar y reparar cuesta USD 0,3 M.',st:5,f:s=>{s.salud-=3;s.caja-=.3}},
 {g:'bus',w:'mov',t:'Paro de transportistas de buses',d:'Los operadores privados paralizan por compensaciones. Más gente usa el Metro este mes, pero la relación con los alimentadores se tensa.',f:(s,x)=>{x.mult*=1.1;s.integ-=5},tone:'mix'},
 {g:'pol',w:'pren',t:'Reportaje: «¿Cuánto nos cuesta el Metro cada día?»',d:'La prensa pone el subsidio en portada. Quien no usa el Metro solo ve el costo.',f:s=>{s.apr-=s.transf>P.transf?8:5}},
 {g:'pol',w:'conc',t:'Una concejala propone eliminar el subsidio al Metro',d:'El debate se instala en el Concejo y te piden comparecer.',f:s=>{s.cap-=4}},
 {g:'pol',w:'alc',t:'Auditoría de rutina de la Contraloría',d:'Tu equipo dedica semanas a responder requerimientos en lugar de gestionar.',f:s=>{s.cap-=3}},
 {g:'tec',w:'gaby',t:'Se reajusta el salario básico',d:'Por ley, los sueldos del personal suben. Son USD 0,15 M más cada mes, para siempre.',f:s=>{s.fx.sal+=.15}},
 {g:'tec',w:'gaby',t:'Sube la tarifa eléctrica para grandes consumidores',d:'La empresa eléctrica reajusta su tarifa. El Metro paga USD 0,08 M más cada mes.',f:s=>{s.fx.ene+=.08}},
 {g:'pol',w:'pren',t:'Récord de pasajeros',d:'La ciudad celebra el número en redes.',c:s=>s.pax>218,f:s=>{s.apr+=3},tone:'good'},
 {g:'tec',w:'alc',t:'Una delegación internacional visita el Metro',d:'La cooperación internacional elogia la obra; el Alcalde gana una foto.',f:s=>{s.cap+=4},tone:'good'}
];
// immediate action: returns {ok}
function act(s,a,rnd,arg){const c0=s.cap,r=act0(s,a,rnd,arg);if(SIMPLE)capSync(s,c0);return r}
function act0(s,a,rnd,arg){const p=probs(s),m=s.mes,L=(t,d,tone)=>s.log.unshift({m,t,d,tone});s.ap--;s.acts.push({m,a,arg});
 const req=(tipo,pr,costo)=>{s.cap-=costo;const ok=rnd()<pr;s.sol.push({tipo,mes:m,ok,pr});return ok};
 if(a==='compra'){const d=4+Math.floor(rnd()*5);s.compra={inicio:m,llega:m+d,adj:m+2,desierto:SIMPLE?false:rnd()<.15};if(s.compraFirst==null)s.compraFirst=m;L('Arrancó el proceso de compra de repuestos','Pliegos, publicación, adjudicación y entrega. Llegada estimada: entre 4 y 8 meses.','');return{ok:true}}
 if(a==='emerg'){s.caja-=3.5;s.emerg={llega:m+1+Math.floor(rnd()*2)};if(rnd()<.5)s.contra=m+4+Math.floor(rnd()*3);L('Compra de emergencia de repuestos','Más rápida, pero cuesta USD 3,5 M y la Contraloría puede revisarla.','');return{ok:true}}
 if(a==='t50'||a==='t60'){const v=a==='t50'?.5:.6,seats=[];let yes=0;for(const b of BKEYS){const p=seatP(s,a,b);for(let k=0;k<BANC[b].seats;k++){const y=rnd()<p;seats.push([b,y]);if(y)yes++}}const ok=yes>=11;s.cap-=6;s.sol.push({tipo:'Alza de tarifa a '+usd(v),mes:m,ok,pr:p[a]});if(ok){s.tarPend={v,mes:m+2};s.apr-=6;s.banc.sur-=10;s.banc.opo-=4;L('El Concejo aprobó la nueva tarifa',yes+' votos a favor. Regirá en 2 meses. La noticia no cae bien en la ciudad.','mix')}else L('El Concejo negó el alza de tarifa','Solo '+yes+' votos a favor de 11 necesarios.'+(s.pre&&m>12?' En año preelectoral nadie quiere votar un alza.':''),'bad');return{ok,v,yes,seats}}
 if(a==='transf'){const g=arg||{},k=g.amt==null?1:g.amt,ok=req('Más subsidio municipal (+'+money(TRANSF.amt[k])+')',pTransf(s,g),TRANSF.cap[k]);if(ok){s.transf+=TRANSF.amt[k];s.apr+=TRANSF.apr[k];s.banc.emp-=6;L('El Municipio aumentó el subsidio','+'+money(TRANSF.amt[k])+' al mes. Ese dinero sale de otras obras de la ciudad.','mix')}else L('El Municipio negó más subsidio',g.why!=null&&!g.match?'El Alcalde no vio justificado el motivo del pedido.':'El presupuesto municipal ya tiene otras prioridades.','bad');return{ok,amt:TRANSF.amt[k]}}
 if(a==='integ'){const off=arg||{comp:1,card:0,plazo:0};s.cap-=6;const res=OPS.map(o=>rnd()<opP(s,o,off)),n=res.filter(Boolean).length,ok=n>0;OPS.forEach((o,k)=>{s.trust[o.k]=cl(s.trust[o.k]+(res[k]?5:-8))});s.sol.push({tipo:'Integración con buses',mes:m,ok,pr:OPS.reduce((a,o)=>a+opP(s,o,off),0)/3});
  if(ok){s.integPend+=n*(6+(off.card?2:0));s.integCost+=COMP[off.comp]*n/3;if(off.card)s.caja-=.5;L('Acuerdo con '+n+' de 3 operadores de buses','Rutas y tarifas se integran en los próximos meses. Compensaciones: '+kusd(COMP[off.comp]*n/3)+' al mes.','good')}else L('Ningún operador aceptó la oferta','Bajó la confianza de los operadores. Hay que mejorar la oferta.','bad');return{ok,res,n}}
 if(a==='reunion'&&arg==='all'){let okn=0;for(const b of BKEYS){const o_=BANC[b].ok(s);if(o_)okn++;s.banc[b]=cl(s.banc[b]+(o_?14:7))}s.cap+=1;L('Reunión con los concejales',okn===3?'Llegaste con lo que todos piden: salen muy conformes.':okn?'Algunos salen conformes; otros esperan ver lo que piden.':'Escucharon, pero esperan ver lo que piden.','good');return{ok:true}}
 if(a==='reunion'){const b=arg,ok_=BANC[b].ok(s);s.banc[b]=cl(s.banc[b]+(ok_?22:12));s.cap+=1;L('Reunión con la '+BANC[b].n,ok_?'Llegaste con lo que piden: salen muy conformes.':'Escucharon, pero esperan ver lo que piden.','good');return{ok:true}}
 if(a==='rendicion'){s.caja-=.1;s.cap+=6;s.apr+=2;s.banc.opo=cl(s.banc.opo+6);s.banc.emp=cl(s.banc.emp+3);L('Rendición de cuentas pública','Explicaste las cifras del Metro ante la ciudad y el Concejo.','good');return{ok:true}}
 if(a==='loc'){const i=typeof arg==='object'?arg.i:arg,t=typeof arg==='object'?arg.t:'pan';s.loc[i]={t,until:m+3};s.caja-=ADS[t].setup;L('Licitación de '+ADS[t].n.toLowerCase()+' en '+STN[i],'Es un proceso de contratación: los ingresos empiezan en 3 meses.','');return{ok:true}}
 if(a==='campana'){s.caja-=.3;s.apr+=4;s.cap+=3;L('Campaña de comunicación','Explicas a la ciudad qué hace el Metro y cuánto cuesta.','');return{ok:true}}
}
function repair(s,i){s.eq[i]=1;s.eqSince[i]=0;s.caja-=.15;s.log.unshift({m:s.mes,t:'Reparaste las escaleras de '+STN[i],d:'USD 0,15 M de fondos propios.',tone:''})}
function step(s,rnd=Math.random,quiet=false){
 const m=s.mes,L=(t,d,tone,st,w,k)=>{if(!quiet)s.log.unshift({m,t,d,tone,st,w,k})},x={mult:1,falla:null},caja0=s.caja,cap0=s.cap;
 for(const c of s.cri.slice())if(c.dl===m){const C=CRI[c.k];C.pen(s,x);s.cri=s.cri.filter(z=>z!==c);L('Venció el plazo: '+C.t.toLowerCase(),C.penT,'bad',null,C.who,'crip')}
 if(s.tarPend&&s.tarPend.mes<=m){s.tarifa=s.tarPend.v;s.tarPend=null;s.apr-=4;L('Rige la nueva tarifa','Los pasajeros pagan más desde hoy.','mix',null,'conc','tarifa')}
 if(s.integPend>0){const k=Math.min(2.5,s.integPend);s.integ+=k;s.integPend-=k}
 if(s.compra){
  if(s.compra.adj===m){if(s.compra.desierto){L('El proceso de compra quedó desierto','Ningún proveedor cumplió los requisitos. Hay que empezar de nuevo.','bad',null,'rosa','desierto');s.compra=null}else{s.caja-=2.5;L('Se adjudicó la compra de repuestos','Se pagaron USD 2,5 M. Ahora toca esperar la fabricación y entrega.','',null,'rosa','adj')}}
  if(s.compra&&s.compra.llega===m){s.rep+=45;s.compraEsperas.push(m-s.compra.inicio);L('¡Llegaron los repuestos!','La bodega se llena, '+(m-s.compra.inicio)+' meses después de iniciar el proceso.','good',null,'rosa','llego');s.compra=null}}
 if(s.emerg&&s.emerg.llega===m){s.rep+=40;s.emerg=null;L('Llegaron los repuestos de emergencia','La bodega respira.','good',null,'rosa','llego')}
 if(s.contra===m){s.cap-=10;s.contra=null;L('La Contraloría observó una compra sin licitación','Se cuestiona si la urgencia estaba justificada.','bad',null,'alc','contra')}
 for(let i=0;i<15;i++){const l=s.loc[i];if(l&&l.until===m){s.loc[i]={t:l.t,on:1};s.otros+=adVal(i,l.t);if(l.t==='nam')s.apr-=3;L('Ya hay '+ADS[l.t].n.toLowerCase()+' en '+STN[i],'+'+kusd(adVal(i,l.t))+' al mes.'+(l.t==='nam'?' En redes se burlan del nuevo nombre.':''),'good',i,'op','ads')}}
 s.mantHist.push(s.mant);
 const lag=s.mantHist[s.mantHist.length-(SIMPLE?2:4)]||'n',fRep=s.rep<20?.4:s.rep<40?.8:1;
 s.salud=cl(s.salud+P.mantEff[lag]*fRep-P.wear*P.wearF[s.frec]);
 s.rep=cl(s.rep-P.rep-(s.salud<50?2:0));
 const pf=.03+Math.max(0,80-s.salud)*.012+s.riskBonus;s.riskBonus=0;
 const ff=s.forced&&s.forced[m];
 if(ff||rnd()<pf){const g=ff?ff.g:rnd()<(s.salud<50?.5:.25),st=ff?ff.st:Math.floor(rnd()*15);x.falla={g,st};
  if(g){x.mult*=.85;s.sat-=10;s.apr-=8;s.cap-=8;s.salud-=2;s.fallaGrave=m;s.graves++;s.banc.opo-=8;L('Falla grave: servicio suspendido por horas','Un tren quedó detenido cerca de '+STN[st]+'. '+(s.rep<20?'No había repuestos para repararlo rápido.':'El equipo técnico lo resolvió, pero la ciudad lo notó.'),'bad',st,'rosa','grave')}
  else{s.sat-=4;s.apr-=2;s.cap-=2;L('Falla menor en la operación','Retrasos de 20 minutos cerca de '+STN[st]+'.','bad',st,'rosa','menor')}}
 // escalators: break, and complaints that come back
 for(let i=0;i<15;i++)if(!s.eq[i]&&s.eqSince[i]&&m-s.eqSince[i]===2){s.apr-=2;s.virales++;s.banc.sur-=4;L('Se volvió viral la queja por las escaleras de '+STN[i],'Dos meses sin escaleras. La prensa ya lo publica.','bad',i,'pren','viral')}
 if(s.stOn&&rnd()<.3){const i=Math.floor(rnd()*15);if(s.eq[i]){s.eq[i]=0;s.eqSince[i]=m;L('Se dañaron las escaleras de '+STN[i],'Puedes repararlas desde la estación.','bad',i,'op','esc')}}
 const broken=s.eq.filter(e=>!e).length;s.sat-=broken*.8;
 // fixed-cost levels with consequences
 s.limR=s.lv.lim==='r'?s.limR+1:0;
 if(s.limR>0&&s.limR%3===0){s.apr-=2;L('«Estaciones sucias»: la queja llega a la prensa','Tres meses con limpieza reducida. Los usuarios publican fotos.','bad',null,'pren','sucio')}
 const pRobo=s.lv.seg==='r'?.28:s.lv.seg==='f'?0:.05;
 if(s.stOn&&rnd()<pRobo){const i=[6,7,12,0][Math.floor(rnd()*4)];s.sat-=3;s.apr-=2;L('Robos en hora pico en '+STN[i],'Varios usuarios denuncian robos en el andén.','bad',i,'seg','robo')}
 if(rnd()<.4){const pool=EVENTOS.filter(e=>s.tags.includes(e.g)&&(!e.c||e.c(s)));if(pool.length){const e=pool[Math.floor(rnd()*pool.length)];e.f(s,x);L(e.t,e.d,e.tone||'bad',e.st,e.w,'ev')}}
 const moy=(m-1)%12+1,temp=moy===7||moy===8?.94:moy===9?1.04:moy===2?.97:1;
 const fConf=(.7+.3*s.salud/100)/(.7+.3*.85);
 const D=P.base*Math.pow(s.tarifa/P.tar0,P.elast)*P.frec[s.frec]*(1+.8*(s.integ-40)/100)*fConf*temp*s.demBonus*(1+P.lvDem.seg[s.lv.seg]+P.lvDem.lim[s.lv.lim]+P.lvDem.ene[s.lv.ene]);
 s.pax+=.3*(D-s.pax);
 const paxEff=s.pax*x.mult,viajes=paxEff*1000*P.dias;
 const fxl=fixedLines(s),ingT=viajes*s.tarifa*s.tarEf/1e6,costOp=fxl.reduce((a,b)=>a+b[2],0),costM=P.mant[s.mant];
 const costos=costOp+costM+P.deuda+s.integCost,otrosMov=s.caja-caja0;
 s.caja+=ingT+s.otros+s.transf-costos;
 const lvS=P.lvSat.seg[s.lv.seg]+P.lvSat.lim[s.lv.lim]+P.lvSat.ene[s.lv.ene];
 s.sat=cl(s.sat+.25*(60+.3*s.salud+P.satF[s.frec]+lvS-s.sat));
 s.apr=cl(s.apr+.2*(.5*s.sat+18+(s.pax-213)/6-(s.transf-P.transf)*2-(s.tarifa>P.tar0?4:0)-s.apr));
 if(SIMPLE)capSync(s,cap0);else s.cap=cl(s.cap+.15*(s.apr-50));
 s.integ=cl(s.integ);s.sat=cl(s.sat);s.apr=cl(s.apr);s.cap=cl(s.cap);s.salud=cl(s.salud);
 s.hist.push({m,pax:paxEff,caja:s.caja,salud:s.salud,mant:s.mant,lag,frec:s.frec,falla:x.falla,ingT,otros:s.otros,transf:s.transf,costOp,fxl:fxl.map(l=>[l[0],l[1],l[2]]),costM,deuda:P.deuda,integCost:s.integCost,otrosMov,viajes,costos,temp,apr:s.apr,cap:s.cap,sat:s.sat,lv:Object.assign({},s.lv)});
 s.lastFalla=x.falla;
 for(const b of BKEYS){s.banc[b]=cl(s.banc[b]+.08*(BANC[b].base+(s.apr-55)*.6-s.banc[b])-(b==='sur'?2.5*[0,1,2,3,4,5].filter(i=>!s.eq[i]).length:0)-(b==='emp'&&s.caja<0?3:0))}
 if(s.cri.length<2&&m<s.meses){const mo=m%12+1;for(const k of CKEYS){if(s.cri.find(c=>c.k===k)||m+1-(s.criHist[k]||-99)<8)continue;if(CRI[k].sp(s,mo,rnd,m+1)){s.cri.push({k,m0:m+1,dl:m+CRI[k].dur});s.criHist[k]=m+1;L('Crisis: '+CRI[k].t.toLowerCase(),CRI[k].d,'bad',null,CRI[k].who,'cri');break}}}
 if(SIMPLE)s.cap=fel(s);
 if(SIMPLE?fel(s)<20:s.cap<=0)s.fin='cap';else if(s.caja<-5)s.fin='caja';else if(m>=s.meses)s.fin='mandato';
 s.mes++;s.ap=P.ap;return s;
}
// deterministic projection (no failures, no random events)
function project(s,mods,n){const c=JSON.parse(JSON.stringify(s));Object.assign(c,mods||{});c.log=[];c.hist=[];const out=[];for(let k=0;k<n;k++){step(c,()=>.97,true);out.push({salud:c.salud,caja:c.caja,pax:c.pax,rep:c.rep,integ:c.integ,apr:c.apr,cap:c.cap,sat:c.sat})}c.out=out;return c}
