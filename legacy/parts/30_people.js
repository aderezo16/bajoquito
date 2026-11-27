// ===================== PEOPLE & DILEMMAS =====================
const PEOPLE={
 rosa:{n:'Ing. Rosa Andrade',r:'Jefa de mantenimiento',bg:'#2F9E70',skin:'#C88A68',hair:'#2B1E1A',hs:'bun',hat:'helmet',out:'#FF6B2C',acc:'vest'},
 gaby:{n:'Gabriela Ríos',r:'Directora financiera del Metro',bg:'#C98A2B',skin:'#E0AC8A',hair:'#4A2E1E',hs:'long',glasses:1,out:'#1B2340',acc:'collar'},
 alc:{n:'Marcelo Vinueza',r:'Jefe de despacho del Alcalde',bg:'#1F6FC5',skin:'#B97D5B',hair:'#1A1210',hs:'short',out:'#2B2F45',acc:'tie'},
 conc:{n:'Inés Mera',r:'Concejala metropolitana',bg:'#7D4AB0',skin:'#A86E4F',hair:'#1A1210',hs:'long',out:'#6B2E5F',acc:'collar'},
 prov:{n:'Ramiro Salazar',r:'Proveedor privado',bg:'#7A6A55',skin:'#D7A07C',hair:'#5A5A5A',hs:'short',glasses:1,mus:1,out:'#4A5568',acc:'collar'},
 pren:{n:'Paula Ortiz',r:'Periodista, diario El Andino',bg:'#B5523A',skin:'#E8B896',hair:'#7A3E1E',hs:'bob',glasses:1,out:'#2F3E5C',acc:'lanyard'},
 op:{n:'Fabián Chávez',r:'Gerente de la empresa operadora',bg:'#46566A',skin:'#C99273',hair:'#222',hs:'short',out:'#2F79E0',acc:'collar'},
 ciu:{n:'Carmen Tipán',r:'Vocera de un colectivo ciudadano',bg:'#B83A3F',skin:'#9C6748',hair:'#BDBDBD',hs:'bun',out:'#2F8F5B',acc:'shawl'},
 seg:{n:'Sgto. Luis Morales',r:'Jefe de seguridad del Metro',bg:'#2B2F36',skin:'#B07850',hair:'#1A1210',hs:'short',hat:'cap',out:'#1F2A44',acc:'badge'},
 mov:{n:'Lorena Guamán',r:'Secretaría de Movilidad',bg:'#2F79E0',skin:'#B5805E',hair:'#1A1210',hs:'long',out:'#2F9E70',acc:'collar'},
 c1:{n:'Diego Pilataxi',h:'diegopila',bg:'#2F79E0',skin:'#B07850',hair:'#1A1210',hs:'short',out:'#C44E24',acc:'collar'},
 c2:{n:'Mayra Cevallos',h:'mayrace',bg:'#8A4FBF',skin:'#D7A07C',hair:'#3B2416',hs:'long',out:'#2F9E70',acc:'collar'},
 c3:{n:'Jorge Quishpe',h:'jquishpe',bg:'#D9961C',skin:'#9C6748',hair:'#1A1210',hs:'short',glasses:1,out:'#1F2A44',acc:'collar'},
 c4:{n:'Valeria Proaño',h:'valeproano',bg:'#C9424A',skin:'#E0AC8A',hair:'#6B3A1E',hs:'bob',out:'#2F3E5C',acc:'collar'},
 c5:{n:'Luis Tasiguano',h:'luchotasi',bg:'#2F9E70',skin:'#A86E4F',hair:'#222',hs:'short',mus:1,out:'#6B4FC4',acc:'collar'},
 c6:{n:'Sofía Mena',h:'sofimena',bg:'#1F6FC5',skin:'#C88A68',hair:'#1A1210',hs:'long',glasses:1,out:'#B5523A',acc:'collar'},
 c7:{n:'Kevin Chiluisa',h:'kevchi',bg:'#46566A',skin:'#B97D5B',hair:'#1A1210',hs:'short',out:'#FF6B2C',acc:'collar'},
 c8:{n:'Patricia Yánez',h:'patyyanez',bg:'#7D4AB0',skin:'#D7A07C',hair:'#BDBDBD',hs:'bun',out:'#2F8F5B',acc:'shawl'},
 c9:{n:'Wilson Cuichán',h:'wcuichan',bg:'#B5523A',skin:'#9C6748',hair:'#5A5A5A',hs:'short',out:'#2B2F45',acc:'collar'},
 c10:{n:'Daniela Herrera',h:'danih',bg:'#1E8F8A',skin:'#E8B896',hair:'#2B1E1A',hs:'long',out:'#C98A2B',acc:'collar'},
 c11:{n:'Segundo Chicaiza',h:'donsegundo',bg:'#7A6A55',skin:'#A86E4F',hair:'#DADADA',hs:'short',glasses:1,out:'#4A5568',acc:'collar'},
 c12:{n:'Andrea Lema',h:'andrealema_tienda',bg:'#C98A2B',skin:'#9C6748',hair:'#1A1210',hs:'bun',out:'#C44E24',acc:'collar'},
 c13:{n:'Mateo Rivas',h:'mateorivas',bg:'#6B4FC4',skin:'#E0AC8A',hair:'#3B2416',hs:'short',out:'#2F79E0',acc:'collar'},
 memes:{n:'Quito Memes',h:'quitomemes',r:'Cuenta de humor',logo:'QM',bg:'#8A4FBF'},
 dato:{n:'Dato Cierto',h:'datocierto',r:'Verificación de datos',logo:'DC',bg:'#1E8F8A'},
 opo:{n:'Rodrigo Paredes',h:'rparedes_concejal',r:'Concejal de oposición',bg:'#B83A3F',skin:'#C99273',hair:'#2B1E1A',hs:'short',out:'#1F2A44',acc:'tie'}
};
const CIT=['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13'];
const HANDLE={pren:'paulaortiz',conc:'concejalamera',ciu:'carmentipan',alc:'despachoalcaldia',mov:'movilidaduio',seg:'segmetro',op:'fchavez',rosa:'rosaandrade',gaby:'gabyrios'};
const DIL=[
 {id:'ruido',tt:'Frenos con ruido',p:'rosa',eps:[1,2,3,4],t:'Un tren hace un ruido extraño en los frenos. Puedo sacarlo una semana para revisarlo, pero habrá menos trenes y más espera en los andenes.',o:[
   ['Retirarlo y revisarlo','wrench',[['wrench','+4 estado técnico',1],['users','−2% pasajeros este mes',0]],s=>{s.pax*=.98;s.salud+=4}],
   ['Mantenerlo operando','train',[['users','Sin pérdida de pasajeros',1],['alert','Más riesgo de falla este mes',0]],s=>{s.riskBonus+=.12}]]},
 {id:'ahorro',tt:'El Municipio pide ahorrar',p:'gaby',eps:[1,2,4],t:'El Municipio nos pide ahorrar. Podríamos bajar el mantenimiento a la mitad; nadie lo notaría de inmediato.',o:[
   ['Recortar el mantenimiento','coin',[['coin','Ahorras USD 0,6 M al mes',1],['wrench','Los trenes se deterioran en 3 meses',0]],s=>{s.mant='r';s.cap+=3}],
   ['Mantener el gasto','wrench',[['wrench','Los trenes siguen en forma',1],['landmark','−4 capital político',0]],s=>{s.cap-=4}]]},
 {id:'salarios',tt:'Los técnicos piden aumento',p:'rosa',eps:[1,2,3,4],t:'Los técnicos piden un aumento. En el sector privado les pagan más y algunos ya se están yendo.',o:[
   ['Aprobar el aumento','users',[['wrench','+2 estado técnico',1],['coin','+USD 0,1 M al mes en salarios',0]],s=>{s.fx.sal+=.1;s.salud+=2}],
   ['Negarlo','coin',[['coin','Sin costo adicional',1],['wrench','−4 estado técnico: se van expertos',0]],s=>{s.salud-=4}]]},
 {id:'directa',tt:'Compra sin licitación',p:'prov',eps:[2,3,4],t:'Tengo repuestos listos. Se los entrego la próxima semana por USD 1,5 M, sin licitación: firmamos un contrato directo y listo.',o:[
   ['Aceptar el contrato directo','box',[['box','+30 repuestos ya',1],['landmark','Alto riesgo de sanción de Contraloría',0],['coin','−USD 1,5 M',0]],s=>{s.rep+=30;s.caja-=1.5;if(Math.random()<.6)s.contra=s.mes+3}],
   ['Rechazar y seguir la ley','landmark',[['landmark','Sin riesgo legal',1],['clock','Esperas el proceso normal',0]],s=>{}]]},
 {id:'estud',tt:'Pasaje gratis para estudiantes',p:'conc',eps:[2,3,4],t:'Propongo que los estudiantes universitarios viajen gratis. Es justo y la gente lo va a aplaudir. ¿Me apoya en el Concejo?',o:[
   ['Apoyar la propuesta','heart',[['heart','+5 aprobación, +3 capital',1],['coin','Cobras menos por cada viaje',0]],s=>{s.apr+=5;s.cap+=3;s.tarEf-=.05}],
   ['Oponerse','coin',[['coin','Proteges los ingresos',1],['landmark','−5 capital político',0]],s=>{s.cap-=5;s.apr-=2}]]},
 {id:'prensa',tt:'La prensa pide las cifras',p:'pren',eps:[2,3,4],t:'Queremos publicar cuánto cuesta realmente cada viaje del Metro. ¿Nos entrega las cifras completas?',o:[
   ['Entregar todo','doc',[['heart','+3 aprobación ciudadana',1],['landmark','−3 capital: incomoda al Alcalde',0]],s=>{s.apr+=3;s.cap-=3}],
   ['Declinar','x',[['landmark','El Alcalde agradece la discreción',1],['heart','−4 aprobación: la nota sale igual',0]],s=>{s.apr-=4}]]},
 {id:'fiestas',tt:'Metro gratis en fiestas',p:'alc',eps:[2,3,4],c:s=>(s.mes-1)%12===11,t:'El Alcalde quiere que el Metro sea gratis el 6 de diciembre por las fiestas de Quito. Sería un gran gesto con la ciudad.',o:[
   ['Aceptar','heart',[['heart','+5 aprobación, +4 capital',1],['coin','−USD 0,4 M',0]],s=>{s.caja-=.4;s.apr+=5;s.cap+=4}],
   ['Negarse por las cuentas','coin',[['coin','Proteges la caja',1],['landmark','−6 capital político',0]],s=>{s.cap-=6}]]},
 {id:'noche',tt:'Horario nocturno',p:'ciu',eps:[3,4],t:'Las universidades piden extender el horario hasta las 23:00 para los estudiantes que salen de noche.',o:[
   ['Extender el horario','clock',[['users','Más pasajeros',1],['coin','+USD 0,12 M al mes en luz y salarios',0]],s=>{s.fx.ene+=.06;s.fx.sal+=.06;s.demBonus*=1.025}],
   ['Mantener el horario','x',[['coin','Sin costo',1],['heart','−2 aprobación',0]],s=>{s.apr-=2}]]},
 {id:'ascensor',tt:'Ascensores dañados',p:'ciu',eps:[2,3,4],t:'Somos personas con discapacidad. Tres ascensores llevan semanas dañados y no podemos usar el Metro.',o:[
   ['Repararlos ya con fondos propios','wrench',[['heart','+3 satisfacción, +2 aprobación',1],['coin','−USD 0,35 M',0]],s=>{s.caja-=.35;s.sat+=3;s.apr+=2}],
   ['Esperar la contratación regular','clock',[['coin','Sin gasto extra',1],['heart','−3 satisfacción y aprobación',0]],s=>{s.sat-=3;s.apr-=3}]]},
 {id:'valle',tt:'Menos trenes fuera de hora pico',p:'op',eps:[2,3,4],t:'Proponemos reducir trenes en las horas de menor demanda. El contrato lo permite y ahorraríamos dinero.',o:[
   ['Aceptar','coin',[['coin','Ahorras USD 0,2 M al mes',1],['users','−3 satisfacción: más espera',0]],s=>{s.fx.ene-=.12;s.fx.sal-=.08;s.sat-=3}],
   ['Rechazar','x',[['users','El servicio sigue igual',1],['coin','Sin ahorro',0]],s=>{}]]},
 {id:'robos',tt:'Robos en hora pico',p:'seg',eps:[3,4],t:'Aumentaron los robos en hora pico en San Francisco. Podemos contratar seguridad privada o pedir más policías al Gobierno.',o:[
   ['Seguridad privada','users',[['heart','+4 satisfacción, efecto seguro',1],['coin','+USD 0,15 M al mes en seguridad',0]],s=>{s.fx.seg+=.15;s.sat+=4}],
   ['Pedir policías al Gobierno','landmark',[['coin','Gratis',1],['alert','Depende de otra institución: puede no llegar',0]],s=>{s.cap-=2;s.sat+=Math.random()<.5?3:-3}]]},
 {id:'buses',tt:'Amenaza de paro de buses',p:'mov',eps:[3,4],t:'Los operadores de buses amenazan con paralizar si no reciben su compensación a tiempo. Podemos adelantar el pago.',o:[
   ['Adelantar el pago','bus',[['bus','+3 integración, sin paro',1],['coin','−USD 0,5 M',0]],s=>{s.caja-=.5;s.integ+=3}],
   ['Esperar los plazos','clock',[['coin','Sin gasto',1],['bus','−5 integración: relación tensa',0]],s=>{s.integ-=5}]]},
 {id:'extension',tt:'Anuncio de la extensión',p:'alc',eps:[4],c:s=>s.mes>=8,t:'El Alcalde quiere anunciar la extensión del Metro hacia el norte. Necesita que usted lo respalde en público y que su equipo prepare estudios.',o:[
   ['Respaldar el anuncio','mega',[['landmark','+6 capital político',1],['wrench','−2 estado técnico: el equipo se distrae',0]],s=>{s.cap+=6;s.apr+=2;s.salud-=2}],
   ['Pedir prudencia','x',[['wrench','Proteges al equipo técnico',1],['landmark','−5 capital político',0]],s=>{s.cap-=5}]]}
];
