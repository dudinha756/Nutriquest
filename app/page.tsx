"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { authClient } from "../lib/neon";
import NutritionPicker from "../components/NutritionPicker";
import DietPdfManager from "../components/DietPdfManager";
import { type FoodPortion, tacoFoodById, mealNutrition, ptNumber } from "../lib/nutrition";

type Meal={id:number;name:string;time:string;items:string;done:boolean;xp:number;foods?:FoodPortion[]};
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


const mealFoodSummary=(meal:Meal)=>{
 if(!meal.foods?.length)return meal.items;
 return meal.foods.map(portion=>(tacoFoodById.get(portion.foodId)?.name??"Alimento")+" ("+ptNumber(portion.grams)+" g)").join(" • ");
};
type MealDetails=Pick<Meal,"name"|"time"|"items"|"foods">;
type MealEditorMode={mode:"new"}|{mode:"edit";meal:Meal};

function MealEditor({editor,onSave,onClose}:{
 editor:MealEditorMode;
 onSave:(details:MealDetails)=>void;
 onClose:()=>void;
}){
 const current=editor.mode==="edit"?editor.meal:null;
 const [name,setName]=useState(current?.name??"");
 const [time,setTime]=useState(current?.time??"12:00");
 const [items,setItems]=useState(current?.items??"");
 const [foods,setFoods]=useState<FoodPortion[]>(current?.foods??[]);
 useEffect(()=>{
  const handleKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};
  window.addEventListener("keydown",handleKey);
  return ()=>window.removeEventListener("keydown",handleKey);
 },[onClose]);
 const submit=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  const valid=foods.length===0||foods.every(f=>Number.isFinite(f.grams)&&f.grams>0&&f.grams<=3000&&tacoFoodById.has(f.foodId));
  if(!valid)return;
  const details={name:name.trim(),time,items:items.trim(),foods};
  if(!details.name||!details.time||(!details.items&&foods.length===0))return;
  onSave(details);
 };
 return <div className="meal-modal-backdrop">
  <section className="meal-modal" role="dialog" aria-modal="true" aria-labelledby="meal-editor-heading">
   <div className="meal-modal-title">
    <div><small>{current?"EDITAR REFEIÇÃO":"PERSONALIZAR DIETA"}</small>
     <h2 id="meal-editor-heading">{current?"Editar refeição":"Nova refeição"}</h2>
    </div>
    <button type="button" className="meal-modal-close" onClick={onClose} aria-label="Fechar editor">×</button>
   </div>
   <p className="meal-modal-help">Defina o nome, o horário e os alimentos deste bloco. Os cálculos nutricionais consideram somente itens selecionados na TACO.</p>
   <form className="meal-form" onSubmit={submit}>
    <label>Nome da refeição
     <input autoFocus required maxLength={70} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Ceia, Pré-treino..." />
    </label>
    <label>Horário
     <input type="time" required value={time} onChange={e=>setTime(e.target.value)}/>
    </label>
    <label>Observações ou descrição da refeição (opcional se houver alimentos TACO)
     <textarea maxLength={500} rows={3} value={items} onChange={e=>setItems(e.target.value)} placeholder="Ex.: sugestão de preparo, substituições ou observações"/>
    </label>
    <NutritionPicker value={foods} onChange={setFoods}/>
    <div className="meal-modal-actions">
     <button type="button" className="meal-cancel" onClick={onClose}>Cancelar</button>
     <button type="submit" className="primary" disabled={!name.trim()||!time||(!items.trim()&&foods.length===0)||foods.some(f=>f.grams<=0||f.grams>3000||!tacoFoodById.has(f.foodId))}>{current?"Salvar alterações":"Criar refeição"}</button>
    </div>
   </form>
  </section>
 </div>;
}

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
 const [mealEditor,setMealEditor]=useState<MealEditorMode|null>(null);

 useEffect(()=>{
  let cancelled=false;
  async function loadProfile(){
   const response = await fetch("/api/state", { credentials: "same-origin", cache: "no-store" });
   const body = await response.json() as { data?: Partial<SavedState> | null; error?: string };
   if(cancelled)return;
   if(!response.ok)throw new Error(body.error||"Não foi possível consultar seus dados.");
   const saved=body.data;
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
   try {
    const response = await fetch("/api/state", {
     method:"PUT",
     credentials:"same-origin",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({meals,water,xp,coins,streak,rewards}),
    });
    if(!response.ok){
     const body=await response.json().catch(()=>({error:"Falha na conexão com o servidor."})) as {error?:string};
     throw new Error(body.error||"Não foi possível salvar.");
    }
    setSaveError("");
   }catch(err){
    setSaveError(err instanceof Error?err.message:"Não foi possível salvar seus dados.");
   }
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

 const orderedMeals=useMemo(()=>[...meals].sort((a,b)=>a.time.localeCompare(b.time)),[meals]);
 const next=useMemo(()=>orderedMeals.find(m=>!m.done),[orderedMeals]);
 const dailyNutrition=useMemo(()=>{
  const calculated=meals.filter(m=>(m.foods?.length??0)>0);
  const summaries=calculated.map(m=>({meal:m,values:mealNutrition(m.foods)}));
  return {
   planned:summaries.reduce((sum,a)=>sum+a.values.kcal,0),
   completed:summaries.filter(a=>a.meal.done).reduce((sum,a)=>sum+a.values.kcal,0),
   calculated:calculated.length,
   missing:summaries.some(a=>a.values.missingKcal),
  };
 },[meals]);
 const saveMeal=(details:MealDetails)=>{
  if(mealEditor?.mode==="edit"){
   const id=mealEditor.meal.id;
   setMeals(current=>current.map(meal=>meal.id===id?{...meal,...details}:meal));
  }else{
   const id=Math.max(Date.now(),...meals.map(meal=>meal.id+1));
   setMeals(current=>[...current,{id,...details,done:false,xp:10}]);
  }
  setMealEditor(null);
 };
 const deleteMeal=(meal:Meal)=>{
  if(!confirm('Excluir a refeição "'+meal.name+'"? Esta ação não pode ser desfeita.'))return;
  setMeals(current=>current.filter(m=>m.id!==meal.id));
  if(meal.done){
   setXp(current=>Math.max(0,current-meal.xp));
   setCoins(current=>Math.max(0,current-5));
  }
 };

 if(loadError)return <div className="authscreen"><div className="authcard"><h2>Não foi possível carregar sua conta</h2><p>{loadError}</p><button className="authsubmit" onClick={()=>window.location.reload()}>Tentar novamente</button></div></div>;
 if(!loaded)return <div className="authscreen"><div className="authcard">Carregando seus dados...</div></div>;

 return <main className="shell">
  <aside>
   <div className="brand"><div>🥗</div><span><b>NutriQuest</b><small>consistência que recompensa</small></span></div>
   {["Hoje","Minha dieta","Progresso","Recompensas"].map(i=><button key={i} onClick={()=>setTab(i)} className={tab===i?"active":""}>{i}</button>)}
   <div className="sidebox"><b>🔥 {streak} dias</b><span>Sua sequência atual</span></div>
   <button className="logout" onClick={()=>{void authClient.signOut()}}>Sair da conta</button>
  </aside>

  <section className="content">
   {hasLegacy&&<div className="migration"><span>Encontramos um progresso antigo neste navegador. Deseja associá-lo a esta conta?</span><button onClick={importOldProgress}>Importar meu progresso</button><button onClick={()=>setHasLegacy(false)}>Agora não</button></div>}
   {saveError&&<div className="syncerror" role="alert">{saveError}</div>}
   <header><div><small>OLÁ, {(user.name||user.email.split("@")[0]).split(" ")[0].toLocaleUpperCase("pt-BR")}</small><h1>{tab}</h1></div><div className="wallet"><span>🪙 {coins}</span><span>⚡ {xp} XP</span><b>M</b></div></header>

   {tab==="Hoje"&&<>
    <div className="hero">
     <div><span className="tag">🔥 sequência de {streak} dias</span><h2>Hoje é mais um dia<br/>para cuidar de você.</h2><p>{meals.length===0?<>Crie seu primeiro bloco de refeição para começar.</>:next?<>Próxima refeição: <b>{next.name}</b> às {next.time}.</>:<>Parabéns! Todas as refeições planejadas foram concluídas.</>}</p></div>
     <div className="circle" style={{background:`conic-gradient(#ddeaaf ${percent*3.6}deg,#ffffff24 0)`}}><div><b>{percent}%</b><span>da dieta</span></div></div>
    </div>

    <div className="stats">
     <article><span>🍽️</span><div><small>Refeições</small><b>{done}/{meals.length}</b></div></article>
     <article><span>💧</span><div><small>Água</small><b>{(water/1000).toFixed(1)} L</b></div></article>
     <article><span>⚡</span><div><small>Nível</small><b>{level}</b></div></article>
     <article><span>🪙</span><div><small>NutriCoins</small><b>{coins}</b></div></article>
    </div>

    <div className="nutrition-day">
     <div><small>ENERGIA DAS REFEIÇÕES TACO</small><h3>{dailyNutrition.calculated>0?ptNumber(dailyNutrition.planned)+" kcal":"Adicione alimentos TACO"}</h3>
      <span>Energia planejada {dailyNutrition.missing?"(incompleta)":""}</span></div>
     <div><small>ENERGIA CONCLUÍDA</small><h3>{ptNumber(dailyNutrition.completed)} kcal</h3><span>Das refeições marcadas como feitas</span></div>
     <p>{dailyNutrition.calculated} de {meals.length} refeições têm alimentos da TACO registrados. Os demais blocos não entram nos totais calóricos. Valores estimados por 100 g de parte comestível.</p>
    </div>
    <div className="grid">
     <article className="card meals">
      <div className="title"><div><small>PLANO DE HOJE</small><h3>Suas refeições</h3></div><span>{percent}% concluído</span></div>
      {orderedMeals.length===0&&<p className="empty-meals">Nenhuma refeição cadastrada. Adicione seu primeiro bloco!</p>}
      {orderedMeals.map(m=><div className="meal-line" key={m.id}>
       <button className={m.done?"meal done":"meal"} onClick={()=>toggle(m.id)} aria-label={(m.done?"Desmarcar ":"Marcar como concluída: ")+m.name}>
        <i>{m.done?"✓":""}</i><div><b>{m.name}</b><span>{m.time} · {mealFoodSummary(m)}</span>
         {(m.foods?.length??0)>0&&m.items&&<small className="meal-note">{m.items}</small>}
         {(m.foods?.length??0)>0&&<small className="meal-kcal">{mealNutrition(m.foods).missingKcal?"Kcal não disponíveis":ptNumber(mealNutrition(m.foods).kcal)+" kcal pela TACO"}</small>}
        </div><em>+{m.xp} XP</em>
       </button>
       <button className="meal-quick-edit" type="button" aria-label={"Editar "+m.name} onClick={()=>setMealEditor({mode:"edit",meal:m})}>Editar</button>
      </div>)}
      <button className="meal-add-inline" type="button" onClick={()=>setMealEditor({mode:"new"})}>+ Adicionar refeição</button>
     </article>
     <article className="card"><small>HIDRATAÇÃO</small><h3>Água do dia</h3><div className="water"><b>{water}</b><span>/ 2500 ml</span></div><div className="bar"><i style={{width:`${Math.min(100,water/25)}%`}}/></div><div className="actions"><button onClick={()=>addWater(-250)}>−250</button><button onClick={()=>addWater(250)}>+250 ml</button><button onClick={()=>addWater(500)}>+500 ml</button></div></article>
    </div>
   </>}

   {tab==="Minha dieta"&&<div className="page">
    <div className="diet-heading">
     <div className="intro"><small>PLANEJAMENTO</small><h2>Sua dieta</h2><p>Adicione, edite e organize seus blocos por horário.</p></div>
     <button className="primary" onClick={()=>setMealEditor({mode:"new"})}>+ Nova refeição</button>
    </div>
    <DietPdfManager/>
    {orderedMeals.length===0&&<article className="card empty-meals">Sua dieta ainda não tem refeições. Use o botão acima para começar.</article>}
    {orderedMeals.map((m,i)=><article className="dietrow" key={m.id}>
     <strong>{String(i+1).padStart(2,"0")}</strong>
     <div className="dietrow-info"><h3>{m.name}</h3><p><b>{m.time}</b> · {mealFoodSummary(m)}</p>
      {(m.foods?.length??0)>0&&m.items&&<p className="meal-note">{m.items}</p>}
      {(m.foods?.length??0)>0&&<p className="diet-kcal">{mealNutrition(m.foods).missingKcal?"Energia incompleta":ptNumber(mealNutrition(m.foods).kcal)+" kcal"} · {m.foods?.length} alimentos TACO</p>}
     </div>
     <div className="dietrow-actions">
      <button onClick={()=>toggle(m.id)}>{m.done?"Concluída ✓":"Marcar como feita"}</button>
      <button className="edit-action" onClick={()=>setMealEditor({mode:"edit",meal:m})}>Editar</button>
      <button className="delete-action" onClick={()=>deleteMeal(m)}>Excluir</button>
     </div>
    </article>)}
   </div>}

   {tab==="Progresso"&&<div className="page"><div className="intro"><small>EVOLUÇÃO</small><h2>Seu progresso</h2><p>Consistência vale mais que perfeição.</p></div><div className="stats"><article><span>🎯</span><div><small>Adesão hoje</small><b>{percent}%</b></div></article><article><span>🔥</span><div><small>Sequência</small><b>{streak} dias</b></div></article><article><span>⚡</span><div><small>XP total</small><b>{xp}</b></div></article><article><span>🏆</span><div><small>Nível</small><b>{level}</b></div></article></div><article className="card progressCard"><h3>Meta semanal</h3><p>Complete pelo menos 90% da dieta em 5 dias.</p><div className="week">{[78,92,66,100,84,94,percent].map((v,i)=><div key={i}><i><span style={{height:`${v}%`}}/></i><small>{["S","T","Q","Q","S","S","H"][i]}</small></div>)}</div></article></div>}

   {tab==="Recompensas"&&<div className="page"><div className="rewardhero"><div><small>CARTEIRA</small><h2>{coins} NutriCoins</h2><p>Transforme hábitos consistentes em recompensas escolhidas por você.</p></div><span>🪙</span></div><div className="intro horizontal"><div><h2>Suas recompensas</h2><p>Cadastre coisas que realmente motivam você.</p></div><button className="primary" onClick={addReward}>+ Nova recompensa</button></div><div className="rewardgrid">{rewards.map(r=><article className="card reward" key={r.id}><span>🎁</span><h3>{r.name}</h3><p>{r.cost} NutriCoins</p><button disabled={coins<r.cost} onClick={()=>redeem(r)}>{coins>=r.cost?"Resgatar":"Saldo insuficiente"}</button></article>)}</div></div>}
  </section>
  {mealEditor&&<MealEditor key={mealEditor.mode==="edit"?mealEditor.meal.id:"new"} editor={mealEditor} onSave={saveMeal} onClose={()=>setMealEditor(null)}/>}
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
    ?await authClient.signUp.email({name:name.trim(),email:email.trim().toLowerCase(),password})
    :await authClient.signIn.email({email:email.trim().toLowerCase(),password});
   if(result.error)throw new Error(result.error.message||"Não foi possível entrar.");
   if(createAccount){
    setNotice("Cadastro realizado! Caso seja necessário, confirme seu e-mail para acessar a conta.");
   }else{
    // Do not silently return to a blank login form if Safari rejects the session.
    const verified=await authClient.getSession();
    if(!verified.data?.user){
     throw new Error("Não foi possível manter sua sessão. Abra o aplicativo pelo Safari e tente novamente.");
    }
    window.location.reload();
   }
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
 const {data:session,isPending}=authClient.useSession();
 if(isPending)return <main className="authscreen"><div className="authcard">Verificando sua sessão...</div></main>;
 if(!session?.user)return <AuthScreen/>;
 return <Dashboard key={session.user.id} user={session.user}/>;
}
