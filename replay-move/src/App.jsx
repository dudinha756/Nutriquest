import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, Dumbbell, Heart, Music2, Play, RotateCcw, Sparkles, Trophy } from "lucide-react";

const copy = {
  en: {
    tagline: "Move toward how you want to feel.",
    sub: "A movement experience shaped by your energy, time, body and soundtrack.",
    start: "Build my session",
    how: "How do you feel right now?",
    want: "How do you want to feel?",
    move: "How would you like to move?",
    time: "How much time do you have?",
    intensity: "Choose your intensity",
    music: "Pick today’s soundtrack",
    build: "Create my RE:PLAY",
    now: "Your RE:PLAY is ready",
    finish: "Finish session",
    again: "Create another",
    feedback: "How do you feel now?",
    save: "Save feeling",
    complete: "Session complete",
    note: "RE:PLAY Move is a wellness prototype, not medical care. Adapt or stop any activity that feels unsafe or painful."
  },
  pt: {
    tagline: "Mova-se em direção a como você quer se sentir.",
    sub: "Uma experiência de movimento moldada pela sua energia, tempo, corpo e trilha sonora.",
    start: "Montar minha sessão",
    how: "Como você está se sentindo agora?",
    want: "Como você quer se sentir?",
    move: "Como você quer se movimentar?",
    time: "Quanto tempo você tem?",
    intensity: "Escolha a intensidade",
    music: "Escolha a trilha de hoje",
    build: "Criar meu RE:PLAY",
    now: "Seu RE:PLAY está pronto",
    finish: "Finalizar sessão",
    again: "Criar outra",
    feedback: "Como você se sente agora?",
    save: "Salvar sensação",
    complete: "Sessão concluída",
    note: "RE:PLAY Move é um protótipo de bem-estar, não atendimento médico. Adapte ou interrompa qualquer atividade que pareça insegura ou dolorosa."
  }
};

const moods = [
  ["low","Low","Sem energia","☁️"], ["stressed","Stressed","Estressada","⚡"], ["okay","Okay","Ok","🌤️"],
  ["good","Good","Bem","☀️"], ["energized","Energized","Energizada","✨"]
];
const desired = [
  ["calm","Calm","Calma","🌿"], ["strong","Strong","Forte","💪"], ["free","Free","Livre","🪽"],
  ["focused","Focused","Focada","🎯"], ["playful","Playful","Divertida","🪁"], ["energized","Energized","Energizada","🔥"]
];
const modes = [
  ["strength","Strength","Musculação",Dumbbell], ["walk","Walk","Caminhada",Heart], ["run","Run","Corrida",Trophy],
  ["dance","Dance","Dança",Music2], ["mobility","Mobility","Mobilidade",Sparkles], ["adaptive","Adaptive","Adaptado",Heart]
];
const times=[10,20,30,45];
const intensities=[["gentle","Gentle","Leve"],["steady","Steady","Moderada"],["challenge","Challenge","Desafiadora"]];
const vibes=[["throwback","Throwback","Nostalgia"],["power","Power","Potência"],["feelgood","Feel good","Boas vibrações"],["focus","Focus","Foco"],["surprise","Surprise me","Surpreenda-me"]];

const libraries = {
  strength: ["Bodyweight squat","Incline push-up","Reverse lunge","Hip hinge","Shoulder press pattern","Plank variation"],
  walk: ["Easy pace","Rhythm walk","Brisk interval","Recovery pace","Free walk"],
  run: ["Easy jog","Rhythm run","Faster interval","Recovery jog","Strong finish"],
  dance: ["Freestyle groove","Side-to-side step","Reach & sway","Fast chorus","Favorite move"],
  mobility: ["Cat-cow","Hip opener","Thoracic rotation","Shoulder flow","Deep breathing"],
  adaptive: ["Seated march","Seated reach","Chair-supported hinge","Band/pillow press","Breathing reset"]
};

function App(){
  const [lang,setLang]=useState("en");
  const t=copy[lang];
  const [step,setStep]=useState(0);
  const [form,setForm]=useState({mood:"okay",desired:"energized",mode:"strength",time:20,intensity:"steady",vibe:"feelgood"});
  const [feedback,setFeedback]=useState("");
  const labels=(item)=>lang==="en"?item[1]:item[2];
  const set=(key,val)=>setForm(v=>({...v,[key]:val}));

  const session=useMemo(()=>{
    const mins=form.time;
    const warm=Math.max(2,Math.round(mins*.15));
    const cool=Math.max(2,Math.round(mins*.15));
    const main=mins-warm-cool;
    const pool=libraries[form.mode];
    const rounds=form.intensity==="gentle"?2:form.intensity==="steady"?3:4;
    return {
      warm,main,cool,rounds,
      exercises: pool.slice(0, Math.min(pool.length, form.mode==="mobility"||form.mode==="adaptive"?5:4))
    };
  },[form]);

  const persistFeedback=(value)=>{
    setFeedback(value);
    const history=JSON.parse(localStorage.getItem("replay-feedback")||"[]");
    history.unshift({date:new Date().toISOString(),before:form.mood,goal:form.desired,after:value,mode:form.mode,time:form.time,vibe:form.vibe});
    localStorage.setItem("replay-feedback",JSON.stringify(history.slice(0,30)));
  };

  if(step===0) return <main className="shell hero">
    <header><div className="brand">RE:<b>PLAY</b><span>MOVE</span></div><button className="lang" onClick={()=>setLang(lang==="en"?"pt":"en")}>{lang==="en"?"PT":"EN"}</button></header>
    <section className="heroCard">
      <p className="eyebrow">MUSIC × MOVEMENT × FEELING</p>
      <h1>{t.tagline}</h1><p className="lead">{t.sub}</p>
      <div className="pulse"><span>♪</span><i></i><i></i><i></i><i></i><i></i></div>
      <button className="primary" onClick={()=>setStep(1)}>{t.start}<ArrowRight size={19}/></button>
    </section>
    <p className="micro">{t.note}</p>
  </main>;

  if(step===7) return <main className="shell">
    <Top lang={lang} setLang={setLang}/>
    <section className="result">
      <p className="eyebrow">{t.now}</p>
      <h2>{labels(desired.find(x=>x[0]===form.desired))} • {form.time} min</h2>
      <div className="soundtrack"><Music2/><div><b>{labels(vibes.find(x=>x[0]===form.vibe))}</b><span>Personal soundtrack prompt</span></div></div>
      <Timeline session={session} form={form}/>
      <button className="primary" onClick={()=>setStep(8)}><Play size={18}/>{t.finish}</button>
    </section>
  </main>;

  if(step===8) return <main className="shell">
    <Top lang={lang} setLang={setLang}/>
    <section className="feedback">
      <div className="bigIcon">✓</div><p className="eyebrow">{t.complete}</p><h2>{t.feedback}</h2>
      <div className="feedbackRow">{[["better","😊"],["same","😐"],["worse","😕"]].map(([v,e])=><button key={v} className={feedback===v?"picked":""} onClick={()=>persistFeedback(v)}>{e}</button>)}</div>
      <button className="secondary" onClick={()=>{setStep(1);setFeedback("")}}><RotateCcw size={18}/>{t.again}</button>
    </section>
  </main>;

  const screens=[
    {title:t.how,content:<Choices items={moods} value={form.mood} setValue={v=>set("mood",v)} labels={labels}/>},
    {title:t.want,content:<Choices items={desired} value={form.desired} setValue={v=>set("desired",v)} labels={labels}/>},
    {title:t.move,content:<ModeChoices items={modes} value={form.mode} setValue={v=>set("mode",v)} labels={labels}/>},
    {title:t.time,content:<div className="timeGrid">{times.map(v=><button className={form.time===v?"selected":""} onClick={()=>set("time",v)} key={v}><Clock3 size={18}/><b>{v}</b><span>min</span></button>)}</div>},
    {title:t.intensity,content:<TextChoices items={intensities} value={form.intensity} setValue={v=>set("intensity",v)} labels={labels}/>},
    {title:t.music,content:<TextChoices items={vibes} value={form.vibe} setValue={v=>set("vibe",v)} labels={labels}/>}
  ];
  const s=screens[step-1];

  return <main className="shell">
    <Top lang={lang} setLang={setLang}/>
    <section className="builder">
      <div className="progress"><span style={{width:`${step/6*100}%`}}/></div>
      <p className="step">{step}/6</p><h2>{s.title}</h2>{s.content}
      <div className="nav">
        <button className="back" onClick={()=>setStep(step-1)}><ArrowLeft size={18}/></button>
        <button className="primary" onClick={()=>setStep(step===6?7:step+1)}>{step===6?t.build:"Continue"}<ArrowRight size={18}/></button>
      </div>
    </section>
  </main>
}

function Top({lang,setLang}){return <header><div className="brand">RE:<b>PLAY</b><span>MOVE</span></div><button className="lang" onClick={()=>setLang(lang==="en"?"pt":"en")}>{lang==="en"?"PT":"EN"}</button></header>}

function Choices({items,value,setValue,labels}){return <div className="choiceGrid">{items.map(i=><button key={i[0]} className={value===i[0]?"selected":""} onClick={()=>setValue(i[0])}><span className="emoji">{i[3]}</span><b>{labels(i)}</b></button>)}</div>}
function ModeChoices({items,value,setValue,labels}){return <div className="modeGrid">{items.map(i=>{const Icon=i[3];return <button key={i[0]} className={value===i[0]?"selected":""} onClick={()=>setValue(i[0])}><Icon size={22}/><b>{labels(i)}</b></button>})}</div>}
function TextChoices({items,value,setValue,labels}){return <div className="stack">{items.map(i=><button key={i[0]} className={value===i[0]?"selected":""} onClick={()=>setValue(i[0])}>{labels(i)}<span>→</span></button>)}</div>}

function Timeline({session,form}){
  return <div className="timeline">
    <Phase n="01" title="Warm-up" mins={session.warm} detail="Easy rhythm + body prep"/>
    <Phase n="02" title="Main movement" mins={session.main} detail={session.exercises.join(" • ")}/>
    <Phase n="03" title="Play moment" mins={Math.max(1,Math.round(form.time*.08))} detail="Choose one move only because it feels fun."/>
    <Phase n="04" title="Reset" mins={session.cool} detail="Slow down + breathe + notice how you feel"/>
  </div>
}
function Phase({n,title,mins,detail}){return <div className="phase"><span>{n}</span><div><b>{title}</b><p>{detail}</p></div><em>{mins}m</em></div>}

export default App;