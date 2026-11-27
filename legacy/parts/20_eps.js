// ===================== EPISODES =====================
const EPS_FULL=[
 {id:1,name:'Primer día',months:3,blurb:'Tres meses para entender por qué un recorte de hoy se paga mañana.',lessons:['mant','compra'],bld:['taller','bodega'],newB:[],acts:['compra','emerg'],init:{rep:44,caja:6,salud:88,tags:['tec'],mantHist:['n','r','r'],forced:{1:{g:false,st:4}}},need:0,script:{2:'ahorro',3:'salarios'},
  letter:'Recibe un Metro que funciona, pero con dos problemas heredados: el gerente anterior recortó el mantenimiento en los últimos dos meses y nadie compró repuestos. Ese recorte todavía no se nota, pero se va a notar. Tiene tres meses. Rosa, la jefa de mantenimiento, le mostrará cómo.',
  goals:[{t:'Iniciar la compra de repuestos en enero o febrero',st:s=>s.compraFirst!=null&&s.compraFirst<=2?'ok':s.mes>2?'bad':'pend',end:s=>s.compraFirst!=null&&s.compraFirst<=2,prog:s=>s.compraFirst!=null&&s.compraFirst<=2?1:0},
         {t:'Ninguna falla grave',st:s=>s.graves?'bad':'live',end:s=>s.graves===0,sub:s=>s.graves+' fallas graves',prog:s=>s.graves?0:1},
         {t:'Estado técnico de 82 o más al cerrar',st:s=>'live',end:s=>s.salud>=82,sub:s=>'Ahora: '+Math.round(s.salud),prog:s=>cl(s.salud/82,0,1)}]},
 {id:2,name:'Las cuentas',months:12,blurb:'Descubre quién paga el Metro y por qué la tarifa no alcanza.',lessons:['tarifa','deuda','pol'],bld:['taller','bodega','municipio','concejo','medios','st'],newB:['municipio','concejo','medios','st'],acts:['compra','emerg','t50','t60','transf','loc','campana','reunion','rendicion'],init:{caja:3,rep:50,tags:['tec','pol'],stOn:true,fxAdd:{ene:.25,sal:.15},recorteAt:6},need:1,script:{2:'estud'},
  letter:'Los costos subieron y la caja del Metro está casi vacía. Necesitamos que termine el año sin números rojos y sin perder el respaldo del Concejo. Subieron la luz y los sueldos. Desde hoy puede tratar con el Municipio, el Concejo, los medios y cada estación.',
  goals:[{t:'Terminar el año con caja positiva',st:s=>'live',end:s=>s.caja>=0,sub:s=>'Ahora: '+money(s.caja),prog:s=>cl(1+s.caja/5,0,1)},
         {t:'Capital político de 35 o más al cerrar',st:s=>'live',end:s=>s.cap>=35,sub:s=>'Ahora: '+Math.round(s.cap),prog:s=>cl(s.cap/35,0,1)},
         {t:'Estado técnico de 75 o más al cerrar',st:s=>'live',end:s=>s.salud>=75,sub:s=>'Ahora: '+Math.round(s.salud),prog:s=>cl(s.salud/75,0,1)}]},
 {id:3,name:'Ciudad conectada',months:12,blurb:'Negocia con los buses para que más gente llegue al Metro.',lessons:['buses','pol','tarifa'],bld:['taller','bodega','municipio','concejo','medios','terminal','st'],newB:['terminal'],acts:null,init:{caja:8,stOn:true},need:3,script:{2:'buses'},
  letter:'El Metro tiene capacidad para mucha más gente, pero los barrios no llegan a él. Queremos más quiteños en el Metro antes de fin de año. Desde hoy puede negociar en la terminal de buses.',
  goals:[{t:'Llegar a 235 mil pasajeros diarios',st:s=>'live',end:s=>s.pax>=235,sub:s=>'Ahora: '+Math.round(s.pax)+' mil',prog:s=>cl((s.pax-200)/35,0,1)},
         {t:'Integración con buses de 60 o más',st:s=>'live',end:s=>s.integ>=60,sub:s=>'Ahora: '+Math.round(s.integ),prog:s=>cl((s.integ-30)/30,0,1)},
         {t:'Terminar con caja positiva',st:s=>'live',end:s=>s.caja>=0,sub:s=>'Ahora: '+money(s.caja),prog:s=>cl(1+s.caja/5,0,1)}]},
 {id:4,name:'Año preelectoral',months:24,blurb:'Todo junto, con un Concejo que no quiere votar nada impopular.',lessons:['tarifa','deuda','mant','compra','buses','pol'],bld:['taller','bodega','municipio','concejo','medios','terminal','st'],newB:[],acts:null,init:{pre:true,stOn:true},need:5,script:{},
  letter:'Tiene dos años por delante. El segundo es preelectoral: no espere que el Concejo vote nada impopular. Queremos un Metro con más pasajeros, sin fallas graves y con las cuentas en orden.',
  goals:[{t:'Llegar a 265 mil pasajeros diarios',st:s=>'live',end:s=>s.pax>=265,sub:s=>'Ahora: '+Math.round(s.pax)+' mil',prog:s=>cl((s.pax-200)/65,0,1)},
         {t:'Máximo 2 fallas graves',st:s=>s.graves>2?'bad':'live',end:s=>s.graves<=2,sub:s=>s.graves+' fallas graves',prog:s=>cl(1-s.graves/3,0,1)},
         {t:'Terminar con caja positiva',st:s=>'live',end:s=>s.caja>=0,sub:s=>'Ahora: '+money(s.caja),prog:s=>cl(1+s.caja/5,0,1)}]}
];

const EPS_SIMPLE=[
 {id:1,name:'Primer día',months:2,blurb:'Un tutorial corto: cuidar los trenes y pedir repuestos a tiempo.',lessons:['mant','compra'],bld:['taller','bodega'],newB:[],acts:['compra','emerg'],init:{rep:44,caja:6,salud:88,tags:['tec'],mantHist:['n','r','r'],forced:{1:{g:false,st:4}}},need:0,script:{2:'ahorro'},
  letter:'Bienvenido al Metro de Quito. Recibe trenes que funcionan, pero el gerente anterior recortó el mantenimiento y nadie compró repuestos. En dos meses, Rosa, la jefa de mantenimiento, le mostrará cómo cuidar lo más importante: los trenes.',
  goals:[{t:'Pedir repuestos en enero o febrero',st:s=>s.compraFirst!=null&&s.compraFirst<=2?'ok':s.mes>2?'bad':'pend',end:s=>s.compraFirst!=null&&s.compraFirst<=2,prog:s=>s.compraFirst!=null&&s.compraFirst<=2?1:0},
         {t:'Ninguna falla grave',st:s=>s.graves?'bad':'live',end:s=>s.graves===0,sub:s=>s.graves+' fallas graves',prog:s=>s.graves?0:1},
         {t:'Trenes en 82 o más al cerrar',st:s=>'live',end:s=>s.salud>=82,sub:s=>'Ahora: '+Math.round(s.salud),prog:s=>cl(s.salud/82,0,1)}]},
 {id:2,name:'Las cuentas',months:4,blurb:'Quién paga el Metro, y por qué el pasaje no alcanza.',lessons:['tarifa','deuda','pol'],bld:['taller','bodega','municipio','concejo','medios','st'],newB:['municipio','concejo','medios','st'],acts:['compra','emerg','t50','t60','transf','loc','campana','reunion','rendicion'],init:{caja:1.2,rep:50,tags:['tec','pol'],stOn:true,fxAdd:{ene:.25,sal:.15},recorteAt:3},need:0,script:{2:'estud'},
  letter:'Subieron la luz y los sueldos, y la caja del Metro está casi vacía. Tiene cuatro meses para cerrar sin números rojos y con la ciudad contenta. Desde hoy puede hablar con el Alcalde, el Concejo, los medios y cada estación.',
  goals:[{t:'Cerrar con caja positiva',st:s=>'live',end:s=>s.caja>=0,sub:s=>'Ahora: '+money(s.caja),prog:s=>cl(1+s.caja/5,0,1)},
         {t:'Conseguir un ingreso nuevo: publicidad, apoyo del Alcalde o pasaje',st:s=>newInc(s)?'ok':'pend',end:s=>newInc(s),prog:s=>newInc(s)?1:0},
         {t:'Trenes en 80 o más',st:s=>'live',end:s=>s.salud>=80,sub:s=>'Ahora: '+Math.round(s.salud),prog:s=>cl(s.salud/80,0,1)}]},
 {id:3,name:'Ciudad conectada',months:4,blurb:'Que los buses lleven más gente al Metro.',lessons:['buses','pol','tarifa'],bld:['taller','bodega','municipio','concejo','medios','terminal','st'],newB:['terminal'],acts:null,init:{caja:6.5,stOn:true},need:2,script:{2:'buses'},
  letter:'El Metro tiene espacio para mucha más gente, pero los barrios no llegan a él. En cuatro meses queremos más quiteños viajando en Metro. Desde hoy puede negociar con los buses en la terminal.',
  goals:[{t:'Llegar a 218 mil pasajeros diarios',st:s=>'live',end:s=>s.pax>=218,sub:s=>'Ahora: '+Math.round(s.pax)+' mil',prog:s=>cl((s.pax-200)/18,0,1)},
         {t:'Buses conectados en 48 o más',st:s=>'live',end:s=>s.integ>=48,sub:s=>'Ahora: '+Math.round(s.integ),prog:s=>cl((s.integ-30)/18,0,1)},
         {t:'Cerrar con caja positiva',st:s=>'live',end:s=>s.caja>=0,sub:s=>'Ahora: '+money(s.caja),prog:s=>cl(1+s.caja/5,0,1)}]},
 {id:4,name:'Año de elecciones',months:4,blurb:'Todo junto, con un Concejo que no quiere votar nada impopular.',lessons:['tarifa','mant','compra','buses','pol'],bld:['taller','bodega','municipio','concejo','medios','terminal','st'],newB:[],acts:null,init:{pre:true,preAll:true,stOn:true,caja:3,apr:44,sat:68,eq:[1,1,0,1,1,1,1,0,1,1,1,1,1,1,1],eqSince:[0,0,1,0,0,0,0,1,0,0,0,0,0,0,0]},need:4,script:{},
  letter:'Se vienen elecciones, la ciudad está molesta y hay escaleras dañadas en Solanda y San Francisco. Nadie en el Concejo quiere votar algo impopular. En cuatro meses queremos una ciudad contenta, trenes sin fallas graves y cuentas en orden.',
  goals:[{t:'Felicidad de 62 o más',st:s=>'live',end:s=>fel(s)>=62,sub:s=>'Ahora: '+fel(s),prog:s=>cl(fel(s)/62,0,1)},
         {t:'Ninguna falla grave',st:s=>s.graves?'bad':'live',end:s=>s.graves===0,sub:s=>s.graves+' fallas graves',prog:s=>s.graves?0:1},
         {t:'Cerrar con caja positiva',st:s=>'live',end:s=>s.caja>=0,sub:s=>'Ahora: '+money(s.caja),prog:s=>cl(1+s.caja/5,0,1)}]}
];
const EPS=SIMPLE?EPS_SIMPLE:EPS_FULL;
function newInc(s){return s.loc.some(l=>l)||s.transf>P.transf+.01||s.tarifa>P.tar0||!!s.tarPend}
