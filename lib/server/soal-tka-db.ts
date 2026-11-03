import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalisasiTipeSoal } from '@/lib/soal-tka';
import type { DataPilihanSoal, Kelompok, TipeSoal } from '@/lib/tipe';

export const PESAN_MIGRASI_SOAL_TKA =
  'Fitur tipe soal TKA & gambar belum aktif di database. Jalankan supabase/migrasi-soal-tka.sql di SQL Editor Supabase.';

export function perluMigrasiSoalTka(err: unknown): boolean {
  const pesan =
    typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '';
  return (
    ((pesan.includes('tipe') || pesan.includes('gambar') || pesan.includes('belum_dinilai')) &&
      (pesan.includes('does not exist') || pesan.includes('schema cache'))) ||
    pesan.includes('soal_kunci_check') ||
    pesan.includes('jawaban_pilihan_check') ||
    (pesan.includes('simpan_nilai_esai') && pesan.includes('Could not find'))
  );
}

export interface BarisSoalLengkap {
  id: string;
  nomor: number;
  tipe: TipeSoal;
  teks: string;
  gambar: string | null;
  pilihan: DataPilihanSoal;
  kunci: string;
  miskonsepsi: Record<string, string>;
}

/** Membaca daftar soal satu topik lengkap dengan fallback otomatis bila migrasi belum dijalankan. */
export async function bacaSoalTopik(
  db: SupabaseClient,
  topikId: string,
  opsi: { sertakanRahasia: boolean },
): Promise<{ data: BarisSoalLengkap[] | null; error: unknown }> {
  const kolomBaru = opsi.sertakanRahasia
    ? 'id, nomor, tipe, teks, gambar, pilihan, kunci, miskonsepsi'
    : 'id, nomor, tipe, teks, gambar, pilihan';

  const penuh = await db.from('soal').select(kolomBaru).eq('topik_id', topikId).order('nomor');
  if (!penuh.error) {
    const baris = (penuh.data as unknown as Record<string, unknown>[]).map((s) => ({
      id: String(s.id ?? ''),
      nomor: Number(s.nomor),
      tipe: normalisasiTipeSoal(s.tipe),
      teks: String(s.teks ?? ''),
      gambar: typeof s.gambar === 'string' && s.gambar.length > 0 ? s.gambar : null,
      pilihan: s.pilihan as DataPilihanSoal,
      kunci: typeof s.kunci === 'string' ? s.kunci : '',
      miskonsepsi: ((s.miskonsepsi as Record<string, string> | null) ?? {}),
    }));
    return { data: baris, error: null };
  }

  if (!perluMigrasiSoalTka(penuh.error)) {
    return { data: null, error: penuh.error };
  }

  const kolomLama = opsi.sertakanRahasia
    ? 'id, nomor, teks, pilihan, kunci, miskonsepsi'
    : 'id, nomor, teks, pilihan';
  const cadangan = await db.from('soal').select(kolomLama).eq('topik_id', topikId).order('nomor');
  if (cadangan.error) return { data: null, error: cadangan.error };

  const baris = (cadangan.data as unknown as Record<string, unknown>[]).map((s) => ({
    id: String(s.id ?? ''),
    nomor: Number(s.nomor),
    tipe: 'pilgan' as const,
    teks: String(s.teks ?? ''),
    gambar: null,
    pilihan: s.pilihan as DataPilihanSoal,
    kunci: typeof s.kunci === 'string' ? s.kunci : '',
    miskonsepsi: ((s.miskonsepsi as Record<string, string> | null) ?? {}),
  }));
  return { data: baris, error: null };
}

export interface BarisJawabanLengkap {
  siswa_id: string;
  soal_id: string;
  pilihan: string;
  benar: boolean;
  belum_dinilai: boolean;
}

/** Membaca jawaban sesi (opsional difilter satu siswa) dengan fallback bila kolom `belum_dinilai` belum ada. */
export async function bacaJawabanSesi(
  db: SupabaseClient,
  sesiId: string,
  siswaId?: string,
): Promise<{ data: BarisJawabanLengkap[] | null; error: unknown }> {
  let queryBaru = db.from('jawaban').select('siswa_id, soal_id, pilihan, benar, belum_dinilai').eq('sesi_id', sesiId);
  if (siswaId) queryBaru = queryBaru.eq('siswa_id', siswaId);
  const penuh = await queryBaru;
  if (!penuh.error) {
    return {
      data: (penuh.data as BarisJawabanLengkap[]).map((j) => ({
        ...j,
        belum_dinilai: Boolean(j.belum_dinilai),
      })),
      error: null,
    };
  }

  if (!perluMigrasiSoalTka(penuh.error)) {
    return { data: null, error: penuh.error };
  }

  let queryLama = db.from('jawaban').select('siswa_id, soal_id, pilihan, benar').eq('sesi_id', sesiId);
  if (siswaId) queryLama = queryLama.eq('siswa_id', siswaId);
  const cadangan = await queryLama;
  if (cadangan.error) return { data: null, error: cadangan.error };

  return {
    data: (cadangan.data as Omit<BarisJawabanLengkap, 'belum_dinilai'>[]).map((j) => ({
      ...j,
      belum_dinilai: false,
    })),
    error: null,
  };
}

/** Menyimpan penilaian manual jawaban esai oleh guru beserta pembaruan skor & kelompok. */
export async function simpanNilaiEsai(
  db: SupabaseClient,
  input: {
    sesiId: string;
    siswaId: string;
    soalId: string;
    benar: boolean;
    skor: number;
    total: number;
    kelompok: Kelompok;
  },
): Promise<{ error: unknown }> {
  const rpc = await db.rpc('simpan_nilai_esai', {
    p_sesi: input.sesiId,
    p_siswa: input.siswaId,
    p_soal: input.soalId,
    p_benar: input.benar,
    p_skor: input.skor,
    p_total: input.total,
    p_kelompok: input.kelompok,
  });
  if (!rpc.error) return { error: null };
  if (!perluMigrasiSoalTka(rpc.error)) return { error: rpc.error };

  // Fallback langsung jika fungsi RPC belum dibuat tetapi kolom sudah tersedia.
  const updJawaban = await db
    .from('jawaban')
    .update({ benar: input.benar, belum_dinilai: false })
    .eq('sesi_id', input.sesiId)
    .eq('siswa_id', input.siswaId)
    .eq('soal_id', input.soalId);
  if (updJawaban.error) return { error: updJawaban.error };

  const updHasil = await db
    .from('hasil_siswa')
    .update({ skor: input.skor, total: input.total, kelompok: input.kelompok })
    .eq('sesi_id', input.sesiId)
    .eq('siswa_id', input.siswaId);
  if (updHasil.error) return { error: updHasil.error };

  const percobaanTerakhir = await db
    .from('percobaan_kuis')
    .select('id')
    .eq('sesi_id', input.sesiId)
    .eq('siswa_id', input.siswaId)
    .order('dikirim_pada', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!percobaanTerakhir.error && percobaanTerakhir.data?.id) {
    await db
      .from('percobaan_kuis')
      .update({ skor: input.skor, total: input.total, kelompok: input.kelompok })
      .eq('id', percobaanTerakhir.data.id);
  }
  return { error: null };
}

