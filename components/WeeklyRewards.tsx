"use client";

import { type ActivityByDate, weeklySummary, localDateKey } from "../lib/weekly-rewards";

type Reward={id:number;name:string;cost:number};
type Props={
 activity:ActivityByDate;
 today:string;
 coins:number;
 rewards:Reward[];
 onAddReward:()=>void;
 onRedeem:(reward:Reward)=>void;
};
const milestones=[
 {points:60,days:3,icon:"✨",title:"Pequena celebração",example:"Uma sobremesa favorita ou um café especial",description:"Três dias de atenção à sua rotina merecem reconhecimento."},
 {points:100,days:5,icon:"🍕",title:"Momento especial",example:"Uma pizza, um hambúrguer ou um passeio gastronômico",description:"Cinco dias consistentes — seu progresso continua contando."},
 {points:140,days:7,icon:"🍣",title:"Semana para celebrar",example:"Noite de sushi — por exemplo, 30 peças, se você quiser",description:"Uma semana inteira de registros consistentes."},
] as const;

export default function WeeklyRewards({activity,today,coins,rewards,onAddReward,onRedeem}:Props){
 const todayDate=new Date(today+"T12:00:00");
 const summary=weeklySummary(activity,Number.isNaN(todayDate.getTime())?new Date():todayDate);
 return <div className="weekly-rewards">
  <div className="rewardhero wellness-reward-hero">
   <div><small>CONQUISTAS DA SEMANA</small><h2>{summary.consistentDays} de 7 dias</h2><p>Cada dia com pelo menos 80% das refeições planejadas registradas conta para suas conquistas.</p></div>
   <span aria-hidden="true">🌿</span>
  </div>
  <section className="card weekly-score">
   <div className="weekly-score-top"><div><small>PONTUAÇÃO SIMBÓLICA</small><h3>{summary.weeklyPoints} <span>/ 140 pontos</span></h3></div>
    <div className="weekly-score-pill">{summary.recordedDays} dias registrados</div></div>
   <div className="weekly-bar" role="progressbar" aria-label="Pontos de consistência da semana" aria-valuenow={summary.weeklyPoints} aria-valuemin={0} aria-valuemax={140}><span style={{width:Math.round(summary.weeklyPoints/140*100)+"%"}}/></div>
   <div className="weekly-days">{summary.days.map(day=><div className={"weekly-day"+(day.consistent?" complete":"")+(day.key===localDateKey(todayDate)?" is-today":"")} key={day.key}>
    <b>{day.label}</b><small>{day.date}</small>
    <span>{day.percent===null?"—":day.percent+"%"}</span>
    {day.consistent&&<em>+20 pts</em>}
   </div>)}</div>
   <p className="weekly-score-foot">Os pontos são apenas uma forma divertida de acompanhar a constância. Dias não registrados aparecem com “—”. Não há pontos negativos por mudanças na alimentação.</p>
  </section>
  <div className="intro"><small>IDEIAS PARA CELEBRAR</small><h2>Suas conquistas</h2>
   <p>Você pode aproveitar seus alimentos favoritos em qualquer momento — com ou sem pontos. As conquistas abaixo celebram a rotina, não autorizam ou compensam refeições.</p>
  </div>
  <div className="wellness-milestones">{milestones.map(m=>{
   const achieved=summary.weeklyPoints>=m.points;
   return <article key={m.points} className={"card wellness-milestone"+(achieved?" achieved":"")}>
    <div className="milestone-top"><span className="milestone-icon">{m.icon}</span><span className="milestone-tag">{achieved?"Conquista alcançada":"Faltam "+Math.max(0,m.days-summary.consistentDays)+" dias consistentes"}</span></div>
    <h3>{m.title}</h3><p>{m.description}</p><div className="milestone-example">{m.example}</div>
    <div className="milestone-meta">{m.points} pontos simbólicos • {m.days} dias consistentes</div>
   </article>;
  })}</div>
  <p className="weekly-balance-note">Uma refeição diferente do planejado não apaga o que você construiu. Quantidades, incluindo o exemplo de sushi, são escolhas pessoais — não metas ou recomendações nutricionais.</p>
  <div className="intro horizontal"><div><small>PERSONALIZE SUA MOTIVAÇÃO</small><h2>Recompensas pessoais</h2>
   <p>As NutriCoins e as recompensas que você já cadastrou continuam disponíveis.</p></div>
   <button className="primary" onClick={onAddReward}>+ Nova recompensa</button>
  </div>
  <div className="rewardgrid">{rewards.map(r=><article className="card reward" key={r.id}>
   <span>🎁</span><h3>{r.name}</h3><p>{r.cost} NutriCoins</p>
   <button disabled={coins<r.cost} onClick={()=>onRedeem(r)}>{coins>=r.cost?"Resgatar":"Saldo insuficiente"}</button>
  </article>)}</div>
  <p className="weekly-coins-note">Seu saldo atual: {coins} NutriCoins. Recompensas cadastradas e conquistas da semana são independentes.</p>
 </div>;
}
