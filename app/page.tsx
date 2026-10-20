"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { neon } from "../lib/neon";

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

type Profile = { id: string; name?: string | null; email: string };
type SavedState = { meals: Meal[]; water: number; xp: number; coins: number; streak: number; rewards: Reward[] };

function Dashboard({ user }: { user: Profile }){
 const [meals,setMeals]=useState<Meal[]>(initialMeals.map(m=>({...m,done:false})));
 const [water,setWater]=useState(0);
 const [xp,setXp]=useState(0);
 const [coins,setCoins]=useState(0);
 const [streak,setStreak]=useState(0);
 const [tab,setTab]=useState("Hoje");
 const [rewards,setRewards]=useState(initialRewards);
 const [loaded,setLoaded]=useState(false);
 const [loadError,setLoadError]=useState("");
 const [saveError,setSaveError]=useState("");
 const [hasLegacy,setHasLegacy]=useState(false);

 useEffect(()=>{
  let cancelled=false;
  async function loadProfile(){
   const {data,error}=await neon.from("nutriquest_state").select("data").eq("user_id",user.id).maybeSingle();
   if(cancelled)return;
   if(error)throw new Error(error.message);
   const saved=(data as {data?:Partial<SavedState>} | null)?.data;
   if(saved){
    if(Array.isArray(saved.meals))setMeals(saved.meals);
    if(typeof saved.water==="number")setWater(saved.water);
    if(typeof saved.xp==="number")setXp(saved.xp);
    if(typeof saved.coins==="number")setCoins(saved.coins);
    if(typeof saved.streak==="number")setStreak(saved.streak);
    if(Array.isArray(saved.rewards))setRewards(saved.rewards);
   }else if(localStorage.getItem("nutriquest")&&!localStorage.getItem("nutriquest_imported_"+user.id)){
    setHasLegacy(true);
   }
   setLoaded(true);
  }
  loadProfile().catch(err=>{if(!cancelled)setLoadError(err instanceof Error?err.message:"Falha ao carregar seus dados.")});
  return ()=>{cancelled=true};
 },[user.id]);

 useEffect(()=>{
  if(!loaded)return;
  const timer=setTimeout(async()=>{
   const {error}=await neon.from("nutriquest_state").upsert({
    user_id:user.id,
    data:{meals,water,xp,coins,streak,rewards},
    updated_at:new Date().toISOString(),
   },{onConflict:"user_id"});
   setSaveError(error?("Não foi possível salvar: "+error.message):"");
  },700);
  return ()=>clearTimeout(timer);
 },[loaded,user.id,meals,water,xp,coins,streak,rewards]);

 const importOldProgress=()=>{
  const raw=localStorage.getItem("nutriquest");
  if(!raw||!confirm("Importar os dados salvos neste navegador para ESTA conta?"))return;
  try{
   const d=JSON.parse(raw) as Partial<SavedState>;
   if(Array.isArray(d.meals))setMeals(d.meals);
   if(typeof d.water==="number")setWater(d.water);
   if(typeof d.xp==="number")setXp(d.xp);
   if(typeof d.coins==="number")setCoins(d.coins);
   if(typeof d.streak==="number")setStreak(d.streak);
   if(Array.isArray(d.rewards))setRewards(d.rewards);
   localStorage.setItem("nutriquest_imported_"+user.id,"1");
   setHasLegacy(false);
  }catch{alert("Não foi possível importar esses dados.")};
 };

 const done=meals.filter(m=>m.done).length;
 const percent=meals.length?Math.round(done/meals.length*100):0;
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

 if(loadError)return <div className="authscreen"><div className="authcard"><h2>Não foi possível carregar sua conta</h2><p>{loadError}</p><button className="authsubmit" onClick={()=>window.location.reload()}>Tentar novamente</button></div></div>;
 if(!loaded)return <div className="authscreen"><div className="authcard">Carregando seus dados...</div></div>;

 return <main className="shell">
  <aside>
   <div className="brand"><div>🥗</div><span><b>NutriQuest</b><small>consistência que recompensa</small></span></div>
   {["Hoje","Minha dieta","Progresso","Recompensas"].map(i=><button key={i} onClick={()=>setTab(i)} className={tab===i?"active":""}>{i}</button>)}
   <div className="sidebox"><b>🔥 {streak} dias</b><span>Sua sequência atual</span></div>
   <button className="logout" onClick={()=>{void neon.auth.signOut()}}>Sair da conta</button>
  </aside>

  <section className="content">
   {hasLegacy&&<div className="migration"><span>Encontramos um progresso antigo neste navegador. Deseja associá-lo a esta conta?</span><button onClick={importOldProgress}>Importar meu progresso</button><button onClick={()=>setHasLegacy(false)}>Agora não</button></div>}
   {saveError&&<div className="syncerror" role="alert">{saveError}</div>}
   <header><div><small>OLÁ, {(user.name||user.email.split("@")[0]).split(" ")[0].toLocaleUpperCase("pt-BR")}</small><h1>{tab}</h1></div><div className="wallet"><span>🪙 {coins}</span><span>⚡ {xp} XP</span><b>M</b></div></header>

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

function AuthScreen(){
 const [createAccount,setCreateAccount]=useState(false);
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(busy)return;
  if(createAccount&&password.length<8){setError("A senha precisa ter pelo menos 8 caracteres.");return}
  setBusy(true);setError("");setNotice("");
  try{
   const result=createAccount
    ?await neon.auth.signUp.email({name:name.trim(),email:email.trim().toLowerCase(),password})
    :await neon.auth.signIn.email({email:email.trim().toLowerCase(),password});
   if(result.error)throw new Error(result.error.message||"Não foi possível entrar.");
   if(createAccount)setNotice("Cadastro realizado! Caso seja necessário, confirme seu e-mail para acessar a conta.");
  }catch(err){setError(err instanceof Error?err.message:"Ocorreu um erro. Tente novamente.")}
  finally{setBusy(false)}
 };
 return <main className="authscreen">
  <section className="authcard">
   <div className="authlogo">🥗</div>
   <h1>NutriQuest</h1>
   <p className="authsubtitle">Consistência que recompensa. Seu progresso, sua conta.</p>
   <div className="authswitch">
    <button type="button" className={!createAccount?"chosen":""} onClick={()=>{setCreateAccount(false);setError("");setNotice("")}}>Entrar</button>
    <button type="button" className={createAccount?"chosen":""} onClick={()=>{setCreateAccount(true);setError("");setNotice("")}}>Criar conta</button>
   </div>
   <form onSubmit={submit}>
    {createAccount&&<label>Seu nome<input value={name} onChange={e=>setName(e.target.value)} placeholder="Como podemos chamar você?" autoComplete="name" required maxLength={100}/></label>}
    <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required/></label>
    <label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={createAccount?"Mínimo de 8 caracteres":"Sua senha"} autoComplete={createAccount?"new-password":"current-password"} minLength={createAccount?8:1} required/></label>
    {error&&<div className="autherror" role="alert">{error}</div>}
    {notice&&<div className="authnotice" role="status">{notice}</div>}
    <button className="authsubmit" type="submit" disabled={busy}>{busy?"Aguarde...":createAccount?"Criar minha conta":"Entrar no NutriQuest"}</button>
   </form>
   <p className="authfoot">Cada usuário mantém suas refeições, metas e recompensas separadas.</p>
  </section>
 </main>;
}

export default function Home(){
 const {data:session,isPending}=neon.auth.useSession();
 if(isPending)return <main className="authscreen"><div className="authcard">Verificando sua sessão...</div></main>;
 if(!session?.user)return <AuthScreen/>;
 return <Dashboard key={session.user.id} user={session.user}/>;
}
