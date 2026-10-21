"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type StoredPdf={name:string;sizeBytes:number;uploadedAt:string};
const MAX_BYTES=2_000_000;
const formatBytes=(bytes:number)=>(bytes/1024/1024).toLocaleString("pt-BR",{maximumFractionDigits:2})+" MB";

export default function DietPdfManager(){
 const [saved,setSaved]=useState<StoredPdf|null>(null);
 const [selected,setSelected]=useState<File|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const inputRef=useRef<HTMLInputElement>(null);

 async function reload(){
  const result=await fetch("/api/diet-pdf",{credentials:"same-origin",cache:"no-store"});
  const json=await result.json() as {file?:StoredPdf|null;error?:string};
  if(!result.ok)throw new Error(json.error||"Não foi possível consultar o documento.");
  setSaved(json.file??null);
 }
 useEffect(()=>{
  let active=true;
  async function load(){
   try{
    const result=await fetch("/api/diet-pdf",{credentials:"same-origin",cache:"no-store"});
    const json=await result.json() as {file?:StoredPdf|null;error?:string};
    if(!active)return;
    if(!result.ok)throw new Error(json.error||"Não foi possível carregar seu PDF.");
    setSaved(json.file??null);
   }catch(err){
    if(active)setError(err instanceof Error?err.message:"Falha ao consultar seu PDF.");
   }finally{if(active)setLoading(false)}
  }
  void load();
  return ()=>{active=false};
 },[]);

 const choose=(file:File|null)=>{
  setMessage("");setError("");setSelected(null);
  if(!file)return;
  if(!file.name.toLowerCase().endsWith(".pdf")){
   setError("Selecione um arquivo com extensão .pdf.");
   if(inputRef.current)inputRef.current.value="";
   return;
  }
  if(file.size===0||file.size>MAX_BYTES){
   setError("O arquivo precisa ter no máximo 2 MB.");
   if(inputRef.current)inputRef.current.value="";
   return;
  }
  setSelected(file);
 };

 const upload=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!selected||busy)return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/diet-pdf",{
    method:"POST",
    credentials:"same-origin",
    headers:{"Content-Type":"application/pdf","X-File-Name":encodeURIComponent(selected.name)},
    body:selected,
   });
   const body=await response.json() as {error?:string};
   if(!response.ok)throw new Error(body.error||"Não foi possível enviar o PDF.");
   await reload();
   setSelected(null);
   if(inputRef.current)inputRef.current.value="";
   setMessage("PDF salvo na sua conta com sucesso!");
  }catch(err){
   setError(err instanceof Error?err.message:"Falha ao enviar o documento.");
  }finally{setBusy(false)}
 };
 const remove=async()=>{
  if(!saved||busy||!confirm("Excluir seu PDF da dieta? Esta ação não pode ser desfeita."))return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/diet-pdf",{method:"DELETE",credentials:"same-origin"});
   if(!response.ok){
    const body=await response.json().catch(()=>({error:"Falha ao excluir."})) as {error?:string};
    throw new Error(body.error||"Falha ao excluir.");
   }
   setSaved(null);
   setSelected(null);
   if(inputRef.current)inputRef.current.value="";
   setMessage("PDF excluído da sua conta.");
  }catch(err){
   setError(err instanceof Error?err.message:"Não foi possível excluir o PDF.");
  }finally{setBusy(false)}
 };

 return <section className="diet-pdf-card" aria-labelledby="diet-pdf-title">
  <div className="diet-pdf-heading">
   <div>
    <small>DOCUMENTOS DA MINHA DIETA</small>
    <h3 id="diet-pdf-title">PDF da minha dieta</h3>
    <p>Guarde seu plano alimentar em PDF para consultar pelo celular ou computador. Só sua conta poderá acessar o documento.</p>
   </div>
   <span className="diet-pdf-icon" aria-hidden="true">PDF</span>
  </div>
  {loading?<p className="diet-pdf-muted">Procurando seu documento salvo...</p>:
   saved?<div className="diet-pdf-saved">
    <div className="diet-pdf-file">
     <span className="diet-pdf-file-icon" aria-hidden="true">PDF</span>
     <div><strong>{saved.name}</strong>
      <small>{formatBytes(saved.sizeBytes)} · Adicionado em {new Date(saved.uploadedAt).toLocaleDateString("pt-BR")}</small></div>
    </div>
    <div className="diet-pdf-actions">
     <a href="/api/diet-pdf?mode=inline" target="_blank" rel="noopener noreferrer">Visualizar</a>
     <a href="/api/diet-pdf?mode=download">Baixar</a>
     <button type="button" className="diet-pdf-delete" disabled={busy} onClick={()=>{void remove()}}>Excluir</button>
    </div>
   </div>:
   <p className="diet-pdf-muted">Você ainda não enviou um PDF.</p>}
  <form onSubmit={e=>{void upload(e)}} className="diet-pdf-upload">
   <label htmlFor="diet-pdf-input">{saved?"Substituir documento":"Escolher PDF da dieta"}</label>
   <input id="diet-pdf-input" ref={inputRef} type="file" accept=".pdf,application/pdf" disabled={busy||loading}
    onChange={e=>choose(e.target.files?.[0]??null)} />
   <div className="diet-pdf-upload-bottom">
    <small>Arquivo PDF de até 2 MB. Um documento por usuário.</small>
    <button type="submit" className="primary" disabled={!selected||busy||loading}>{busy?"Salvando...":saved?"Substituir PDF":"Salvar meu PDF"}</button>
   </div>
  </form>
  {error&&<p className="diet-pdf-error" role="alert">{error}</p>}
  {message&&<p className="diet-pdf-success" role="status">{message}</p>}
  <p className="diet-pdf-note">O PDF fica armazenado na sua conta. O envio não transforma automaticamente o conteúdo em refeições ou cálculos da TACO.</p>
 </section>;
}
