import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

function safeNext(request: NextRequest) {
  const candidate = request.nextUrl.searchParams.get("next");
  return candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/dashboard";
}

export async function proxy(request: NextRequest) {
  const { response, authenticated } = await updateSupabaseSession(request);
  const path = request.nextUrl.pathname;
  if (path.startsWith("/dashboard") && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (path === "/login" && authenticated) {
    return NextResponse.redirect(new URL(safeNext(request), request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
