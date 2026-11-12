import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { KARAKTER_KODE } from '@/lib/konstanta';
import { bolehPakaiTopik } from '@/lib/topik';
import {
  hitungBatasPeserta,
  hitungNilaiUjian,
  nilaiSatuJawaban,
  normalisasiTokenUjian,
  statusUjianEfektif,
  tokenUjianValid,
  type SoalUjianUntukNilai,
} from '@/lib/ujian';
import type {
  HasilUjianSiswa,
  JawabanEsaiUjianGuru,
  PesertaUjianGuru,
  SoalUjianGuru,
  SoalUjianSiswa,
  StatusPesertaUjian,
  TipeSoalUjian,
  UjianDetailGuru,
  UjianRingkas,
  UjianSiswa,
} from '@/lib/tipe';
import { anggotaKelas, GalatAuth } from './auth';
import { bacaSoalTopik } from './soal-tka-db';
import { ambilSupabase } from './supabase';

const TIPE_UJIAN = new Set<TipeSoalUjian>(['pilgan', 'pilgan_kompleks', 'esai']);
const PESAN_UJIAN_TIDAK_ADA = 'Ujian tidak ditemukan.';
const PESAN_UJIAN_TUTUP = 'Ujian ini sudah ditutup.';
const PESAN_TOKEN_SALAH = 'Token ujian salah.';
const PESAN_DIBLOKIR = 'Ujianmu diblokir. Hubungi admin sekolah untuk membukanya.';

type BarisUjian = {
  id: string;
  sekolah_id: string;
  kelas_id: string;
  guru_id: string;
  judul: string;
  deskripsi: string | null;
  token: string;
  mulai_pada: string;
  selesai_pada: string;
  durasi_menit: number;
  status: string;
  dirilis_pada: string | null;
  kelas: { nama: string } | { nama: string }[] | null;
};

type BarisPeserta = {
  ujian_id: string;
  siswa_id: string;
  status: StatusPesertaUjian;
  mulai_pada: string | null;
  batas_pada: string | null;
  dikumpulkan_pada: string | null;
  percobaan_token: number;
  jumlah_pelanggaran: number;
  skor_bobot: number;
  total_bobot: number;
  persen: number | null;
};

function namaKelas(nilai: BarisUjian['kelas']): string {
  return Array.isArray(nilai) ? (nilai[0]?.nama ?? '') : (nilai?.nama ?? '');
}

function tokenBaru(): string {
  let hasil = '';
  for (let i = 0; i < 8; i++) hasil += KARAKTER_KODE[Math.floor(Math.random() * KARAKTER_KODE.length)];
  return hasil;
}

function acak<T>(daftar: T[]): T[] {
  const salinan = [...daftar];
  for (let i = salinan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  }
  return salinan;
}

async function ambilUjianGuru(db: SupabaseClient, guruId: string, sekolahId: string, ujianId: string): Promise<BarisUjian> {
  const { data, error } = await db
    .from('ujian')
    .select('*, kelas(nama)')
    .eq('id', ujianId)
    .eq('guru_id', guruId)
    .eq('sekolah_id', sekolahId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new GalatAuth(PESAN_UJIAN_TIDAK_ADA, 404);
  return data as BarisUjian;
}

async function ambilPeserta(
  db: SupabaseClient,
  ujianId: string,
  siswaId: string,
): Promise<BarisPeserta | null> {
  const { data, error } = await db
    .from('ujian_peserta')
    .select('*')
    .eq('ujian_id', ujianId)
    .eq('siswa_id', siswaId)
    .maybeSingle();
  if (error) throw error;
  return (data as BarisPeserta | null) ?? null;
}

async function ringkasUjian(db: SupabaseClient, ujian: BarisUjian): Promise<UjianRingkas> {
  const { data, error } = await db
    .from('ujian_peserta')
    .select('status')
    .eq('ujian_id', ujian.id);
  if (error) throw error;
  const status = (data as { status: StatusPesertaUjian }[]).map((p) => p.status);
  return {
    id: ujian.id,
    judul: ujian.judul,
    kelasId: ujian.kelas_id,
    namaKelas: namaKelas(ujian.kelas),
    status: statusUjianEfektif(
      ujian.status as UjianRingkas['status'],
      ujian.mulai_pada,
      ujian.selesai_pada,
    ),
    token: ujian.token,
    mulaiPada: ujian.mulai_pada,
    selesaiPada: ujian.selesai_pada,
    durasiMenit: ujian.durasi_menit,
    jumlahPeserta: status.length,
    jumlahMengerjakan: status.filter((s) => s === 'mengerjakan').length,
    jumlahSelesai: status.filter((s) => s === 'selesai').length,
    jumlahDiblokir: status.filter((s) => s === 'diblokir').length,
    dirilisPada: ujian.dirilis_pada,
  };
}

export async function buatUjian(
  guruId: string,
  sekolahId: string,
  input: {
    kelasId: string;
    topikId: string;
    judul: string;
    deskripsi?: string;
    token?: string;
    mulaiPada: string;
    selesaiPada: string;
    durasiMenit: number;
    acakSoal?: boolean;
    soal: { soalId: string; bobot: number }[];
  },
): Promise<UjianRingkas> {
  const db = ambilSupabase();
  const { data: kelas, error: galatKelas } = await db
    .from('kelas')
    .select('id, nama')
    .eq('id', input.kelasId)
    .eq('guru_id', guruId)
    .eq('sekolah_id', sekolahId)
    .maybeSingle();
  if (galatKelas) throw galatKelas;
  if (!kelas) throw new GalatAuth('Kelas tidak ditemukan.', 404);

  const { data: topik, error: galatTopik } = await db
    .from('topik')
    .select('id, dibuat_oleh')
    .eq('id', input.topikId)
    .maybeSingle();
  if (galatTopik) throw galatTopik;
  if (!topik || !bolehPakaiTopik({ id: topik.id, dibuatOleh: topik.dibuat_oleh }, guruId)) {
    throw new GalatAuth('Topik tidak ditemukan.', 404);
  }

  const muatan = await bacaSoalTopik(db, input.topikId, { sertakanRahasia: true });
  if (muatan.error || !muatan.data) throw muatan.error ?? new Error('Soal tidak bisa dibaca.');
  const petaSoal = new Map(muatan.data.map((s) => [s.id, s]));

  const dipilih = input.soal.map((item) => {
    const soal = petaSoal.get(item.soalId);
    if (!soal || !TIPE_UJIAN.has(soal.tipe as TipeSoalUjian)) {
      throw new GalatAuth('Ada soal yang tidak didukung untuk ujian.', 400);
    }
    return { soal, bobot: item.bobot };
  });
  if (dipilih.length === 0) throw new GalatAuth('Pilih minimal satu soal.', 400);

  const token = input.token ? normalisasiTokenUjian(input.token) : tokenBaru();
  if (!tokenUjianValid(token)) throw new GalatAuth('Token ujian tidak valid.', 400);

  const status =
    Date.parse(input.mulaiPada) <= Date.now() && Date.parse(input.selesaiPada) > Date.now()
      ? 'aktif'
      : 'terjadwal';

  const { data: ujian, error: galatUjian } = await db
    .from('ujian')
    .insert({
      sekolah_id: sekolahId,
      kelas_id: input.kelasId,
      guru_id: guruId,
      judul: input.judul,
      deskripsi: input.deskripsi ?? null,
      token,
      mulai_pada: input.mulaiPada,
      selesai_pada: input.selesaiPada,
      durasi_menit: input.durasiMenit,
      acak_soal: Boolean(input.acakSoal),
      status,
    })
    .select('*, kelas(nama)')
    .single();
  if (galatUjian) {
    if (galatUjian.message.includes('duplicate') || galatUjian.message.includes('unique')) {
      throw new GalatAuth('Token ujian sudah dipakai. Coba token lain.', 409);
    }
    throw galatUjian;
  }

  const urutan = input.acakSoal ? acak(dipilih) : dipilih;
  const { error: galatSoal } = await db.from('ujian_soal').insert(
    urutan.map(({ soal, bobot }, i) => ({
      ujian_id: ujian.id,
      soal_id: soal.id,
      nomor: i + 1,
      tipe: soal.tipe,
      teks: soal.teks,
      gambar: soal.gambar,
      pilihan: soal.pilihan,
      kunci: soal.kunci,
      miskonsepsi: soal.miskonsepsi,
      bobot,
    })),
  );
  if (galatSoal) {
    await db.from('ujian').delete().eq('id', ujian.id);
    throw galatSoal;
  }

  const { data: anggota, error: galatAnggota } = await db
    .from('keanggotaan_kelas')
    .select('siswa_id')
    .eq('kelas_id', input.kelasId);
  if (galatAnggota) {
    await db.from('ujian').delete().eq('id', ujian.id);
    throw galatAnggota;
  }

  if (anggota.length > 0) {
    const { error: galatPeserta } = await db.from('ujian_peserta').insert(
      anggota.map((a) => ({
        ujian_id: ujian.id,
        siswa_id: a.siswa_id,
        sekolah_id: sekolahId,
        status: 'belum',
      })),
    );
    if (galatPeserta) {
      await db.from('ujian').delete().eq('id', ujian.id);
      throw galatPeserta;
    }
  }

  return ringkasUjian(db, ujian as BarisUjian);
}

export async function daftarUjianGuru(guruId: string, sekolahId: string): Promise<UjianRingkas[]> {
  const db = ambilSupabase();
  const { data, error } = await db
    .from('ujian')
    .select('*, kelas(nama)')
    .eq('guru_id', guruId)
    .eq('sekolah_id', sekolahId)
    .order('dibuat_pada', { ascending: false });
  if (error) throw error;
  return Promise.all((data as BarisUjian[]).map((u) => ringkasUjian(db, u)));
}

export async function detailUjianGuru(
  guruId: string,
  sekolahId: string,
  ujianId: string,
): Promise<UjianDetailGuru> {
  const db = ambilSupabase();
  const ujian = await ambilUjianGuru(db, guruId, sekolahId, ujianId);
  const [{ data: soal, error: galatSoal }, { data: peserta, error: galatPeserta }] = await Promise.all([
    db.from('ujian_soal').select('id, nomor, tipe, teks, gambar, pilihan, bobot').eq('ujian_id', ujianId).order('nomor'),
    db.from('ujian_peserta').select('*, pengguna(nama)').eq('ujian_id', ujianId),
  ]);
  if (galatSoal) throw galatSoal;
  if (galatPeserta) throw galatPeserta;

  const pesertaGuru: PesertaUjianGuru[] = (
    peserta as (BarisPeserta & { pengguna: { nama: string } | { nama: string }[] | null })[]
  ).map((p) => ({
    siswaId: p.siswa_id,
    nama: Array.isArray(p.pengguna) ? (p.pengguna[0]?.nama ?? 'Siswa') : (p.pengguna?.nama ?? 'Siswa'),
    status: p.status,
    mulaiPada: p.mulai_pada,
    batasPada: p.batas_pada,
    dikumpulkanPada: p.dikumpulkan_pada,
    skor: Number(p.skor_bobot),
    total: Number(p.total_bobot),
    persen: p.persen === null ? null : Number(p.persen),
    jumlahPelanggaran: p.jumlah_pelanggaran,
  }));

  const soalGuru = (soal as SoalUjianGuru[]).map((s) => ({ ...s, bobot: Number(s.bobot) }));
  const idEsai = soalGuru.filter((s) => s.tipe === 'esai').map((s) => s.id);
  let esai: JawabanEsaiUjianGuru[] = [];
  if (idEsai.length > 0) {
    const { data: jawabanEsai, error: galatEsai } = await db
      .from('ujian_jawaban')
      .select('soal_id, siswa_id, jawaban, benar')
      .eq('ujian_id', ujianId)
      .in('soal_id', idEsai);
    if (galatEsai) throw galatEsai;
    const petaNomor = new Map(soalGuru.map((s) => [s.id, s.nomor]));
    const petaNama = new Map(pesertaGuru.map((p) => [p.siswaId, p.nama]));
    esai = (jawabanEsai as { soal_id: string; siswa_id: string; jawaban: string; benar: boolean | null }[])
      .map((j) => ({
        soalId: j.soal_id,
        nomorSoal: petaNomor.get(j.soal_id) ?? 0,
        siswaId: j.siswa_id,
        namaSiswa: petaNama.get(j.siswa_id) ?? 'Siswa',
        jawaban: j.jawaban,
        benar: j.benar,
      }))
      .sort((a, b) => Number(a.benar !== null) - Number(b.benar !== null) || a.nomorSoal - b.nomorSoal);
  }

  return {
    ujian: await ringkasUjian(db, ujian),
    soal: soalGuru,
    peserta: pesertaGuru.sort((a, b) => a.nama.localeCompare(b.nama, 'id')),
    esai,
  };
}

export async function mulaiUjian(
  siswaId: string,
  ujianId: string,
  tokenMasuk: string,
): Promise<{ soal: SoalUjianSiswa[]; batasPada: string; status: StatusPesertaUjian; jawaban: Record<string, string> }> {
  const db = ambilSupabase();
  const { data: ujian, error } = await db
    .from('ujian')
    .select('*, kelas(nama)')
    .eq('id', ujianId)
    .maybeSingle();
  if (error) throw error;
  if (!ujian) throw new GalatAuth(PESAN_UJIAN_TIDAK_ADA, 404);

  const status = statusUjianEfektif(
    (ujian as BarisUjian).status as UjianRingkas['status'],
    (ujian as BarisUjian).mulai_pada,
    (ujian as BarisUjian).selesai_pada,
  );
  if (status === 'terjadwal') throw new GalatAuth('Ujian belum dibuka.', 409);
  if (status !== 'aktif') throw new GalatAuth(PESAN_UJIAN_TUTUP, 409);
  if (!(await anggotaKelas(db, siswaId, (ujian as BarisUjian).kelas_id))) {
    throw new GalatAuth('Kamu tidak terdaftar di kelas ujian ini.', 403);
  }

  const peserta = await ambilPeserta(db, ujianId, siswaId);
  if (!peserta) throw new GalatAuth('Kamu bukan peserta ujian ini.', 403);
  if (peserta.status === 'diblokir') throw new GalatAuth(PESAN_DIBLOKIR, 423);
  if (peserta.status === 'selesai') throw new GalatAuth('Ujian ini sudah kamu kumpulkan.', 409);

  if (peserta.status === 'belum') {
    if (normalisasiTokenUjian(tokenMasuk) !== (ujian as BarisUjian).token) {
      const percobaan = peserta.percobaan_token + 1;
      const diblokir = percobaan >= 5;
      await db
        .from('ujian_peserta')
        .update({
          percobaan_token: percobaan,
          ...(diblokir ? { status: 'diblokir', jumlah_pelanggaran: 0 } : {}),
        })
        .eq('ujian_id', ujianId)
        .eq('siswa_id', siswaId);
      if (diblokir) throw new GalatAuth('Terlalu banyak percobaan token. Hubungi admin sekolah.', 423);
      throw new GalatAuth(PESAN_TOKEN_SALAH, 400);
    }

    const mulai = new Date().toISOString();
    const batas = hitungBatasPeserta(mulai, (ujian as BarisUjian).durasi_menit, (ujian as BarisUjian).selesai_pada);
    const { error: galatMulai } = await db
      .from('ujian_peserta')
      .update({
        status: 'mengerjakan',
        token_diverifikasi_pada: mulai,
        mulai_pada: mulai,
        batas_pada: batas,
        percobaan_token: 0,
      })
      .eq('ujian_id', ujianId)
      .eq('siswa_id', siswaId);
    if (galatMulai) throw galatMulai;
    return {
      soal: await bacaSoalUjianSiswa(db, ujianId),
      batasPada: batas,
      status: 'mengerjakan',
      jawaban: {},
    };
  }

  if (!peserta.batas_pada || Date.parse(peserta.batas_pada) <= Date.now()) {
    throw new GalatAuth('Waktu ujian sudah habis.', 409);
  }
  return {
    soal: await bacaSoalUjianSiswa(db, ujianId),
    batasPada: peserta.batas_pada,
    status: 'mengerjakan',
    jawaban: await bacaJawabanUjianSiswa(db, ujianId, siswaId),
  };
}

async function bacaJawabanUjianSiswa(
  db: SupabaseClient,
  ujianId: string,
  siswaId: string,
): Promise<Record<string, string>> {
  const { data, error } = await db
    .from('ujian_jawaban')
    .select('soal_id, jawaban')
    .eq('ujian_id', ujianId)
    .eq('siswa_id', siswaId);
  if (error) throw error;
  return Object.fromEntries((data as { soal_id: string; jawaban: string }[]).map((j) => [j.soal_id, j.jawaban]));
}

async function bacaSoalUjianSiswa(db: SupabaseClient, ujianId: string): Promise<SoalUjianSiswa[]> {
  const { data, error } = await db
    .from('ujian_soal')
    .select('id, nomor, tipe, teks, gambar, pilihan')
    .eq('ujian_id', ujianId)
    .order('nomor');
  if (error) throw error;
  return data as SoalUjianSiswa[];
}

export async function soalUjianSiswa(
  siswaId: string,
  ujianId: string,
): Promise<{ soal: SoalUjianSiswa[]; batasPada: string; jawaban: Record<string, string> }> {
  const db = ambilSupabase();
  const peserta = await ambilPeserta(db, ujianId, siswaId);
  if (!peserta) throw new GalatAuth('Kamu bukan peserta ujian ini.', 403);
  if (peserta.status === 'diblokir') throw new GalatAuth(PESAN_DIBLOKIR, 423);
  if (peserta.status !== 'mengerjakan' || !peserta.batas_pada) {
    throw new GalatAuth('Ujian belum dimulai atau sudah dikumpulkan.', 409);
  }
  if (Date.parse(peserta.batas_pada) <= Date.now()) throw new GalatAuth('Waktu ujian sudah habis.', 409);
  return {
    soal: await bacaSoalUjianSiswa(db, ujianId),
    batasPada: peserta.batas_pada,
    jawaban: await bacaJawabanUjianSiswa(db, ujianId, siswaId),
  };
}

export async function simpanJawabanUjian(
  siswaId: string,
  ujianId: string,
  soalId: string,
  jawaban: string,
): Promise<{ ok: true }> {
  const db = ambilSupabase();
  const peserta = await ambilPeserta(db, ujianId, siswaId);
  if (!peserta) throw new GalatAuth('Kamu bukan peserta ujian ini.', 403);
  if (peserta.status === 'diblokir') throw new GalatAuth(PESAN_DIBLOKIR, 423);
  if (peserta.status !== 'mengerjakan' || !peserta.batas_pada) {
    throw new GalatAuth('Ujian belum dimulai atau sudah dikumpulkan.', 409);
  }
  if (Date.parse(peserta.batas_pada) <= Date.now()) throw new GalatAuth('Waktu ujian sudah habis.', 409);

  const { data: soal, error } = await db
    .from('ujian_soal')
    .select('id, tipe, pilihan, kunci, bobot')
    .eq('id', soalId)
    .eq('ujian_id', ujianId)
    .maybeSingle();
  if (error) throw error;
  if (!soal) throw new GalatAuth('Soal bukan bagian dari ujian ini.', 400);

  const nilai = nilaiSatuJawaban(
    { id: soal.id, tipe: soal.tipe as TipeSoalUjian, pilihan: soal.pilihan, kunci: soal.kunci, bobot: Number(soal.bobot) },
    { soalId, jawaban },
  );
  const { error: galatSimpan } = await db.from('ujian_jawaban').upsert(
    {
      ujian_id: ujianId,
      siswa_id: siswaId,
      soal_id: soalId,
      jawaban,
      benar: nilai.benar,
      bobot_didapat: nilai.bobotDidapat,
    },
    { onConflict: 'ujian_id,siswa_id,soal_id' },
  );
  if (galatSimpan) throw galatSimpan;
  return { ok: true };
}

async function nilaiUlangPeserta(db: SupabaseClient, ujianId: string, siswaId: string): Promise<void> {
  const [{ data: soal, error: galatSoal }, { data: jawaban, error: galatJawaban }] = await Promise.all([
    db.from('ujian_soal').select('id, tipe, pilihan, kunci, bobot').eq('ujian_id', ujianId),
    db.from('ujian_jawaban').select('soal_id, jawaban, benar, bobot_didapat').eq('ujian_id', ujianId).eq('siswa_id', siswaId),
  ]);
  if (galatSoal) throw galatSoal;
  if (galatJawaban) throw galatJawaban;

  const hasil = hitungNilaiUjian(
    (soal as SoalUjianUntukNilai[]).map((s) => ({ ...s, bobot: Number(s.bobot) })),
    (jawaban as { soal_id: string; jawaban: string; benar: boolean | null; bobot_didapat: number }[]).map((j) => ({
      soalId: j.soal_id,
      jawaban: j.jawaban,
      benar: j.benar,
      bobotDidapat: Number(j.bobot_didapat),
    })),
  );
  const { error } = await db
    .from('ujian_peserta')
    .update({ skor_bobot: hasil.skor, total_bobot: hasil.total, persen: hasil.persen })
    .eq('ujian_id', ujianId)
    .eq('siswa_id', siswaId);
  if (error) throw error;
}

export async function selesaikanUjian(siswaId: string, ujianId: string): Promise<{ ok: true }> {
  const db = ambilSupabase();
  const peserta = await ambilPeserta(db, ujianId, siswaId);
  if (!peserta) throw new GalatAuth('Kamu bukan peserta ujian ini.', 403);
  if (peserta.status === 'selesai') return { ok: true };
  if (peserta.status !== 'mengerjakan') throw new GalatAuth('Ujian belum dimulai.', 409);

  await nilaiUlangPeserta(db, ujianId, siswaId);
  const { error } = await db
    .from('ujian_peserta')
    .update({ status: 'selesai', dikumpulkan_pada: new Date().toISOString() })
    .eq('ujian_id', ujianId)
    .eq('siswa_id', siswaId);
  if (error) throw error;
  return { ok: true };
}

export async function catatPelanggaranUjian(
  siswaId: string,
  ujianId: string,
  jenis: string,
): Promise<{ terblokir: boolean; jumlah: number }> {
  const db = ambilSupabase();
  const peserta = await ambilPeserta(db, ujianId, siswaId);
  if (!peserta) throw new GalatAuth('Kamu bukan peserta ujian ini.', 403);
  if (peserta.status !== 'mengerjakan') return { terblokir: peserta.status === 'diblokir', jumlah: peserta.jumlah_pelanggaran };

  const jumlah = peserta.jumlah_pelanggaran + 1;
  const terblokir = jumlah >= 3;
  const { error } = await db.from('ujian_pelanggaran').insert({ ujian_id: ujianId, siswa_id: siswaId, jenis });
  if (error) throw error;
  await db
    .from('ujian_peserta')
    .update({
      jumlah_pelanggaran: jumlah,
      ...(terblokir ? { status: 'diblokir', dikumpulkan_pada: new Date().toISOString() } : {}),
    })
    .eq('ujian_id', ujianId)
    .eq('siswa_id', siswaId);
  if (terblokir) await nilaiUlangPeserta(db, ujianId, siswaId);
  return { terblokir, jumlah };
}

export async function nilaiEsaiUjian(
  guruId: string,
  sekolahId: string,
  ujianId: string,
  siswaId: string,
  soalId: string,
  benar: boolean,
): Promise<void> {
  const db = ambilSupabase();
  await ambilUjianGuru(db, guruId, sekolahId, ujianId);
  const { data: soal, error } = await db
    .from('ujian_soal')
    .select('id, tipe, bobot')
    .eq('id', soalId)
    .eq('ujian_id', ujianId)
    .maybeSingle();
  if (error) throw error;
  if (!soal || soal.tipe !== 'esai') throw new GalatAuth('Soal esai tidak ditemukan.', 404);

  const { error: galatJawaban } = await db
    .from('ujian_jawaban')
    .update({ benar, bobot_didapat: benar ? Number(soal.bobot) : 0, dinilai_oleh: guruId, dinilai_pada: new Date().toISOString() })
    .eq('ujian_id', ujianId)
    .eq('siswa_id', siswaId)
    .eq('soal_id', soalId);
  if (galatJawaban) throw galatJawaban;
  await nilaiUlangPeserta(db, ujianId, siswaId);
}

export async function rilisUjian(guruId: string, sekolahId: string, ujianId: string): Promise<void> {
  const db = ambilSupabase();
  await ambilUjianGuru(db, guruId, sekolahId, ujianId);
  const { count, error } = await db
    .from('ujian_jawaban')
    .select('*', { count: 'exact', head: true })
    .eq('ujian_id', ujianId)
    .is('benar', null);
  if (error) throw error;
  if ((count ?? 0) > 0) throw new GalatAuth('Masih ada esai yang belum dinilai.', 409);
  const { error: galatRilis } = await db
    .from('ujian')
    .update({ dirilis_pada: new Date().toISOString(), status: 'selesai' })
    .eq('id', ujianId);
  if (galatRilis) throw galatRilis;
}

export async function daftarUjianSiswa(siswaId: string): Promise<UjianSiswa[]> {
  const db = ambilSupabase();
  const { data, error } = await db
    .from('ujian_peserta')
    .select('status, batas_pada, ujian(*, kelas(nama))')
    .eq('siswa_id', siswaId);
  if (error) throw error;
  return (data as unknown as {
    status: StatusPesertaUjian;
    batas_pada: string | null;
    ujian: BarisUjian | BarisUjian[];
  }[]).map((p) => {
    const u = Array.isArray(p.ujian) ? p.ujian[0] : p.ujian;
    return {
      id: u.id,
      judul: u.judul,
      namaKelas: namaKelas(u.kelas),
      status: statusUjianEfektif(u.status as UjianRingkas['status'], u.mulai_pada, u.selesai_pada),
      mulaiPada: u.mulai_pada,
      selesaiPada: u.selesai_pada,
      durasiMenit: u.durasi_menit,
      statusPeserta: p.status,
      batasPada: p.batas_pada,
      perluToken: p.status === 'belum',
      dirilisPada: u.dirilis_pada,
    };
  });
}

export async function hasilUjianSiswa(siswaId: string, ujianId: string): Promise<HasilUjianSiswa> {
  const db = ambilSupabase();
  const peserta = await ambilPeserta(db, ujianId, siswaId);
  if (!peserta) throw new GalatAuth('Kamu bukan peserta ujian ini.', 403);
  const { data: ujian, error } = await db.from('ujian').select('*, kelas(nama)').eq('id', ujianId).maybeSingle();
  if (error) throw error;
  if (!ujian || !(ujian as BarisUjian).dirilis_pada) throw new GalatAuth('Nilai ujian belum dirilis.', 403);
  const [soal, jawaban] = await Promise.all([
    bacaSoalUjianSiswa(db, ujianId),
    db.from('ujian_jawaban').select('soal_id, jawaban, benar, bobot_didapat').eq('ujian_id', ujianId).eq('siswa_id', siswaId),
  ]);
  if (jawaban.error) throw jawaban.error;
  return {
    ujianId,
    judul: (ujian as BarisUjian).judul,
    namaKelas: namaKelas((ujian as BarisUjian).kelas),
    skor: Number(peserta.skor_bobot),
    total: Number(peserta.total_bobot),
    persen: Number(peserta.persen ?? 0),
    soal,
    jawaban: (jawaban.data as { soal_id: string; jawaban: string; benar: boolean | null; bobot_didapat: number }[]).map((j) => ({
      soalId: j.soal_id,
      jawaban: j.jawaban,
      benar: j.benar,
      bobotDidapat: Number(j.bobot_didapat),
    })),
  };
}

export async function bukaBlokirUjian(
  adminId: string,
  sekolahId: string,
  ujianId: string,
  siswaId: string,
): Promise<void> {
  const db = ambilSupabase();
  const { data: ujian, error } = await db.from('ujian').select('id, selesai_pada').eq('id', ujianId).eq('sekolah_id', sekolahId).maybeSingle();
  if (error) throw error;
  if (!ujian) throw new GalatAuth(PESAN_UJIAN_TIDAK_ADA, 404);
  const peserta = await ambilPeserta(db, ujianId, siswaId);
  if (!peserta) throw new GalatAuth('Peserta tidak ditemukan.', 404);

  const batas = peserta.batas_pada && Date.parse(peserta.batas_pada) > Date.now()
    ? peserta.batas_pada
    : new Date(Math.min(Date.now() + 5 * 60_000, Date.parse(ujian.selesai_pada))).toISOString();
  const { error: galatUpdate } = await db
    .from('ujian_peserta')
    .update({ status: 'mengerjakan', jumlah_pelanggaran: 0, batas_pada: batas, dikumpulkan_pada: null })
    .eq('ujian_id', ujianId)
    .eq('siswa_id', siswaId);
  if (galatUpdate) throw galatUpdate;
  await db.from('ujian_tindakan').insert({
    ujian_id: ujianId,
    siswa_id: siswaId,
    admin_id: adminId,
    jenis: 'buka_blokir',
    catatan: 'Dibuka oleh admin sekolah',
  });
}

export async function detailUjianAdmin(sekolahId: string, ujianId: string): Promise<UjianDetailGuru> {
  const db = ambilSupabase();
  const { data: ujian, error } = await db
    .from('ujian')
    .select('*, kelas(nama)')
    .eq('id', ujianId)
    .eq('sekolah_id', sekolahId)
    .maybeSingle();
  if (error) throw error;
  if (!ujian) throw new GalatAuth(PESAN_UJIAN_TIDAK_ADA, 404);

  const { data: peserta, error: galatPeserta } = await db
    .from('ujian_peserta')
    .select('*, pengguna(nama)')
    .eq('ujian_id', ujianId);
  if (galatPeserta) throw galatPeserta;

  const pesertaGuru: PesertaUjianGuru[] = (
    peserta as (BarisPeserta & { pengguna: { nama: string } | { nama: string }[] | null })[]
  ).map((p) => ({
    siswaId: p.siswa_id,
    nama: Array.isArray(p.pengguna) ? (p.pengguna[0]?.nama ?? 'Siswa') : (p.pengguna?.nama ?? 'Siswa'),
    status: p.status,
    mulaiPada: p.mulai_pada,
    batasPada: p.batas_pada,
    dikumpulkanPada: p.dikumpulkan_pada,
    skor: Number(p.skor_bobot),
    total: Number(p.total_bobot),
    persen: p.persen === null ? null : Number(p.persen),
    jumlahPelanggaran: p.jumlah_pelanggaran,
  }));

  const { data: soal, error: galatSoal } = await db
    .from('ujian_soal')
    .select('id, nomor, tipe, teks, gambar, pilihan, bobot')
    .eq('ujian_id', ujianId)
    .order('nomor');
  if (galatSoal) throw galatSoal;

  return {
    ujian: await ringkasUjian(db, ujian as BarisUjian),
    soal: (soal as SoalUjianGuru[]).map((s) => ({ ...s, bobot: Number(s.bobot) })),
    peserta: pesertaGuru.sort((a, b) => a.nama.localeCompare(b.nama, 'id')),
    esai: [],
  };
}

export async function daftarUjianAdmin(sekolahId: string): Promise<UjianRingkas[]> {
  const db = ambilSupabase();
  const { data, error } = await db
    .from('ujian')
    .select('*, kelas(nama)')
    .eq('sekolah_id', sekolahId)
    .order('dibuat_pada', { ascending: false });
  if (error) throw error;
  return Promise.all((data as BarisUjian[]).map((u) => ringkasUjian(db, u)));
}
