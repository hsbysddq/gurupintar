import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalisasiFormat } from '@/lib/format-materi';
import { pilihHasilTerbaru } from '@/lib/hasil-terbaru';
import { lengkapiIsiMateri } from '@/lib/validasi-materi';
import { kelasMilikGuru, kolomArsipBelumAda } from './auth';
import type {
  AsalMateriPustaka,
  Format,
  KelasRingkas,
  Kelompok,
  MateriPustaka,
  SiswaKelas,
  SumberMateri,
} from '@/lib/tipe';

type BarisKelas = {
  id: string;
  nama: string;
  mapel: string;
  kode_undangan: string;
  keanggotaan_kelas: { count: number }[];
};

type BarisSesiAktif = {
  id: string;
  kelas_id: string;
  kode_kelas: string;
  hasil_siswa: { count: number }[];
};

type BarisAnggota = { siswa_id: string; preferensi_format: Format | null; nama_tampil?: string | null };
type BarisPengguna = { id: string; nama: string; email?: string | null };
type BarisSesi = { id: string; dibuat_pada: string };
type BarisHasil = {
  sesi_id: string;
  siswa_id: string;
  skor: number;
  total: number;
  kelompok: Kelompok;
};

/** Semua kelas milik guru. Default hanya kelas aktif; `arsip: true` untuk kelas diarsipkan. */
export async function ambilKelasGuru(
  db: SupabaseClient,
  guruId: string,
  opsi: { arsip?: boolean } = {},
): Promise<KelasRingkas[]> {
  const dasar = () =>
    db.from('kelas').select('id, nama, mapel, kode_undangan, keanggotaan_kelas(count)').eq('guru_id', guruId);
  const kueri = opsi.arsip
    ? dasar().not('diarsipkan_pada', 'is', null)
    : dasar().is('diarsipkan_pada', null);

  let hasil = await kueri.order('nama');
  if (hasil.error && kolomArsipBelumAda(hasil.error)) {
    // Sebelum migrasi arsip dijalankan: semua kelas dianggap aktif, daftar arsip kosong.
    if (opsi.arsip) return [];
    hasil = await dasar().order('nama');
  }
  if (hasil.error) throw hasil.error;

  const daftar = hasil.data as BarisKelas[];
  const ids = daftar.map((k) => k.id);

  let sesiAktif: BarisSesiAktif[] = [];
  if (ids.length > 0) {
    const sesi = await db
      .from('sesi_kuis')
      .select('id, kelas_id, kode_kelas, hasil_siswa(count)')
      .in('kelas_id', ids)
      .eq('status', 'aktif');
    if (sesi.error) throw sesi.error;
    sesiAktif = sesi.data as BarisSesiAktif[];
  }

  return daftar.map((k) => {
    const aktif = sesiAktif.find((s) => s.kelas_id === k.id);
    return {
      id: k.id,
      nama: k.nama,
      mapel: k.mapel,
      kodeUndangan: k.kode_undangan,
      jumlahSiswa: k.keanggotaan_kelas[0]?.count ?? 0,
      kuisAktif: aktif
        ? {
            id: aktif.id,
            kodeKelas: aktif.kode_kelas,
            jumlahMenjawab: aktif.hasil_siswa[0]?.count ?? 0,
          }
        : null,
    };
  });
}

function kolomHilang(err: unknown, namaKolom: string): boolean {
  const pesan =
    typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '';
  return pesan.includes(namaKolom) && (pesan.includes('does not exist') || pesan.includes('schema cache'));
}

/** Anggota satu kelas (harus milik guru) beserta hasil kuis terbarunya. */
export async function ambilSiswaKelas(
  db: SupabaseClient,
  guruId: string,
  kelasId: string,
): Promise<SiswaKelas[] | null> {
  if (!(await kelasMilikGuru(db, guruId, kelasId))) return null;

  let barisAnggota: BarisAnggota[] = [];
  const anggotaLengkap = await db
    .from('keanggotaan_kelas')
    .select('siswa_id, preferensi_format, nama_tampil')
    .eq('kelas_id', kelasId);
  if (!anggotaLengkap.error) {
    barisAnggota = anggotaLengkap.data as BarisAnggota[];
  } else if (kolomHilang(anggotaLengkap.error, 'nama_tampil')) {
    const cadangan = await db
      .from('keanggotaan_kelas')
      .select('siswa_id, preferensi_format')
      .eq('kelas_id', kelasId);
    if (cadangan.error) throw cadangan.error;
    barisAnggota = cadangan.data as BarisAnggota[];
  } else {
    throw anggotaLengkap.error;
  }

  const idSiswa = barisAnggota.map((a) => a.siswa_id);

  let daftarPengguna: BarisPengguna[] = [];
  if (idSiswa.length > 0) {
    const penggunaLengkap = await db.from('pengguna').select('id, nama, email').in('id', idSiswa);
    if (!penggunaLengkap.error) {
      daftarPengguna = penggunaLengkap.data as BarisPengguna[];
    } else if (kolomHilang(penggunaLengkap.error, 'email')) {
      const cadangan = await db.from('pengguna').select('id, nama').in('id', idSiswa);
      if (cadangan.error) throw cadangan.error;
      daftarPengguna = cadangan.data as BarisPengguna[];
    } else {
      throw penggunaLengkap.error;
    }
  }
  const petaPengguna = new Map(daftarPengguna.map((p) => [p.id, p]));

  const sesi = await db
    .from('sesi_kuis')
    .select('id, dibuat_pada')
    .eq('kelas_id', kelasId)
    .order('dibuat_pada', { ascending: true });
  if (sesi.error) throw sesi.error;
  const barisSesi = sesi.data as BarisSesi[];
  const urutanSesi = new Map(barisSesi.map((s, i) => [s.id, i]));

  const idSesi = barisSesi.map((s) => s.id);
  let barisHasil: BarisHasil[] = [];
  if (idSesi.length > 0) {
    const hasil = await db
      .from('hasil_siswa')
      .select('sesi_id, siswa_id, skor, total, kelompok')
      .in('sesi_id', idSesi);
    if (hasil.error) throw hasil.error;
    barisHasil = hasil.data as BarisHasil[];
  }

  // Hasil terbaru per siswa berdasarkan urutan sesi.
  const terbaru = pilihHasilTerbaru(
    barisHasil.map((h) => ({
      sesiId: h.sesi_id,
      siswaId: h.siswa_id,
      skor: h.skor,
      total: h.total,
      kelompok: h.kelompok,
    })),
    urutanSesi,
  );

  return barisAnggota
    .map((a) => {
      const hasil = terbaru.get(a.siswa_id);
      const pengguna = petaPengguna.get(a.siswa_id);
      return {
        siswaId: a.siswa_id,
        nama: a.nama_tampil ?? pengguna?.nama ?? '',
        email: pengguna?.email ?? null,
        format: normalisasiFormat(a.preferensi_format),
        kelompok: hasil?.kelompok ?? null,
        skor: hasil?.skor ?? null,
        total: hasil?.total ?? null,
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
}

type BarisMateriPustaka = {
  id: string;
  kelas_id: string;
  bab: string;
  judul: string;
  isi: unknown;
  sumber: SumberMateri;
  asal: AsalMateriPustaka;
  dibuat_pada: string;
  diperbarui_pada: string;
};

/** Pustaka materi mandiri satu kelas (hasil Ubah Modul), dikelompokkan di UI berdasarkan `bab`. */
export async function ambilMateriPustakaKelas(
  db: SupabaseClient,
  guruId: string,
  kelasId: string,
): Promise<MateriPustaka[] | null> {
  if (!(await kelasMilikGuru(db, guruId, kelasId))) return null;

  const { data, error } = await db
    .from('materi_pustaka')
    .select('id, kelas_id, bab, judul, isi, sumber, asal, dibuat_pada, diperbarui_pada')
    .eq('kelas_id', kelasId)
    .eq('guru_id', guruId)
    .order('bab')
    .order('diperbarui_pada', { ascending: false });
  if (error) throw error;

  return (data as BarisMateriPustaka[]).map((m) => ({
    id: m.id,
    kelasId: m.kelas_id,
    bab: m.bab,
    judul: m.judul,
    isi: lengkapiIsiMateri(m.isi),
    sumber: m.sumber,
    asal: m.asal,
    dibuatPada: m.dibuat_pada,
    diperbaruiPada: m.diperbarui_pada,
  }));
}
