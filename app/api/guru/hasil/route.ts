import type { NextRequest } from 'next/server';
import { statusSesiEfektif } from '@/lib/jadwal-kuis';
import { kelompokkanHasil, ringkasMateri } from '@/lib/ringkasan-hasil';
import { skemaQueryHasil } from '@/lib/skema-api';
import { cadanganTersedia } from '@/lib/soal-guru';
import { cariSoalTersulit } from '@/lib/soal-tersulit';
import { sesiMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import { daftarDiblokir } from '@/lib/server/blokir';
import { bacaJadwalSesi, tutupSesiKedaluwarsa } from '@/lib/server/jadwal-kuis';
import { bacaJawabanSesi, bacaSoalTopik } from '@/lib/server/soal-tka-db';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  PESAN_SESI_TIDAK_ADA,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { HasilGuru, JawabanEsaiGuru, Kelompok, StatusMateri } from '@/lib/tipe';

// GET /api/guru/hasil?sesi= (PRD F-5, architecture.md 6.1 dan 7.2)
// Hanya guru pemilik kelas. Kunci soal objektif tidak ikut dikirim; soal esai menyertakan pedoman penilaian guru.
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

    await tutupSesiKedaluwarsa(db, { sesiIds: [sesiId] });
    const dataSesi = await db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, dibuat_pada')
      .eq('id', sesiId)
      .single();
    if (dataSesi.error) return petakanErrorDb(dataSesi.error);
    const jadwal = await bacaJadwalSesi(db, sesiId);

    const [kelas, topik, anggota, hasil, soal, jawaban, materi, diblokirMentah] = await Promise.all([
      db.from('kelas').select('nama').eq('id', sesi.kelas_id).single(),
      db.from('topik').select('nama').eq('id', sesi.topik_id).single(),
      db.from('keanggotaan_kelas').select('siswa_id').eq('kelas_id', sesi.kelas_id),
      db.from('hasil_siswa').select('siswa_id, skor, total, kelompok').eq('sesi_id', sesiId),
      bacaSoalTopik(db, sesi.topik_id, { sertakanRahasia: true }),
      bacaJawabanSesi(db, sesiId),
      db.from('materi').select('kelompok, status').eq('sesi_id', sesiId),
      daftarDiblokir(db, sesiId),
    ]);
    for (const r of [kelas, topik, anggota, hasil, materi]) {
      if (r.error) return petakanErrorDb(r.error);
    }
    if (soal.error || !soal.data) return petakanErrorDb(soal.error);
    if (jawaban.error || !jawaban.data) return petakanErrorDb(jawaban.error);

    const idSiswa = anggota.data!.map((a) => a.siswa_id as string);
    const idDiblokir = new Set(diblokirMentah.map((d) => d.siswaId));
    const semuaIdSiswa = [...new Set([...idSiswa, ...hasil.data!.map((h) => h.siswa_id as string)])];
    let daftarSiswa: { id: string; nama: string }[] = [];
    if (semuaIdSiswa.length > 0) {
      const siswa = await db.from('pengguna').select('id, nama').in('id', semuaIdSiswa);
      if (siswa.error) return petakanErrorDb(siswa.error);
      daftarSiswa = siswa.data as { id: string; nama: string }[];
    }

    const namaSiswa = new Map<string, string>(daftarSiswa.map((s) => [s.id, s.nama]));
    // Hanya anggota kelas yang masih terdaftar; urut abjad.
    const diblokir = diblokirMentah
      .filter((d) => idSiswa.includes(d.siswaId) && idDiblokir.has(d.siswaId))
      .map((d) => ({ ...d, nama: namaSiswa.get(d.siswaId) ?? 'Siswa' }))
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));

    const kelompok = kelompokkanHasil(
      hasil.data!.map((h) => ({
        siswaId: h.siswa_id,
        nama: namaSiswa.get(h.siswa_id) ?? '',
        skor: h.skor,
        total: h.total,
        kelompok: h.kelompok as Kelompok,
      })),
    );

    const petaSoalEsai = new Map(soal.data.filter((s) => s.tipe === 'esai').map((s) => [s.id, s]));
    const siswaMenjawab = new Set(hasil.data!.map((h) => h.siswa_id as string));
    const esai: JawabanEsaiGuru[] = jawaban.data
      .filter((j) => petaSoalEsai.has(j.soal_id) && siswaMenjawab.has(j.siswa_id))
      .map((j) => {
        const s = petaSoalEsai.get(j.soal_id)!;
        return {
          soalId: s.id,
          nomorSoal: s.nomor,
          teksSoal: s.teks,
          gambarSoal: s.gambar,
          pedomanJawaban: s.kunci.trim() || null,
          siswaId: j.siswa_id,
          namaSiswa: namaSiswa.get(j.siswa_id) ?? 'Siswa',
          jawabanTeks: j.pilihan,
          belumDinilai: j.belum_dinilai,
          benar: j.benar,
        };
      })
      .sort(
        (a, b) =>
          Number(b.belumDinilai) - Number(a.belumDinilai) ||
          a.nomorSoal - b.nomorSoal ||
          a.namaSiswa.localeCompare(b.namaSiswa, 'id', { sensitivity: 'base' }),
      );

    const soalTersulit = cariSoalTersulit(
      soal.data.map((s) => ({
        id: s.id,
        nomor: s.nomor,
        teks: s.teks,
        miskonsepsi: s.miskonsepsi,
      })),
      jawaban.data.map((j) => ({
        soalId: j.soal_id,
        pilihan: j.pilihan,
        benar: j.benar,
        belumDinilai: j.belum_dinilai,
      })),
    );

    const respons: HasilGuru = {
      sesi: {
        id: dataSesi.data.id,
        kodeKelas: dataSesi.data.kode_kelas,
        status: statusSesiEfektif(
          dataSesi.data.status === 'aktif' ? 'aktif' : 'selesai',
          jadwal ?? undefined,
          new Date(),
        ),
        namaKelas: kelas.data!.nama,
        namaTopik: topik.data!.nama,
        dibuatPada: dataSesi.data.dibuat_pada,
        bukaPada: jadwal?.bukaPada ?? dataSesi.data.dibuat_pada,
        tutupPada: jadwal?.tutupPada ?? null,
        cadanganTersedia: cadanganTersedia(sesi.topik_id),
      },
      jumlahSiswa: idSiswa.length,
      jumlahMenjawab: hasil.data!.length,
      diblokir,
      esai,
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
