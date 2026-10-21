import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { peranDariMetadata, tujuanSetelahMasuk } from '@/lib/auth';

const AREA_SISWA_API = ['/api/sesi', '/api/soal', '/api/jawaban', '/api/siswa', '/api/materi'];

function areaGuru(path: string): boolean {
  return path === '/guru' || path.startsWith('/guru/') || path.startsWith('/api/guru');
}

function areaSiswa(path: string): boolean {
  return (
    path === '/siswa' ||
    path.startsWith('/siswa/') ||
    AREA_SISWA_API.some((awal) => path === awal || path.startsWith(`${awal}/`))
  );
}

function salinCookie(asal: NextResponse, tujuan: NextResponse): NextResponse {
  for (const cookie of asal.cookies.getAll()) tujuan.cookies.set(cookie);
  for (const nama of ['cache-control', 'expires', 'pragma']) {
    const nilai = asal.headers.get(nama);
    if (nilai) tujuan.headers.set(nama, nilai);
  }
  return tujuan;
}

/**
 * Menyegarkan token Supabase dan melakukan pemeriksaan optimistis peran.
 * Otorisasi sebenarnya tetap dilakukan di layout dan API route (verifikasi ke server).
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !kunci) {
    return NextResponse.next({ request });
  }

  let respons = NextResponse.next({ request });
  const supabase = createServerClient(url, kunci, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (daftar) => {
        for (const { name, value } of daftar) request.cookies.set(name, value);
        respons = NextResponse.next({ request });
        for (const { name, value, options } of daftar) respons.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const klaim = data?.claims as Record<string, unknown> | undefined;
  const peran = peranDariMetadata(klaim?.app_metadata);
  const path = request.nextUrl.pathname;
  const api = path.startsWith('/api/');

  if (!klaim) {
    if (path === '/guru' || path.startsWith('/guru/') || path === '/siswa' || path.startsWith('/siswa/')) {
      const tujuan = new URL('/masuk', request.url);
      tujuan.searchParams.set('lanjut', `${path}${request.nextUrl.search}`);
      return salinCookie(respons, NextResponse.redirect(tujuan));
    }
    return respons;
  }

  if (!peran) {
    return api ? salinCookie(respons, NextResponse.json({ error: 'Peran akun tidak dikenal.' }, { status: 403 })) : respons;
  }

  if (peran === 'siswa' && areaGuru(path)) {
    if (api) return salinCookie(respons, NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 }));
    return salinCookie(respons, NextResponse.redirect(new URL('/siswa', request.url)));
  }

  if (peran === 'guru' && areaSiswa(path)) {
    if (api) return salinCookie(respons, NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 }));
    return salinCookie(respons, NextResponse.redirect(new URL(tujuanSetelahMasuk(peran), request.url)));
  }

  return respons;
}
