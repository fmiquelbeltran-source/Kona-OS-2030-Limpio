export const SPORTS={run:{label:'Running',symbol:'↗',unit:'km'},bike:{label:'Ciclismo',symbol:'◉',unit:'km'},swim:{label:'Natación',symbol:'≈',unit:'m'},strength:{label:'Fuerza',symbol:'◆',unit:'min'},mobility:{label:'Movilidad',symbol:'✦',unit:'min'}};
export const WEEK_MS=86400000*7;
export const pad=n=>String(n).padStart(2,'0');
export const iso=d=>{const dt=typeof d==='string'?new Date(d+'T12:00:00'):d;return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`};
export const startMonday=date=>{const d=new Date(String(date).slice(0,10)+'T12:00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return iso(d)};
export const addDays=(date,n)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
export const num=x=>x===null||x===undefined||x===''?null:Number.isFinite(+x)?+x:null;
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const duration=m=>`${Math.floor((m||0)/60)}h ${pad(Math.round((m||0)%60))}m`;
export const dateES=s=>new Date(s+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'});
export const STORAGE='kona2030-clean-v1';
export const defaults=()=>({version:1,plans:{},logs:{},activities:[],wellness:{},profile:{weightKg:null,baseKcal:null},settings:{},sync:null});
export function normalizePlan(x){
 if(!x||typeof x!=='object'||!/^\d{4}-\d{2}-\d{2}$/.test(x.week_start||''))throw Error('El plan necesita week_start (AAAA-MM-DD).');
 if(startMonday(x.week_start)!==x.week_start)throw Error('week_start debe ser lunes.');
 if(!Array.isArray(x.sessions)||x.sessions.length>20)throw Error('sessions debe ser una lista de hasta 20 sesiones.');
 const ids=new Set();let minutes=0;
 const sessions=x.sessions.map((a,i)=>{
  if(!SPORTS[a.sport])throw Error('Deporte no reconocido en sesión '+(i+1));
  const day=String(a.date||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||startMonday(day)!==x.week_start)throw Error('Fecha fuera de la semana en sesión '+(i+1));
  const m=num(a.minutes);if(m===null||m<0||m>360||!Number.isInteger(m))throw Error('Duración incorrecta en sesión '+(i+1));
  const id=String(a.id||`${day}-${a.sport}-${i}`).slice(0,80);if(ids.has(id))throw Error('IDs de sesión duplicados');ids.add(id);
  minutes+=m;
  return {id,date:day,sport:a.sport,minutes:m,title:String(a.title||SPORTS[a.sport].label).slice(0,120),intensity:String(a.intensity||'Suave').slice(0,60),rpeTarget:num(a.rpeTarget),notes:String(a.notes||'').slice(0,700)};
 });
 if(minutes>1500)throw Error('El plan supera 25 horas semanales. Revisa el archivo.');
 return {week_start:x.week_start,revision:Math.max(1,Math.floor(num(x.revision)||1)),phase:String(x.phase||'Base').slice(0,80),objective:String(x.objective||'').slice(0,350),sessions};
}
export const initialState=()=>defaults();
export function load(){try {let v=JSON.parse(localStorage.getItem(STORAGE));return v?.version===1?{...defaults(),...v,profile:{...defaults().profile,...v.profile}}:defaults()}catch{return defaults()}}
export const save=st=>localStorage.setItem(STORAGE,JSON.stringify(st));
export const planned=(p)=>p?.sessions?.reduce((sum,s)=>sum+s.minutes,0)||0;
export function completedSessions(state,week){const plan=state.plans[week];return (plan?.sessions||[]).filter(s=>state.logs[s.id]?.done).length;}
export function weekActivities(state,week){return (state.activities||[]).filter(a=>a.date>=week&&a.date<=addDays(week,6));}
export const metrics=(state,week)=>{const plan=state.plans[week];let doneMinutes=0;for(const s of (plan?.sessions||[]))if(state.logs[s.id]?.done)doneMinutes+=num(state.logs[s.id].minutes)??s.minutes;const act=weekActivities(state,week);const unlinked=act.filter(a=>!a.sessionId);const extraMinutes=unlinked.reduce((n,a)=>n+(a.minutes||0),0);return {scheduled:planned(plan),completed:doneMinutes,extra:extraMinutes,count:act.length,done:completedSessions(state,week),plannedCount:plan?.sessions.length||0};};
export function addActivity(state,raw){const sport=raw.sport,day=String(raw.date||'');if(!SPORTS[sport]||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(new Date(day+'T12:00:00').getTime()))throw Error('Actividad con fecha o deporte incorrectos.');
 const m=num(raw.minutes);if(m===null||m<=0||m>1500)throw Error('Duración incorrecta.');
 const dist=num(raw.distanceKm),hr=num(raw.hr),power=num(raw.power),rpe=num(raw.rpe);
 const id=String(raw.id||`${raw.source||'manual'}:${day}:${sport}:${m}:${dist??''}:${String(raw.title||'').slice(0,20)}`).slice(0,180);
 const duplicate=state.activities.find(a=>a.id===id);
 const item={id,source:String(raw.source||'Manual').slice(0,70),date:day,sport,title:String(raw.title||SPORTS[sport].label).slice(0,120),minutes:Math.round(m),distanceKm:dist!==null&&dist>=0?dist:null,hr:hr!==null&&hr>=20&&hr<=240?hr:null,power:power!==null&&power>=0?power:null,rpe:rpe!==null&&rpe>=1&&rpe<=10?rpe:null,feeling:String(raw.feeling||'').slice(0,320),sessionId:raw.sessionId||null};
 if(duplicate){for(const k of ['distanceKm','hr','power','rpe','feeling','sessionId'])if((duplicate[k]===null||duplicate[k]==='')&&item[k]!==null&&item[k]!=='')duplicate[k]=item[k];return false}
 state.activities.push(item);state.activities.sort((a,b)=>b.date.localeCompare(a.date));return true;
}
// Vista analítica: sesiones registradas pero sin actividad externa se muestran
// como datos mínimos (sin inventar kilómetros, vatios o FC). Los enlaces no duplican.
export function analysisActivities(state){
 const observed=[...(state.activities||[])];
 const externalLinked=new Set(observed.map(a=>a.sessionId).filter(Boolean));
 const logged=Object.values(state.plans||{}).flatMap(p=>p.sessions||[]).filter(s=>state.logs?.[s.id]?.done);
 for(const s of logged){
  const l=state.logs[s.id];
  if(externalLinked.has(s.id)||l.activityId)continue;
  observed.push({id:'plan:'+s.id,source:'Registro en calendario',date:s.date,sport:s.sport,title:s.title,minutes:num(l.minutes)??s.minutes,distanceKm:null,hr:null,power:null,rpe:num(l.rpe),feeling:l.feeling||'',sessionId:s.id});
 }
 return observed;
}
export function linkActivity(state,activityId,sessionId){const a=state.activities.find(a=>a.id===activityId);if(!a)throw Error('Actividad no encontrada');const s=Object.values(state.plans).flatMap(p=>p.sessions).find(s=>s.id===sessionId);if(!s||s.date!==a.date||s.sport!==a.sport)throw Error('Sesión no compatible');if(a.sessionId&&a.sessionId!==sessionId)throw Error('Ya vinculada');a.sessionId=sessionId;state.logs[sessionId]={...(state.logs[sessionId]||{}),done:true,minutes:a.minutes,rpe:a.rpe,feeling:a.feeling,date:s.date,activityId:a.id};}
function median(v){if(!v.length)return null;const s=[...v].sort((a,b)=>a-b);return s[Math.floor(s.length/2)];}
export function readiness(state,day){let w=state.wellness[day]||{},signals=[],hard=false;const sleep=num(w.sleep),stress=num(w.stress),fatigue=num(w.fatigue),pain=num(w.pain),rhr=num(w.rhr),hrv=num(w.hrv);
 const lookback=Object.keys(state.wellness).filter(d=>d<day&&d>=addDays(day,-21)).sort().slice(-14).map(d=>state.wellness[d]);
 const bh=median(lookback.map(x=>num(x.hrv)).filter(x=>x!==null&&x>0)),br=median(lookback.map(x=>num(x.rhr)).filter(x=>x!==null&&x>0));
 if(sleep!==null&&sleep<6){signals.push('Sueño inferior a 6 h');hard=true}else if(sleep!==null&&sleep<7)signals.push('Sueño algo corto');
 if(stress!==null&&stress>=4)signals.push('Estrés elevado');
 if(fatigue!==null&&fatigue>=4)signals.push('Fatiga elevada');
 if(pain!==null&&pain>=4){signals.push('Dolor o molestias importantes');hard=true;}
 if(br!==null&&rhr!==null&&rhr>=br+7)signals.push('FC reposo elevada respecto a tu referencia');
 if(bh!==null&&hrv!==null&&hrv<=bh*.8)signals.push('HRV inferior a tu referencia personal');
 if(w.symptoms){signals.push('Has señalado síntomas relevantes');hard=true;}
 const count=[sleep,stress,fatigue,pain,rhr,hrv].filter(x=>x!==null).length;
 if(hard)return {level:'reduce',label:'Reducir o descansar',signals,description:'Prioriza recuperación. Si hay síntomas o dolor persistente, consulta con un profesional.'};
 if(signals.length>=2)return {level:'reduce',label:'Reducir',signals,description:'Considera bajar duración/intensidad; mantén las decisiones bajo control manual.'};
 if(signals.length===1)return {level:'caution',label:'Vigilar',signals,description:'Mantén intensidad fácil y reevalúa las sensaciones; no aumentes carga por un único dato.'};
 if(count<3)return {level:'unknown',label:'Datos insuficientes',signals:[],description:'Registra sueño, fatiga y estrés. Mientras tanto, sigue la planificación conservadora.'};
 return {level:'maintain',label:'Mantener lo previsto',signals:['Sin alertas en los datos registrados'],description:'No se recomienda aumentar la carga basándose en un único día favorable.'};
}
export function nutrition(weight,baseKcal,sport,minutes,feedback){const w=num(weight),base=num(baseKcal);if(!w||!base||w<35||w>200||base<1000||base>4500)return null;
 const mets={run:8,bike:6,swim:7,strength:4.5,mobility:2.5};const net=Math.max(0,Math.round(((mets[sport]||1)-1)*3.5*w/200*Math.max(0,minutes||0)/1));
 const kcal=Math.round(base+net),p=Math.round(1.7*w),minFat=Math.round(.8*w);let fat=Math.max(minFat,Math.round(.27*kcal/9));let carbs=Math.max(0,Math.round((kcal-p*4-fat*9)/4));
 return {kcal,extraKcal:net,protein:p,fat,carbs,proteinRange:`${Math.round(1.4*w)}–${Math.round(2*w)}`,note:'Estimación orientativa: el aumento energético suele cubrirse sobre todo con hidratos; proteína relativamente estable y grasas suficientes. Ajusta según apetito, evolución y asesoramiento profesional.'};
}
export function weeklySeries(activities,week,sport,metric){const last=[];for(let k=7;k>=0;k--){let mon=addDays(week,-7*k),to=addDays(mon,6);const a=activities.filter(a=>a.sport===sport&&a.date>=mon&&a.date<=to);let v=null;
 if(metric==='minutes')v=a.reduce((n,x)=>n+x.minutes,0);
 else if(metric==='distance')v=a.some(x=>x.distanceKm!==null)?a.reduce((n,x)=>n+(x.distanceKm||0),0):null;
 else if(metric==='hr')v=a.filter(x=>x.hr!==null).length?Math.round(a.reduce((n,x)=>n+(x.hr||0),0)/a.filter(x=>x.hr!==null).length):null;
 else if(metric==='power')v=a.filter(x=>x.power!==null).length?Math.round(a.reduce((n,x)=>n+(x.power||0),0)/a.filter(x=>x.power!==null).length):null;
 else if(metric==='rpe')v=a.filter(x=>x.rpe!==null).length?+(a.reduce((n,x)=>n+(x.rpe||0),0)/a.filter(x=>x.rpe!==null).length).toFixed(1):null;
 else if(metric==='pace'){let d=a.reduce((n,x)=>n+(x.distanceKm||0),0),m=a.filter(x=>x.distanceKm).reduce((n,x)=>n+x.minutes,0);v=d>0?(sport==='swim'?m/(d*10):m/d):null;}
 last.push({label:dateES(mon),value:v,count:a.length,date:mon});}return last;}
export function weekLoadAdvice(state,week){
 const dates=Array.from({length:7},(_,i)=>addDays(week,i));
 const records=dates.map(d=>({date:d,...(state.wellness[d]||{})})).filter(x=>state.wellness[x.date]);
 const poor=records.filter(x=>{let r=readiness(state,x.date);return r.level==='reduce'}).length;
 if(poor>=2)return {level:'reduce',text:'Valorar descarga: varios días señalan fatiga o recuperación desfavorable. Evitar aumentar el volumen hasta revisar sensaciones.'};
 const prev=addDays(week,-7),before=addDays(week,-14);
 const weeks=[prev,before].map(w=>metrics(state,w));
 const consistent=weeks.every(m=>m.plannedCount>0&&m.scheduled>0&&m.completed/m.scheduled>=0.85);
 const recent=Array.from({length:14},(_,i)=>state.wellness[addDays(week,i-14)]).filter(Boolean);
 const green=recent.length>=10&&recent.every(x=>num(x.sleep)>=7&&num(x.stress)<=2&&num(x.fatigue)<=2&&num(x.pain)<=1&&!x.symptoms);
 if(consistent&&green&&records.length>=5&&poor===0)return {level:'caution',text:'Buena continuidad y recuperación: considerar un aumento muy pequeño (hasta ~5%) en la siguiente planificación, solo si la adaptación clínica y las sensaciones lo permiten.'};
 return {level:'maintain',text:'Mantener progresión conservadora; faltan tendencias estables suficientes para justificar un aumento de carga.'};
}
export function weeklyReport(state,week){const plan=state.plans[week];const m=metrics(state,week);const stats=Object.entries(SPORTS).map(([sport,def])=>{let a=analysisActivities(state).filter(x=>x.date>=week&&x.date<=addDays(week,6)&&x.sport===sport),dist=a.reduce((n,x)=>n+(x.distanceKm||0),0);let minutes=a.reduce((n,x)=>n+x.minutes,0);let hr=a.filter(x=>x.hr!==null);return {sport,label:def.label,minutes,distanceKm:+dist.toFixed(2),sessions:a.length,avgHr:hr.length?Math.round(hr.reduce((n,x)=>n+x.hr,0)/hr.length):null,avgRpe:a.filter(x=>x.rpe).length?+(a.reduce((n,x)=>n+(x.rpe||0),0)/a.filter(x=>x.rpe).length).toFixed(1):null,feelings:a.filter(x=>x.feeling).slice(-3).map(x=>x.feeling)};});
 const recovery=Array.from({length:7},(_,i)=>state.wellness[addDays(week,i)]).filter(Boolean);
 const avg=k=>{const a=recovery.map(x=>num(x[k])).filter(x=>x!==null);return a.length?+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(1):null};
 return {week_start:week,next_week_advice:weekLoadAdvice(state,week),phase:plan?.phase||null,objective:plan?.objective||null,plan:{planned_minutes:m.scheduled,completed_minutes:m.completed,extra_minutes:m.extra,sessions_completed:m.done,sessions_planned:m.plannedCount},sports:stats,recovery:{days_recorded:recovery.length,avg_sleep_hours:avg('sleep'),avg_stress_1to5:avg('stress'),avg_fatigue_1to5:avg('fatigue'),avg_hrv_ms:avg('hrv'),avg_resting_hr:avg('rhr')},remarks:'Adjunta sensaciones y contexto antes de generar el siguiente plan; las cifras solas no diagnostican ni autorizan incrementos de carga.'};}
