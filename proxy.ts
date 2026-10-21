import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/** Next.js 16: pengganti middleware.ts. Menyegarkan sesi Supabase dan redirect area terlarang. */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Semua path kecuali aset statis. Sertakan /api agar cookie sesi ikut disegarkan.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
