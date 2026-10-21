import type { NextRequest } from 'next/server';
import { kelompokkanHasil, ringkasMateri } from '@/lib/ringkasan-hasil';
import { skemaQueryHasil } from '@/lib/skema-api';
import { cadanganTersedia } from '@/lib/soal-guru';
import { cariSoalTersulit } from '@/lib/soal-tersulit';
import { sesiMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { HasilGuru, Kelompok, StatusMateri, StatusSesi } from '@/lib/tipe';

// GET /api/guru/hasil?sesi= (PRD F-5, architecture.md 6.1 dan 7.2)
// Hanya guru pemilik kelas. Kunci jawaban tidak ikut dikirim; miskonsepsi hanya teks soal tersulit.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryHasil.safeParse({ sesi: request.nextUrl.searchParams.get('sesi') ?? '' });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const sesiId = input.data.sesi;

  try {
    const db = ambilSupabase();
    const sesi = await sesiMilikGuru(db, auth.profil.id, sesiId);
    if (!sesi) return responsError(PESAN_SESI_TIDAK_ADA, 404);

    const dataSesi = await db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, dibuat_pada')
      .eq('id', sesiId)
      .single();
    if (dataSesi.error) return petakanErrorDb(dataSesi.error);

    const [kelas, topik, anggota, hasil, soal, jawaban, materi] = await Promise.all([
      db.from('kelas').select('nama').eq('id', sesi.kelas_id).single(),
      db.from('topik').select('nama').eq('id', sesi.topik_id).single(),
      db.from('keanggotaan_kelas').select('siswa_id').eq('kelas_id', sesi.kelas_id),
      db.from('hasil_siswa').select('siswa_id, skor, total, kelompok').eq('sesi_id', sesiId),
      db.from('soal').select('id, nomor, teks, miskonsepsi').eq('topik_id', sesi.topik_id),
      db.from('jawaban').select('soal_id, pilihan, benar').eq('sesi_id', sesiId),
      db.from('materi').select('kelompok, status').eq('sesi_id', sesiId),
    ]);
    for (const r of [kelas, topik, anggota, hasil, soal, jawaban, materi]) {
      if (r.error) return petakanErrorDb(r.error);
    }

    const idSiswa = anggota.data!.map((a) => a.siswa_id as string);
    let daftarSiswa: { id: string; nama: string }[] = [];
    if (idSiswa.length > 0) {
      const siswa = await db.from('pengguna').select('id, nama').in('id', idSiswa);
      if (siswa.error) return petakanErrorDb(siswa.error);
      daftarSiswa = siswa.data as { id: string; nama: string }[];
    }

    const namaSiswa = new Map<string, string>(daftarSiswa.map((s) => [s.id, s.nama]));
    const kelompok = kelompokkanHasil(
      hasil.data!.map((h) => ({
        siswaId: h.siswa_id,
        nama: namaSiswa.get(h.siswa_id) ?? '',
        skor: h.skor,
        total: h.total,
        kelompok: h.kelompok as Kelompok,
      })),
    );

    const soalTersulit = cariSoalTersulit(
      soal.data!.map((s) => ({
        id: s.id,
        nomor: s.nomor,
        teks: s.teks,
        miskonsepsi: (s.miskonsepsi ?? {}) as Record<string, string>,
      })),
      jawaban.data!.map((j) => ({ soalId: j.soal_id, pilihan: j.pilihan, benar: j.benar })),
    );

    const respons: HasilGuru = {
      sesi: {
        id: dataSesi.data.id,
        kodeKelas: dataSesi.data.kode_kelas,
        status: dataSesi.data.status as StatusSesi,
        namaKelas: kelas.data!.nama,
        namaTopik: topik.data!.nama,
        dibuatPada: dataSesi.data.dibuat_pada,
        cadanganTersedia: cadanganTersedia(sesi.topik_id),
      },
      jumlahSiswa: idSiswa.length,
      jumlahMenjawab: hasil.data!.length,
      kelompok,
      soalTersulit,
      ...ringkasMateri(
        kelompok,
        materi.data!.map((m) => ({ kelompok: m.kelompok as Kelompok, status: m.status as StatusMateri })),
      ),
    };
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
