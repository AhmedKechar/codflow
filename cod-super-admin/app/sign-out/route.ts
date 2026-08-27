import { initAuth } from "@/lib/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await initAuth();

  const signOutReq = new Request(
    new URL("/api/auth/sign-out", request.url).toString(),
    { method: "POST", headers: request.headers }
  );
  const signOutRes = await auth.handler(signOutReq);

  const responseHeaders = new Headers(signOutRes.headers);
  responseHeaders.set("Location", "/");
  return new Response(null, { status: 302, headers: responseHeaders });
}
