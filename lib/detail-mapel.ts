// Logika murni untuk halaman detail mata pelajaran siswa: materi kelas, kuis, dan histori hasil kuis.
// Tidak ada label kelompok di sini. Yang sampai ke siswa hanya status materi, skor, dan persentase (PRD D-2).

import {
  hitungPersen,
  kalimatTren,
  ringkasPerforma,
  type RiwayatKuis,
  type RingkasanPerforma,
} from './riwayat-siswa';
import type { StatusMateriSiswa, StatusSesi } from './tipe';

export interface KelasDetail {
  id: string;
  nama: string;
  mapel: string;
  namaGuru: string;
}

export interface SesiDetail {
  id: string;
  kodeKelas: string;
  status: StatusSesi;
  /** ISO 8601. */
  dibuatPada: string;
  namaTopik: string;
  statusMateri: StatusMateriSiswa;
}

/** Satu pengerjaan kuis. Kuis yang dikerjakan ulang punya beberapa baris dengan `sesiId` yang sama. */
export interface HasilDetail {
  sesiId: string;
  skor: number;
  total: number;
  /** ISO 8601, waktu jawaban dikirim. */
  dikirimPada: string;
}

export interface DataDetailMapel {
  kelas: KelasDetail;
  sesi: SesiDetail[];
  hasil: HasilDetail[];
}

export type TabMapel = 'materi' | 'kuis' | 'histori';

export const DAFTAR_TAB: { id: TabMapel; label: string }[] = [
  { id: 'materi', label: 'Materi Kelas' },
  { id: 'kuis', label: 'Quiz' },
  { id: 'histori', label: 'Histori Hasil Quiz' },
];

/** Nilai `?tab=` yang tidak dikenal jatuh ke tab pertama. */
export function pilihTab(nilai: string | undefined): TabMapel {
  return DAFTAR_TAB.some((t) => t.id === nilai) ? (nilai as TabMapel) : 'materi';
}

export interface ItemMateri {
  sesiId: string;
  judul: string;
  tanggal: string;
  status: 'tersedia' | 'disiapkan';
  /** Tautan ke materi; null selama guru belum membagikannya. */
  href: string | null;
}

export type StatusKuis = 'aktif-belum' | 'aktif-selesai' | 'selesai-dikerjakan' | 'selesai-tidak';

export interface ItemKuis {
  sesiId: string;
  judul: string;
  tanggal: string;
  status: StatusKuis;
  /** Skor pengerjaan terakhir; null bila belum dikerjakan. */
  skor: number | null;
  total: number | null;
  /** Berapa kali kuis ini dikerjakan. */
  jumlahPengerjaan: number;
  /** Tautan untuk mengerjakan atau mengerjakan ulang; hanya ada selama kuis masih aktif. */
  hrefKerjakan: string | null;
}

export interface ItemHistori {
  sesiId: string;
  /** Pengerjaan ke berapa untuk kuis ini (1 = pertama). */
  pengerjaanKe: number;
  judul: string;
  tanggal: string;
  skor: number;
  total: number;
  persen: number;
}

export interface DetailMapel {
  materi: ItemMateri[];
  kuis: ItemKuis[];
  histori: ItemHistori[];
  ringkasan: RingkasanPerforma;
  tren: string;
  /** Kuis aktif terbaru yang belum dikerjakan siswa, atau null. */
  kuisAktif: { sesiId: string; judul: string; href: string } | null;
}

function urutTerbaru<T>(daftar: T[], waktu: (item: T) => string): T[] {
  return [...daftar].sort((a, b) => waktu(b).localeCompare(waktu(a)));
}

function hrefKuis(kodeKelas: string): string {
  return `/siswa/gabung?kode=${encodeURIComponent(kodeKelas)}`;
}

export function susunDetailMapel(data: DataDetailMapel): DetailMapel {
  const sesi = urutTerbaru(data.sesi, (s) => s.dibuatPada);
  // Kuis bisa dikerjakan ulang: status memakai pengerjaan terakhir, histori memuat semuanya.
  const urutLama = [...data.hasil].sort((a, b) => a.dikirimPada.localeCompare(b.dikirimPada));
  const hasilPerSesi = new Map<string, HasilDetail>();
  const jumlahPerSesi = new Map<string, number>();
  const nomorPengerjaan = new Map<HasilDetail, number>();
  for (const h of urutLama) {
    hasilPerSesi.set(h.sesiId, h);
    const n = (jumlahPerSesi.get(h.sesiId) ?? 0) + 1;
    jumlahPerSesi.set(h.sesiId, n);
    nomorPengerjaan.set(h, n);
  }

  const materi: ItemMateri[] = [];
  for (const s of sesi) {
    if (s.statusMateri !== 'tersedia' && s.statusMateri !== 'disiapkan') continue;
    materi.push({
      sesiId: s.id,
      judul: s.namaTopik,
      tanggal: s.dibuatPada,
      status: s.statusMateri,
      href: s.statusMateri === 'tersedia' ? `/siswa/materi?sesi=${s.id}` : null,
    });
  }

  const kuis: ItemKuis[] = sesi.map((s) => {
    const hasil = hasilPerSesi.get(s.id) ?? null;
    const aktif = s.status === 'aktif';
    const status: StatusKuis = aktif
      ? hasil
        ? 'aktif-selesai'
        : 'aktif-belum'
      : hasil
        ? 'selesai-dikerjakan'
        : 'selesai-tidak';
    return {
      sesiId: s.id,
      judul: s.namaTopik,
      tanggal: s.dibuatPada,
      status,
      skor: hasil?.skor ?? null,
      total: hasil?.total ?? null,
      jumlahPengerjaan: jumlahPerSesi.get(s.id) ?? 0,
      hrefKerjakan: aktif ? hrefKuis(s.kodeKelas) : null,
    };
  });

  const namaTopik = new Map(data.sesi.map((s) => [s.id, s.namaTopik]));
  const riwayat: (RiwayatKuis & { pengerjaanKe: number })[] = data.hasil
    .filter((h) => namaTopik.has(h.sesiId))
    .map((h) => ({
      sesiId: h.sesiId,
      pengerjaanKe: nomorPengerjaan.get(h) ?? 1,
      dikirimPada: h.dikirimPada,
      namaKelas: data.kelas.nama,
      namaTopik: namaTopik.get(h.sesiId) ?? '',
      skor: h.skor,
      total: h.total,
    }));

  const histori: ItemHistori[] = urutTerbaru(riwayat, (r) => r.dikirimPada).map((r) => ({
    sesiId: r.sesiId,
    pengerjaanKe: r.pengerjaanKe,
    judul: r.namaTopik,
    tanggal: r.dikirimPada,
    skor: r.skor,
    total: r.total,
    persen: hitungPersen(r.skor, r.total),
  }));

  const ringkasan = ringkasPerforma(riwayat);

  const belumDikerjakan = kuis.find((k) => k.status === 'aktif-belum');
  const kuisAktif =
    belumDikerjakan && belumDikerjakan.hrefKerjakan
      ? { sesiId: belumDikerjakan.sesiId, judul: belumDikerjakan.judul, href: belumDikerjakan.hrefKerjakan }
      : null;

  return { materi, kuis, histori, ringkasan, tren: kalimatTren(ringkasan.perubahan), kuisAktif };
}

/** Tanggal kartu ala Classroom, mis. "6 Jan 2024", menurut waktu Indonesia Barat. */
export function formatTanggalKartu(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}
