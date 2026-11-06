import { skemaBodyAudio } from '@/lib/skema-api';
import { ambilProfil } from '@/lib/server/auth';
import {
  ambilAtauBuatAudio,
  ErrorAudioAi,
  PESAN_AUDIO_BELUM_SIAP,
} from '@/lib/server/audio-gemini';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  petakanErrorDb,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import { lengkapiIsiMateri } from '@/lib/validasi-materi';
import type { GayaAudio } from '@/lib/tipe';

export const runtime = 'nodejs';
export const maxDuration = 120;

const PESAN_AKSES_DITOLAK = 'Kamu tidak punya akses ke materi ini.';
const PESAN_MATERI_TIDAK_ADA = 'Materi belum tersedia.';
const PESAN_GAGAL = 'Suara natural belum berhasil dibuat. Coba lagi sebentar.';

async function naskahSiswa(profilId: string, sesiId: string): Promise<{ teks: string; gaya: GayaAudio } | Response> {
  const db = ambilSupabase();
  const sesi = await db.from('sesi_kuis').select('kelas_id').eq('id', sesiId).maybeSingle();
  if (sesi.error) return petakanErrorDb(sesi.error);
  if (!sesi.data) return responsError(PESAN_SESI_TIDAK_ADA, 404);

  const anggota = await db
    .from('keanggotaan_kelas')
    .select('kelas_id')
    .eq('kelas_id', sesi.data.kelas_id)
    .eq('siswa_id', profilId)
    .maybeSingle();
  if (anggota.error) return petakanErrorDb(anggota.error);
  if (!anggota.data) return responsError(PESAN_AKSES_DITOLAK, 403);

  const hasil = await db
    .from('hasil_siswa')
    .select('kelompok')
    .eq('sesi_id', sesiId)
    .eq('siswa_id', profilId)
    .maybeSingle();
  if (hasil.error) return petakanErrorDb(hasil.error);
  if (!hasil.data) return responsError(PESAN_MATERI_TIDAK_ADA, 404);

  const materi = await db
    .from('materi')
    .select('isi')
    .eq('sesi_id', sesiId)
    .eq('kelompok', hasil.data.kelompok)
    .eq('status', 'dibagikan')
    .maybeSingle();
  if (materi.error) return petakanErrorDb(materi.error);
  if (!materi.data) return responsError(PESAN_MATERI_TIDAK_ADA, 404);

  const isi = lengkapiIsiMateri(materi.data.isi);
  return {
    teks: isi.naskah_audio,
    gaya: isi.gaya_audio ?? 'docu',
  };
}

// POST /api/audio: buat audio Gemini sekali, lalu ambil dari cache Supabase Storage.
export async function POST(request: Request) {
  const profil = await ambilProfil();
  if (!profil) return responsError('Masuk dulu untuk memutar audio.', 401);

  const input = skemaBodyAudio.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  let teks: string;
  let gaya: GayaAudio;

  if (input.data.sumber === 'guru') {
    if (profil.peran !== 'guru') return responsError(PESAN_AKSES_DITOLAK, 403);
    teks = input.data.teks;
    gaya = input.data.gaya;
  } else {
    if (profil.peran !== 'siswa') return responsError(PESAN_AKSES_DITOLAK, 403);
    const hasil = await naskahSiswa(profil.id, input.data.sesi);
    if (hasil instanceof Response) return hasil;
    teks = hasil.teks;
    gaya = hasil.gaya;
  }

  try {
    const url = await ambilAtauBuatAudio(ambilSupabase(), teks, gaya);
    return responsOk({ url });
  } catch (err) {
    if (err instanceof ErrorAudioAi) {
      console.error('Audio Gemini gagal:', err.message);
      return responsError(
        err.pesanAman === PESAN_AUDIO_BELUM_SIAP ? PESAN_AUDIO_BELUM_SIAP : PESAN_GAGAL,
        err.pesanAman === PESAN_AUDIO_BELUM_SIAP ? 503 : 502,
      );
    }
    console.error('Error /api/audio:', err instanceof Error ? err.message : err);
    return petakanErrorDb(err);
  }
}
