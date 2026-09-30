"use client";

import { useEffect, useMemo, useState } from "react";

type Meal={id:number;name:string;time:string;items:string;done:boolean;xp:number};
type Reward={id:number;name:string;cost:number};

const initialMeals:Meal[]=[
 {id:1,name:"Café da manhã",time:"07:30",items:"2 ovos • pão integral • mamão",done:true,xp:10},
 {id:2,name:"Lanche",time:"10:30",items:"Iogurte • fruta",done:true,xp:10},
 {id:3,name:"Almoço",time:"13:00",items:"Arroz • proteína • feijão • salada",done:false,xp:10},
 {id:4,name:"Lanche da tarde",time:"16:30",items:"Sanduíche ou fruta + proteína",done:false,xp:10},
 {id:5,name:"Jantar",time:"20:00",items:"Proteína • carboidrato • vegetais",done:false,xp:10},
];
const initialRewards:Reward[]=[
 {id:1,name:"Refeição especial",cost:250},
 {id:2,name:"Cinema",cost:500},
 {id:3,name:"Autocuidado",cost:800},
];

export default function Home(){
 const [meals,setMeals]=useState(initialMeals);
 const [water,setWater]=useState(1400);
 const [xp,setXp]=useState(240);
 const [coins,setCoins]=useState(120);
 const [streak,setStreak]=useState(6);
 const [tab,setTab]=useState("Hoje");
 const [rewards,setRewards]=useState(initialRewards);
 const [loaded,setLoaded]=useState(false);

 useEffect(()=>{
  const saved=localStorage.getItem("nutriquest");
  if(saved){try{const d=JSON.parse(saved);setMeals(d.meals??initialMeals);setWater(d.water??1400);setXp(d.xp??240);setCoins(d.coins??120);setStreak(d.streak??6);setRewards(d.rewards??initialRewards)}catch{}}
  setLoaded(true);
 },[]);
 useEffect(()=>{if(loaded)localStorage.setItem("nutriquest",JSON.stringify({meals,water,xp,coins,streak,rewards}))},[loaded,meals,water,xp,coins,streak,rewards]);

 const done=meals.filter(m=>m.done).length;
 const percent=Math.round(done/meals.length*100);
 const level=Math.floor(xp/250)+1;
 const toggle=(id:number)=>setMeals(ms=>ms.map(m=>{
  if(m.id!==id)return m;
  const completing=!m.done;
  setXp(x=>Math.max(0,x+(completing?m.xp:-m.xp)));
  setCoins(c=>Math.max(0,c+(completing?5:-5)));
  return {...m,done:completing};
 }));
 const addWater=(n:number)=>setWater(w=>Math.max(0,Math.min(3000,w+n)));
 const addReward=()=>{
  const name=prompt("Qual recompensa você quer cadastrar?");
  if(!name)return;
  const cost=Number(prompt("Quantas NutriCoins ela custa?","400")||400);
  setRewards(r=>[...r,{id:Date.now(),name,cost}]);
 };
 const redeem=(r:Reward)=>{
  if(coins<r.cost)return;
  if(confirm(`Resgatar "${r.name}" por ${r.cost} NutriCoins?`))setCoins(c=>c-r.cost);
 };
 const next=useMemo(()=>meals.find(m=>!m.done),[meals]);

 return <main className="shell">
  <aside>
   <div className="brand"><div>🥗</div><span><b>NutriQuest</b><small>consistência que recompensa</small></span></div>
   {["Hoje","Minha dieta","Progresso","Recompensas"].map(i=><button key={i} onClick={()=>setTab(i)} className={tab===i?"active":""}>{i}</button>)}
   <div className="sidebox"><b>🔥 {streak} dias</b><span>Sua sequência atual</span></div>
  </aside>

  <section className="content">
   <header><div><small>OLÁ, MARIA</small><h1>{tab}</h1></div><div className="wallet"><span>🪙 {coins}</span><span>⚡ {xp} XP</span><b>M</b></div></header>

   {tab==="Hoje"&&<>
    <div className="hero">
     <div><span className="tag">🔥 sequência de {streak} dias</span><h2>Hoje é mais um dia<br/>para cuidar de você.</h2><p>{next?<>Próxima refeição: <b>{next.name}</b> às {next.time}.</>:<>Parabéns! Todas as refeições planejadas foram concluídas.</>}</p></div>
     <div className="circle" style={{background:`conic-gradient(#ddeaaf ${percent*3.6}deg,#ffffff24 0)`}}><div><b>{percent}%</b><span>da dieta</span></div></div>
    </div>

    <div className="stats">
     <article><span>🍽️</span><div><small>Refeições</small><b>{done}/{meals.length}</b></div></article>
     <article><span>💧</span><div><small>Água</small><b>{(water/1000).toFixed(1)} L</b></div></article>
     <article><span>⚡</span><div><small>Nível</small><b>{level}</b></div></article>
     <article><span>🪙</span><div><small>NutriCoins</small><b>{coins}</b></div></article>
    </div>

    <div className="grid">
     <article className="card meals"><div className="title"><div><small>PLANO DE HOJE</small><h3>Suas refeições</h3></div><span>{percent}% concluído</span></div>
      {meals.map(m=><button className={m.done?"meal done":"meal"} onClick={()=>toggle(m.id)} key={m.id}><i>{m.done?"✓":""}</i><div><b>{m.name}</b><span>{m.time} · {m.items}</span></div><em>+{m.xp} XP</em></button>)}
     </article>
     <article className="card"><small>HIDRATAÇÃO</small><h3>Água do dia</h3><div className="water"><b>{water}</b><span>/ 2500 ml</span></div><div className="bar"><i style={{width:`${Math.min(100,water/25)}%`}}/></div><div className="actions"><button onClick={()=>addWater(-250)}>−250</button><button onClick={()=>addWater(250)}>+250 ml</button><button onClick={()=>addWater(500)}>+500 ml</button></div></article>
    </div>
   </>}

   {tab==="Minha dieta"&&<div className="page"><div className="intro"><small>PLANEJAMENTO</small><h2>Sua dieta</h2><p>Marque o que foi cumprido e mantenha o foco no processo.</p></div>{meals.map((m,i)=><article className="dietrow" key={m.id}><strong>{String(i+1).padStart(2,"0")}</strong><div><h3>{m.name}</h3><p>{m.time} · {m.items}</p></div><button onClick={()=>toggle(m.id)}>{m.done?"Concluída ✓":"Marcar como feita"}</button></article>)}</div>}

   {tab==="Progresso"&&<div className="page"><div className="intro"><small>EVOLUÇÃO</small><h2>Seu progresso</h2><p>Consistência vale mais que perfeição.</p></div><div className="stats"><article><span>🎯</span><div><small>Adesão hoje</small><b>{percent}%</b></div></article><article><span>🔥</span><div><small>Sequência</small><b>{streak} dias</b></div></article><article><span>⚡</span><div><small>XP total</small><b>{xp}</b></div></article><article><span>🏆</span><div><small>Nível</small><b>{level}</b></div></article></div><article className="card progressCard"><h3>Meta semanal</h3><p>Complete pelo menos 90% da dieta em 5 dias.</p><div className="week">{[78,92,66,100,84,94,percent].map((v,i)=><div key={i}><i><span style={{height:`${v}%`}}/></i><small>{["S","T","Q","Q","S","S","H"][i]}</small></div>)}</div></article></div>}

   {tab==="Recompensas"&&<div className="page"><div className="rewardhero"><div><small>CARTEIRA</small><h2>{coins} NutriCoins</h2><p>Transforme hábitos consistentes em recompensas escolhidas por você.</p></div><span>🪙</span></div><div className="intro horizontal"><div><h2>Suas recompensas</h2><p>Cadastre coisas que realmente motivam você.</p></div><button className="primary" onClick={addReward}>+ Nova recompensa</button></div><div className="rewardgrid">{rewards.map(r=><article className="card reward" key={r.id}><span>🎁</span><h3>{r.name}</h3><p>{r.cost} NutriCoins</p><button disabled={coins<r.cost} onClick={()=>redeem(r)}>{coins>=r.cost?"Resgatar":"Saldo insuficiente"}</button></article>)}</div></div>}
  </section>
 </main>
}
