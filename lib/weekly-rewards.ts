// Indicadores semanais construídos apenas com registros que o próprio usuário fez.
// Os bônus são simbólicos: alimentos não precisam ser "merecidos" por pontos.
export type DayRecord={completed:number;planned:number};
export type ActivityByDate=Record<string,DayRecord>;

export function localDateKey(day:Date):string{
 const y=day.getFullYear(),m=String(day.getMonth()+1).padStart(2,"0"),d=String(day.getDate()).padStart(2,"0");
 return y+"-"+m+"-"+d;
}
export function weekDays(day:Date):{key:string;label:string;date:string}[]{
 const monday=new Date(day.getFullYear(),day.getMonth(),day.getDate());
 monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
 return Array.from({length:7},(_,i)=>{
  const date=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+i);
  return {key:localDateKey(date),label:["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][i],date:date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})};
 });
}
export function consistentDay(day:DayRecord|undefined):boolean{
 return !!day && day.planned>0 && day.completed/day.planned>=0.8;
}
export function weeklySummary(activity:ActivityByDate,now:Date){
 const days=weekDays(now).map(day=>{
  const record=activity[day.key];
  return {...day,record,percent:record&&record.planned>0?Math.round(100*record.completed/record.planned):null,consistent:consistentDay(record)};
 });
 const consistentDays=days.filter(day=>day.consistent).length;
 const recordedDays=days.filter(day=>day.percent!==null).length;
 return {days,consistentDays,recordedDays,weeklyPoints:consistentDays*20};
}
export function cleanActivity(raw:unknown):ActivityByDate{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {};
 const out:ActivityByDate={};
 for(const [key,value] of Object.entries(raw)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!value||typeof value!=="object")continue;
  const v=value as Record<string,unknown>;
  if(typeof v.planned!=="number"||typeof v.completed!=="number")continue;
  if(!Number.isSafeInteger(v.planned)||!Number.isSafeInteger(v.completed)||v.planned<0||v.completed<0||v.completed>v.planned||v.planned>200)continue;
  out[key]={planned:v.planned,completed:v.completed};
 }
 return out;
}
