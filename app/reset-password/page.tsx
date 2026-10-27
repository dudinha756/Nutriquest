"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "../../lib/neon";

export default function ResetPasswordPage(){
 const [token,setToken]=useState("");
 const [ready,setReady]=useState(false);
 const [linkError,setLinkError]=useState(false);
 const [password,setPassword]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState(false);

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const resetToken=params.get("token")??"";
  setToken(resetToken);
  setLinkError(Boolean(params.get("error"))||!resetToken);
  setReady(true);
  // Don't retain a sensitive password-reset token in browser history.
  if(resetToken)window.history.replaceState(window.history.state,"",window.location.pathname);
 },[]);

 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(busy||!token)return;
  setError("");
  if(password.length<8||password.length>128){
   setError("Sua nova senha deve conter entre 8 e 128 caracteres.");
   return;
  }
  if(password!==confirmation){
   setError("As senhas não coincidem. Confira os dois campos.");
   return;
  }
  setBusy(true);
  try{
   const result=await authClient.resetPassword({newPassword:password,token});
   if(result.error)throw new Error(result.error.message||"O link é inválido ou expirou. Solicite outro e-mail.");
   setSuccess(true);
   setPassword("");
   setConfirmation("");
   setToken("");
  }catch(err){
   setError(err instanceof Error?err.message:"Não foi possível redefinir sua senha. Solicite outro link.");
  }finally{
   setBusy(false);
  }
 };

 return <main className="authscreen">
  <section className="authcard">
   <div className="authlogo">🥗</div>
   <h1>{success?"Senha alterada!":"Criar nova senha"}</h1>
   <p className="authsubtitle">{success?"Sua senha foi atualizada. Agora você pode entrar no NutriQuest.":"Escolha uma senha segura para continuar utilizando sua conta."}</p>
   {!ready?<p className="authnotice" role="status">Verificando link de recuperação...</p>:
    linkError?<div className="autherror" role="alert">O link de recuperação está inválido ou expirou. Solicite um novo link na tela de login.</div>:
    success?<p className="authnotice" role="status">Pronto! Sua nova senha foi cadastrada com sucesso.</p>:
    <form onSubmit={submit}>
     <label>Nova senha
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Mínimo de 8 caracteres" required/>
     </label>
     <label>Confirmar nova senha
      <input type="password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Repita a nova senha" required/>
     </label>
     {error&&<div className="autherror" role="alert">{error}</div>}
     <button type="submit" className="authsubmit" disabled={busy}>{busy?"Salvando...":"Redefinir senha"}</button>
    </form>}
   <a className="auth-return-link" href="/">Voltar ao login do NutriQuest</a>
   <p className="authfoot">Nunca compartilhe sua senha ou seu link de recuperação.</p>
  </section>
 </main>;
}
