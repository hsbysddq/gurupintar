import type { NextRequest } from 'next/server';
import { skemaQueryKelasSiswa } from '@/lib/skema-api';
import { anggotaKelas, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import { tentukanStatusMateriSiswa } from '@/lib/status-materi-siswa';
import {
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { Kelompok, SesiSiswa, StatusSesi } from '@/lib/tipe';

const PESAN_BUKAN_ANGGOTA = 'Kamu tidak terdaftar di kelas ini.';

type BarisSesi = {
  id: string;
  kode_kelas: string;
  status: string;
  dibuat_pada: string;
  topik: unknown;
};

type BarisHasil = { sesi_id: string; kelompok: Kelompok };
type BarisMateri = { sesi_id: string; kelompok: Kelompok };

function namaTopikDari(nilai: unknown): string {
  if (Array.isArray(nilai)) return (nilai[0] as { nama?: string } | undefined)?.nama ?? '';
  return (nilai as { nama?: string } | null)?.nama ?? '';
}

// GET /api/siswa/kelas/sesi?kelas=: riwayat sesi kelas untuk siswa, tanpa membocorkan kelompok.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryKelasSiswa.safeParse({
    kelas: request.nextUrl.searchParams.get('kelas') ?? '',
  });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    if (!(await anggotaKelas(db, auth.profil.id, input.data.kelas))) {
      return responsError(PESAN_BUKAN_ANGGOTA, 403);
    }

    const sesi = await db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, dibuat_pada, topik(nama)')
      .eq('kelas_id', input.data.kelas)
      .order('dibuat_pada', { ascending: false });
    if (sesi.error) return petakanErrorDb(sesi.error);

    const barisSesi = sesi.data as BarisSesi[];
    const idSesi = barisSesi.map((s) => s.id);
    if (idSesi.length === 0) return responsOk<SesiSiswa[]>([]);

    const [hasil, materi] = await Promise.all([
      db
        .from('hasil_siswa')
        .select('sesi_id, kelompok')
        .eq('siswa_id', auth.profil.id)
        .in('sesi_id', idSesi),
      db.from('materi').select('sesi_id, kelompok').in('sesi_id', idSesi).eq('status', 'dibagikan'),
    ]);
    if (hasil.error) return petakanErrorDb(hasil.error);
    if (materi.error) return petakanErrorDb(materi.error);

    const petaHasil = new Map(
      (hasil.data as BarisHasil[]).map((h) => [h.sesi_id, { kelompok: h.kelompok }] as const),
    );
    const materiPerSesi = new Map<string, { kelompok: Kelompok }[]>();
    for (const m of materi.data as BarisMateri[]) {
      const daftar = materiPerSesi.get(m.sesi_id) ?? [];
      daftar.push({ kelompok: m.kelompok });
      materiPerSesi.set(m.sesi_id, daftar);
    }

    const respons: SesiSiswa[] = barisSesi.map((s) => ({
      id: s.id,
      kodeKelas: s.kode_kelas,
      status: s.status as StatusSesi,
      dibuatPada: s.dibuat_pada,
      namaTopik: namaTopikDari(s.topik),
      statusMateri: tentukanStatusMateriSiswa(petaHasil.get(s.id), materiPerSesi.get(s.id) ?? []),
    }));

    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
