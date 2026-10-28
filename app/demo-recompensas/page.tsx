"use client";

import {useEffect,useMemo,useState} from "react";
import WeeklyRewards from "../../components/WeeklyRewards";
import {type ActivityByDate,localDateKey,weekDays} from "../../lib/weekly-rewards";

export default function DemoRecompensas(){
 const [today,setToday]=useState("2026-10-28");
 const [selected,setSelected]=useState<string[]>([]);
 const [coins,setCoins]=useState(0);
 const [customRewards,setCustomRewards]=useState<Array<{id:number;name:string;cost:number}>>([]);
 const [notification,setNotification]=useState("");
 useEffect(()=>{setToday(localDateKey(new Date()));},[]);
 const days=useMemo(()=>weekDays(new Date(today+"T12:00:00")),[today]);
 const activity=useMemo<ActivityByDate>(()=>Object.fromEntries(selected.map(key=>[key,{planned:5,completed:4}])),[selected]);
 const toggle=(key:string)=>setSelected(current=>current.includes(key)?current.filter(a=>a!==key):[...current,key]);
 const addReward=()=>{
  const name=window.prompt("Qual recompensa pessoal você quer criar?");
  if(!name?.trim())return;
  setCustomRewards(current=>[...current,{id:Date.now(),name:name.trim().slice(0,80),cost:50}]);
  setNotification("Recompensa criada apenas nesta demonstração. Seus dados reais não foram alterados.");
 };
 return <main className="rewards-demo-shell">
  <section className="rewards-demo-intro">
   <div className="rewards-demo-label">NUTRIQUEST • DEMONSTRAÇÃO SEM LOGIN</div>
   <h1>Conquistas semanais</h1>
   <p>Experimente o novo sistema de bonificações no celular. Use os dias abaixo para simular uma semana de refeições registradas e veja como a pontuação muda imediatamente.</p>
   <div className="rewards-demo-notice" role="note">Esta página usa dados fictícios e não acessa nem altera sua conta, sua dieta ou suas NutriCoins.</div>
  </section>
  <section className="rewards-demo-controls">
   <div className="rewards-demo-head"><div><small>TESTE INTERATIVO</small><h2>Simule seus dias consistentes</h2></div>
    <button type="button" onClick={()=>{setSelected([]);setNotification("");}}>Reiniciar demonstração</button></div>
   <p>Toque nos dias para registrar, como exemplo, 4 de 5 refeições concluídas (80%). Toque novamente para desmarcar.</p>
   <div className="rewards-demo-actions">
    {days.map(day=><button key={day.key} type="button" aria-pressed={selected.includes(day.key)} className={selected.includes(day.key)?"is-selected":""} onClick={()=>toggle(day.key)}><span>{day.label}</span><b>{selected.includes(day.key)?"✓":"+"}</b><small>{day.date}</small></button>)}
   </div>
   <button className="rewards-demo-week" type="button" onClick={()=>setSelected(days.map(day=>day.key))}>Simular a semana completa (7 dias)</button>
  </section>
  {notification&&<p className="rewards-demo-notice" role="status">{notification}</p>}
  <WeeklyRewards activity={activity} today={today} coins={coins} rewards={customRewards}
   onAddReward={addReward} onRedeem={reward=>{if(coins>=reward.cost){setCoins(v=>v-reward.cost);setNotification("Resgate ilustrativo registrado nesta demonstração.");}}}/>
  <p className="rewards-demo-disclaimer">As celebrações não são permissões para comer ou compensações por alimentos. Você pode aproveitar comidas de que gosta independentemente da pontuação.</p>
 </main>;
}
