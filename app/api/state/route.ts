import { NextResponse, type NextRequest } from "next/server";
import { auth } from "../../../lib/auth/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// All profile traffic stays on this app's own domain. Neon checks the user's
// signed JWT and enforces row-level security on nutriquest_state.
async function context() {
  const session = await auth.getSession();
  if (session.error || !session.data?.user) {
    return { error: NextResponse.json({ error: "Faça login novamente para acessar sua conta." }, { status: 401 }) };
  }
  const result = await auth.token();
  const token = result.data?.token;
  if (result.error || typeof token !== "string" || !token) {
    console.error("NutriQuest auth token unavailable", result.error?.code ?? "no_token");
    return { error: NextResponse.json({ error: "Não foi possível confirmar sua sessão. Entre novamente." }, { status: 401 }) };
  }
  const base = process.env.NEXT_PUBLIC_NEON_DATA_API_URL;
  if (!base) {
    console.error("NutriQuest missing data URL");
    return { error: NextResponse.json({ error: "Serviço de dados indisponível." }, { status: 503 }) };
  }
  const url = new URL(base.replace(/\/$/, "") + "/nutriquest_state");
  url.searchParams.set("user_id", "eq." + session.data.user.id);
  return { token, url, userId: session.data.user.id };
}

export async function GET() {
  try {
    const ctx = await context();
    if ("error" in ctx) return ctx.error!;
    ctx.url.searchParams.set("select", "data");
    const response = await fetch(ctx.url, {
      method: "GET",
      headers: { Authorization: "Bearer " + ctx.token, Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("NutriQuest profile read", response.status);
      return NextResponse.json({ error: "Não foi possível consultar seus dados. Tente novamente." }, { status: 502 });
    }
    const rows: Array<{ data: unknown }> = await response.json();
    return NextResponse.json({ data: rows[0]?.data ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("NutriQuest profile read failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Falha na conexão com seus dados. Tente novamente." }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Prevent third-party sites from writing to an authenticated user profile.
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.nextUrl.host) {
      return NextResponse.json({ error: "Origem não autorizada." }, { status: 403 });
    }
    const raw = await request.text();
    if (raw.length > 100_000) return NextResponse.json({ error: "Dados muito grandes." }, { status: 413 });
    const state: unknown = JSON.parse(raw);
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }
    const ctx = await context();
    if ("error" in ctx) return ctx.error!;
    ctx.url.searchParams.set("on_conflict", "user_id");
    const response = await fetch(ctx.url, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + ctx.token,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: ctx.userId,
        data: state,
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("NutriQuest profile write", response.status);
      return NextResponse.json({ error: "Não foi possível salvar seus dados. Tente novamente." }, { status: 502 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("NutriQuest profile write failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Falha na conexão ao salvar. Tente novamente." }, { status: 502 });
  }
}
