import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hitungPendampingan } from '@/lib/pendampingan';
import { tabelBelumAda } from '@/lib/server/respons';
import type {
  DataPendampingan,
  KategoriPemahaman,
  SesiPendampingan,
  TindakanPendampingan,
} from '@/lib/tipe';

type BarisSesi = {
  id: string;
  kode_kelas: string;
  status: string;
  dibuat_pada: string;
  topik: unknown;
};
type BarisAnggota = { siswa_id: string };
type BarisPengguna = { id: string; nama: string };
type BarisHasil = { siswa_id: string; skor: number; total: number };
type BarisTindakan = {
  siswa_id: string;
  sesi_id: string;
  kategori: string;
  tindakan: string;
};

function namaTopikDari(nilai: unknown): string {
  if (Array.isArray(nilai)) return (nilai[0] as { nama?: string } | undefined)?.nama ?? '';
  return (nilai as { nama?: string } | null)?.nama ?? '';
}

function ringkasanKosong(daftarSesi: SesiPendampingan[] = []): DataPendampingan {
  return {
    siswa: [],
    ringkasan: {
      jumlahSiswa: 0,
      jumlahSesiSelesai: 0,
      jumlahMenjawab: 0,
      sesiTerpilihId: null,
      daftarSesi,
      jumlahPaham: 0,
      jumlahSetengah: 0,
      jumlahBelum: 0,
      jumlahTidakMengerjakan: 0,
    },
  };
}

/**
 * Analitik pendampingan satu kuis selesai terpilih.
 * `sesiId` kosong = kuis selesai terbaru. Pemanggil wajib memverifikasi kepemilikan kelas.
 */
export async function dataPendampinganKelas(
  db: SupabaseClient,
  kelasId: string,
  sesiId?: string,
): Promise<DataPendampingan | null> {
  const [sesi, anggota] = await Promise.all([
    db
      .from('sesi_kuis')
      .select('id, kode_kelas, status, dibuat_pada, topik(nama)')
      .eq('kelas_id', kelasId),
    db.from('keanggotaan_kelas').select('siswa_id').eq('kelas_id', kelasId),
  ]);
  if (sesi.error) throw sesi.error;
  if (anggota.error) throw anggota.error;

  const selesai = (sesi.data as BarisSesi[])
    .filter((s) => s.status === 'selesai')
    .sort((a, b) => Date.parse(b.dibuat_pada) - Date.parse(a.dibuat_pada));
  const daftarSesi: SesiPendampingan[] = selesai.map((s) => ({
    id: s.id,
    kodeKelas: s.kode_kelas,
    dibuatPada: s.dibuat_pada,
    namaTopik: namaTopikDari(s.topik),
  }));
  const dipilih = sesiId ? selesai.find((s) => s.id === sesiId) : selesai[0];
  if (sesiId && !dipilih) return null;
  if (!dipilih) return ringkasanKosong(daftarSesi);

  const idSiswa = (anggota.data as BarisAnggota[]).map((a) => a.siswa_id);

  let siswa: BarisPengguna[] = [];
  if (idSiswa.length > 0) {
    const r = await db.from('pengguna').select('id, nama').in('id', idSiswa);
    if (r.error) throw r.error;
    siswa = r.data as BarisPengguna[];
  }

  const [hasil, tindakan] = await Promise.all([
    db.from('hasil_siswa').select('siswa_id, skor, total').eq('sesi_id', dipilih.id),
    db
      .from('tindakan_pendampingan_kuis')
      .select('siswa_id, sesi_id, kategori, tindakan')
      .eq('sesi_id', dipilih.id),
  ]);
  if (hasil.error) throw hasil.error;

  let barisTindakan: BarisTindakan[] = [];
  let perluMigrasi = false;
  if (tindakan.error) {
    if (tabelBelumAda(tindakan.error)) perluMigrasi = true;
    else throw tindakan.error;
  } else {
    barisTindakan = tindakan.data as BarisTindakan[];
  }

  const data = hitungPendampingan({
    sesi: { id: dipilih.id, dibuatPada: dipilih.dibuat_pada },
    hasil: (hasil.data as BarisHasil[]).map((h) => ({
      siswaId: h.siswa_id,
      skor: h.skor,
      total: h.total,
    })),
    siswa,
    tindakan: barisTindakan.map((t) => ({
      siswaId: t.siswa_id,
      sesiId: t.sesi_id,
      kategori: t.kategori as KategoriPemahaman,
      tindakan: t.tindakan as TindakanPendampingan,
    })),
  });

  data.ringkasan.jumlahSesiSelesai = selesai.length;
  data.ringkasan.jumlahMenjawab = hasil.data?.length ?? 0;
  data.ringkasan.sesiTerpilihId = dipilih.id;
  data.ringkasan.daftarSesi = daftarSesi;
  if (perluMigrasi) data.ringkasan.perluMigrasi = true;

  return data;
}
