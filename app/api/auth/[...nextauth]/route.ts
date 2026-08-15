import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

type AuthRequest = Parameters<typeof handlers.GET>[0];

export function GET(request: NextRequest) {
  return handlers.GET(request as unknown as AuthRequest);
}

export function POST(request: NextRequest) {
  return handlers.POST(request as unknown as AuthRequest);
}
