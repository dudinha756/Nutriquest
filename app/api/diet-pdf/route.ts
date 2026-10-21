import { NextResponse, type NextRequest } from "next/server";
import { auth } from "../../../lib/auth/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_PDF_BYTES = 2_000_000;
const NO_STORE = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } as const;

function error(message:string,status:number){
 return NextResponse.json({error:message},{status,headers:NO_STORE});
}

function checkOrigin(request:NextRequest){
 const origin=request.headers.get("origin");
 if(!origin)return true;
 try{return new URL(origin).host===request.nextUrl.host}catch{return false}
}

async function profile(){
 const session=await auth.getSession();
 if(session.error||!session.data?.user?.id){
  return {response:error("Entre na sua conta para acessar o PDF.",401)};
 }
 const result=await auth.token();
 const token=result.data?.token;
 if(result.error||!token){
  return {response:error("Não foi possível autenticar sua sessão.",401)};
 }
 const endpoint=process.env.NEXT_PUBLIC_NEON_DATA_API_URL;
 if(!endpoint){
  return {response:error("Armazenamento temporariamente indisponível.",503)};
 }
 const url=new URL(endpoint.replace(/\/$/,"")+"/nutriquest_diet_pdfs");
 url.searchParams.set("user_id","eq."+session.data.user.id);
 return {url,token,userId:session.data.user.id};
}

type PdfRecord={filename:string;pdf_base64:string;size_bytes:number;uploaded_at:string};
const safeFileName=(name:string)=>name.replace(/[\\/\r\n\x00-\x1f\x7f"]/g,"").slice(0,120).trim();

export async function GET(request:NextRequest){
 try{
  const ctx=await profile();
  if("response" in ctx)return ctx.response!;
  const full=request.nextUrl.searchParams.get("mode");
  const isPdf=full==="inline"||full==="download";
  ctx.url.searchParams.set("select",isPdf?"filename,pdf_base64,size_bytes,uploaded_at":"filename,size_bytes,uploaded_at");
  const upstream=await fetch(ctx.url,{
   headers:{Authorization:"Bearer "+ctx.token,Accept:"application/json"},
   cache:"no-store"
  });
  if(!upstream.ok)return error("Não foi possível consultar seu PDF.",502);
  const rows=await upstream.json() as PdfRecord[];
  const pdf=rows[0];
  if(!pdf){
   if(isPdf)return error("Nenhum PDF armazenado nesta conta.",404);
   return NextResponse.json({file:null},{headers:NO_STORE});
  }
  if(!isPdf){
   return NextResponse.json({file:{name:pdf.filename,sizeBytes:pdf.size_bytes,uploadedAt:pdf.uploaded_at}},{headers:NO_STORE});
  }
  const bytes=Buffer.from(pdf.pdf_base64,"base64");
  if(bytes.length!==pdf.size_bytes||bytes.subarray(0,5).toString("ascii")!=="%PDF-"){
   return error("O documento armazenado está inválido.",502);
  }
  const name=safeFileName(pdf.filename)||"dieta.pdf";
  const contentDisposition=(full==="download"?"attachment":"inline")+"; filename=\"dieta.pdf\"; filename*=UTF-8''"+encodeURIComponent(name);
  return new NextResponse(new Uint8Array(bytes),{
   status:200,
   headers:{
    ...NO_STORE,
    "Content-Type":"application/pdf",
    "Content-Length":String(bytes.length),
    "Content-Disposition":contentDisposition
   }
  });
 }catch(err){
  console.error("NutriQuest PDF read failed",err instanceof Error?err.name:"error");
  return error("Falha na conexão com o armazenamento.",502);
 }
}

export async function POST(request:NextRequest){
 try{
  if(!checkOrigin(request))return error("Origem não autorizada.",403);
  const size=Number(request.headers.get("content-length")??0);
  if(size>MAX_PDF_BYTES)return error("O PDF precisa ter no máximo 2 MB.",413);
  const encodedName=request.headers.get("x-file-name");
  if(!encodedName)return error("Informe o nome do arquivo.",400);
  let name:string;
  try{name=safeFileName(decodeURIComponent(encodedName))}catch{return error("Nome de arquivo inválido.",400)}
  if(!name.toLowerCase().endsWith(".pdf"))return error("Selecione um documento PDF.",400);
  const file=Buffer.from(await request.arrayBuffer());
  if(file.length===0||file.length>MAX_PDF_BYTES)return error("O PDF precisa ter entre 1 byte e 2 MB.",413);
  if(file.subarray(0,5).toString("ascii")!=="%PDF-")return error("Este arquivo não é um PDF válido.",400);
  const ctx=await profile();
  if("response" in ctx)return ctx.response!;
  ctx.url.searchParams.set("on_conflict","user_id");
  const upstream=await fetch(ctx.url,{
   method:"POST",
   headers:{
    Authorization:"Bearer "+ctx.token,
    "Content-Type":"application/json",
    Prefer:"resolution=merge-duplicates,return=minimal"
   },
   body:JSON.stringify({
    user_id:ctx.userId,
    filename:name,
    pdf_base64:file.toString("base64"),
    size_bytes:file.length,
    uploaded_at:new Date().toISOString()
   }),
   cache:"no-store"
  });
  if(!upstream.ok){
   console.error("NutriQuest PDF write rejected",upstream.status);
   return error("Não foi possível salvar o PDF. Tente novamente.",502);
  }
  return NextResponse.json({file:{name,sizeBytes:file.length,uploadedAt:new Date().toISOString()}},{status:201,headers:NO_STORE});
 }catch(err){
  console.error("NutriQuest PDF write failed",err instanceof Error?err.name:"error");
  return error("Falha ao enviar o PDF.",502);
 }
}

export async function DELETE(request:NextRequest){
 try{
  if(!checkOrigin(request))return error("Origem não autorizada.",403);
  const ctx=await profile();
  if("response" in ctx)return ctx.response!;
  const upstream=await fetch(ctx.url,{
   method:"DELETE",
   headers:{Authorization:"Bearer "+ctx.token,Prefer:"return=minimal"},
   cache:"no-store"
  });
  if(!upstream.ok){
   console.error("NutriQuest PDF delete rejected",upstream.status);
   return error("Não foi possível excluir o PDF.",502);
  }
  return new NextResponse(null,{status:204,headers:NO_STORE});
 }catch(err){
  console.error("NutriQuest PDF delete failed",err instanceof Error?err.name:"error");
  return error("Falha na conexão ao excluir o PDF.",502);
 }
}
