import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { miskonsepsiPerKelompok, tentukanTargetMateri } from '@/lib/rencana-materi';
import { skemaBodyBuatMateri, skemaBodyUbahMateri, skemaQueryMateriGuru } from '@/lib/skema-api';
import { periksaIsiMateri, type IsiMateri } from '@/lib/validasi-materi';
import { buatMateriSemua } from '@/lib/server/materi-ai';
import { ambilMateriCadangan } from '@/lib/server/materi-cadangan';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { Kelompok, MateriGuru, StatusMateri, SumberMateri } from '@/lib/tipe';

// Sedikit di atas BATAS_WAKTU_AI_MS (60 detik) agar API sempat membalas 502 (architecture.md 9.1).
export const maxDuration = 70;

const PESAN_SEDANG_DIBUAT = 'Materi sedang dibuat. Tunggu sebentar.';
const PESAN_GAGAL_DIBUAT = 'Materi belum berhasil dibuat.';
const PESAN_MATERI_BERUBAH = 'Materi sudah berubah. Muat ulang untuk melihat versi terbaru.';

const URUTAN_KELOMPOK: Kelompok[] = ['belum', 'setengah', 'sudah'];

type BarisMateri = { id: string; kelompok: Kelompok; isi: IsiMateri; status: StatusMateri; sumber: SumberMateri; versi: number };
type BarisHasil = { siswa_id: string; kelompok: Kelompok };

class KonflikMateri extends Error {}

/** Materi sesi beserta jumlah siswa per kelompok, urut Belum, Setengah, Sudah. */
async function bacaMateriSesi(db: SupabaseClient, sesiId: string) {
  const [materi, hasil] = await Promise.all([
    db.from('materi').select('id, kelompok, isi, status, sumber, versi').eq('sesi_id', sesiId),
    db.from('hasil_siswa').select('siswa_id, kelompok').eq('sesi_id', sesiId),
  ]);
  if (materi.error) throw materi.error;
  if (hasil.error) throw hasil.error;

  const barisHasil = hasil.data as BarisHasil[];
  const jumlahPerKelompok: Record<Kelompok, number> = { sudah: 0, setengah: 0, belum: 0 };
  for (const h of barisHasil) jumlahPerKelompok[h.kelompok] += 1;

  const daftar: MateriGuru[] = (materi.data as BarisMateri[])
    .map((m) => ({ ...m, jumlahSiswa: jumlahPerKelompok[m.kelompok] }))
    .sort((a, b) => URUTAN_KELOMPOK.indexOf(a.kelompok) - URUTAN_KELOMPOK.indexOf(b.kelompok));

  return { daftar, barisMateri: materi.data as BarisMateri[], barisHasil, jumlahPerKelompok };
}

async function cariSesi(db: SupabaseClient, sesiId: string) {
  const { data, error } = await db.from('sesi_kuis').select('id, topik_id').eq('id', sesiId).maybeSingle();
  if (error) throw error;
  return data as { id: string; topik_id: string } | null;
}

// GET /api/guru/materi?sesi= (PRD AC-6.5)
export async function GET(request: NextRequest) {
  const input = skemaQueryMateriGuru.safeParse({ sesi: request.nextUrl.searchParams.get('sesi') ?? '' });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    if (!(await cariSesi(db, input.data.sesi))) return responsError(PESAN_SESI_TIDAK_ADA, 404);
    const { daftar } = await bacaMateriSesi(db, input.data.sesi);
    return responsOk(daftar);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// POST /api/guru/materi (PRD F-6, architecture.md 7.3 dan 7.4)
export async function POST(request: Request) {
  const input = skemaBodyBuatMateri.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { sesiId, gunakanCadangan = false, ganti = false } = input.data;

  try {
    const db = ambilSupabase();
    const sesi = await cariSesi(db, sesiId);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const awal = await bacaMateriSesi(db, sesiId);
    const rencanaAwal = tentukanTargetMateri({ jumlahPerKelompok: awal.jumlahPerKelompok, materi: awal.barisMateri, ganti });
    if (!rencanaAwal.ok) return responsError(rencanaAwal.pesan, rencanaAwal.status);
    if (rencanaAwal.target.length === 0) return responsOk(awal.daftar);

    const kunci = await db.rpc('ambil_kunci_materi', { p_sesi: sesiId });
    if (kunci.error) return petakanErrorDb(kunci.error);
    if (kunci.data !== true) return responsError(PESAN_SEDANG_DIBUAT, 409);

    try {
      // Dihitung ulang setelah kunci didapat: proses lain mungkin baru selesai menyimpan materi.
      const kini = await bacaMateriSesi(db, sesiId);
      const rencana = tentukanTargetMateri({ jumlahPerKelompok: kini.jumlahPerKelompok, materi: kini.barisMateri, ganti });
      if (!rencana.ok) return responsError(rencana.pesan, rencana.status);
      if (rencana.target.length === 0) return responsOk(kini.daftar);

      let isiBaru: Partial<Record<Kelompok, IsiMateri>>;
      const sumber: SumberMateri = gunakanCadangan ? 'cadangan' : 'ai';
      if (gunakanCadangan) {
        isiBaru = Object.fromEntries(rencana.target.map((k) => [k, ambilMateriCadangan(k)]));
      } else {
        const [topik, soal, jawaban] = await Promise.all([
          db.from('topik').select('nama, capaian_pembelajaran').eq('id', sesi.topik_id).single(),
          db.from('soal').select('id, miskonsepsi').eq('topik_id', sesi.topik_id),
          db.from('jawaban').select('siswa_id, soal_id, pilihan, benar').eq('sesi_id', sesiId),
        ]);
        for (const r of [topik, soal, jawaban]) if (r.error) return petakanErrorDb(r.error);

        // Hanya teks miskonsepsi yang dikirim ke AI; nama dan ID siswa tidak (architecture.md 9.2).
        const miskonsepsi = miskonsepsiPerKelompok({
          hasil: kini.barisHasil.map((h) => ({ siswaId: h.siswa_id, kelompok: h.kelompok })),
          jawaban: jawaban.data!.map((j) => ({ siswaId: j.siswa_id, soalId: j.soal_id, pilihan: j.pilihan, benar: j.benar })),
          soal: soal.data!.map((s) => ({ id: s.id, miskonsepsi: (s.miskonsepsi ?? {}) as Record<string, string> })),
        });

        try {
          isiBaru = await buatMateriSemua(
            rencana.target.map((k) => ({
              kelompok: k,
              namaTopik: topik.data!.nama,
              capaianPembelajaran: topik.data!.capaian_pembelajaran,
              jumlahSiswa: kini.jumlahPerKelompok[k],
              miskonsepsi: miskonsepsi[k],
            })),
          );
        } catch (err) {
          console.error('Pembuatan materi AI gagal:', err instanceof Error ? err.message : err);
          return responsError(PESAN_GAGAL_DIBUAT, 502);
        }
      }

      // Semua isi sudah siap; baru ditulis ke database (semua atau tidak sama sekali untuk AI).
      for (const kelompok of rencana.target) {
        const isi = isiBaru[kelompok]!;
        const lama = kini.barisMateri.find((m) => m.kelompok === kelompok);
        if (lama) {
          // Versi dinaikkan, bukan diulang ke 1, agar editan dari tab lama tetap ditolak.
          const { data, error } = await db
            .from('materi')
            .update({ isi, sumber, versi: lama.versi + 1 })
            .eq('id', lama.id)
            .eq('versi', lama.versi)
            .eq('status', 'draf')
            .select('id');
          if (error) throw error;
          if (data.length === 0) throw new KonflikMateri();
        } else {
          const { error } = await db.from('materi').insert({ sesi_id: sesiId, kelompok, isi, sumber });
          if (error?.code === '23505') throw new KonflikMateri();
          if (error) throw error;
        }
      }

      const { daftar } = await bacaMateriSesi(db, sesiId);
      return responsOk(daftar);
    } finally {
      const lepas = await db.rpc('lepas_kunci_materi', { p_sesi: sesiId });
      if (lepas.error) console.error('Kunci materi gagal dilepas:', lepas.error.message);
    }
  } catch (err) {
    if (err instanceof KonflikMateri) return responsError(PESAN_MATERI_BERUBAH, 409);
    console.error(err);
    return petakanErrorDb(err);
  }
}

// PATCH /api/guru/materi (PRD AC-6.6, AC-6.7; optimistic locking architecture.md 7.4)
export async function PATCH(request: Request) {
  const input = skemaBodyUbahMateri.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const { id, versi } = input.data;

  const periksa = periksaIsiMateri(input.data.isi);
  if (!periksa.ok) return responsError(`Isi materi belum sesuai. ${periksa.alasan}`, 400);

  try {
    const { data, error } = await ambilSupabase()
      .from('materi')
      .update({ isi: periksa.isi, versi: versi + 1 })
      .eq('id', id)
      .eq('versi', versi)
      .eq('status', 'draf')
      .select('versi');
    if (error) return petakanErrorDb(error);
    if (data.length === 0) return responsError(PESAN_MATERI_BERUBAH, 409);
    return responsOk({ ok: true, versi: versi + 1 });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
