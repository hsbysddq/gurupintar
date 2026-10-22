import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { pilihHasilTerbaru } from '@/lib/hasil-terbaru';
import { ringkasStatusMateri } from '@/lib/status-materi';
import { kelasMilikGuru, kolomArsipBelumAda } from './auth';
import type {
  Format,
  KelasRingkas,
  Kelompok,
  MateriKelasRingkas,
  SiswaKelas,
  StatusMateri,
  StatusSesi,
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

type BarisAnggota = { siswa_id: string; preferensi_format: Format | null };
type BarisPengguna = { id: string; nama: string };
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

/** Anggota satu kelas (harus milik guru) beserta hasil kuis terbarunya. */
export async function ambilSiswaKelas(
  db: SupabaseClient,
  guruId: string,
  kelasId: string,
): Promise<SiswaKelas[] | null> {
  if (!(await kelasMilikGuru(db, guruId, kelasId))) return null;

  const anggota = await db
    .from('keanggotaan_kelas')
    .select('siswa_id, preferensi_format')
    .eq('kelas_id', kelasId);
  if (anggota.error) throw anggota.error;

  const barisAnggota = anggota.data as BarisAnggota[];
  const idSiswa = barisAnggota.map((a) => a.siswa_id);

  let daftarPengguna: BarisPengguna[] = [];
  if (idSiswa.length > 0) {
    const pengguna = await db.from('pengguna').select('id, nama').in('id', idSiswa);
    if (pengguna.error) throw pengguna.error;
    daftarPengguna = pengguna.data as BarisPengguna[];
  }
  const namaSiswa = new Map(daftarPengguna.map((p) => [p.id, p.nama]));

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
      return {
        siswaId: a.siswa_id,
        nama: namaSiswa.get(a.siswa_id) ?? '',
        format: a.preferensi_format,
        kelompok: hasil?.kelompok ?? null,
        skor: hasil?.skor ?? null,
        total: hasil?.total ?? null,
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
}

type BarisSesiMateri = {
  id: string;
  kode_kelas: string;
  status: string;
  dibuat_pada: string;
  topik: unknown;
  hasil_siswa: { count: number }[];
};

type BarisMateriSesi = {
  sesi_id: string;
  kelompok: Kelompok;
  status: StatusMateri;
  sumber: SumberMateri;
  versi: number;
};

function namaTopikDari(nilai: unknown): string {
  if (Array.isArray(nilai)) return (nilai[0] as { nama?: string } | undefined)?.nama ?? '';
  return (nilai as { nama?: string } | null)?.nama ?? '';
}

/** Semua sesi satu kelas beserta materi yang sudah dibuat. */
export async function ambilMateriKelas(
  db: SupabaseClient,
  guruId: string,
  kelasId: string,
): Promise<MateriKelasRingkas[] | null> {
  if (!(await kelasMilikGuru(db, guruId, kelasId))) return null;

  const sesi = await db
    .from('sesi_kuis')
    .select('id, kode_kelas, status, dibuat_pada, topik(nama), hasil_siswa(count)')
    .eq('kelas_id', kelasId)
    .order('dibuat_pada', { ascending: false });
  if (sesi.error) throw sesi.error;

  const barisSesi = sesi.data as BarisSesiMateri[];
  const idSesi = barisSesi.map((s) => s.id);

  let barisMateri: BarisMateriSesi[] = [];
  if (idSesi.length > 0) {
    const materi = await db
      .from('materi')
      .select('sesi_id, kelompok, status, sumber, versi')
      .in('sesi_id', idSesi);
    if (materi.error) throw materi.error;
    barisMateri = materi.data as BarisMateriSesi[];
  }

  return barisSesi.map((s) => {
    const daftar = barisMateri
      .filter((m) => m.sesi_id === s.id)
      .map((m) => ({ kelompok: m.kelompok, status: m.status, sumber: m.sumber, versi: m.versi }));

    return {
      sesiId: s.id,
      kodeKelas: s.kode_kelas,
      status: s.status as StatusSesi,
      dibuatPada: s.dibuat_pada,
      namaTopik: namaTopikDari(s.topik),
      jumlahMenjawab: s.hasil_siswa[0]?.count ?? 0,
      materi: daftar,
      statusMateri: ringkasStatusMateri(daftar),
    };
  });
}
