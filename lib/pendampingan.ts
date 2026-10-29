import type { DataPendampingan, Kelompok, StatusSesi } from './tipe';

// Teks PRD AC-8.3 dan AC-8.4.
export const ALASAN_BELUM_PAHAM = 'Belum paham 3x berturut-turut';
export const ALASAN_TIDAK_MENGERJAKAN = 'Tidak mengerjakan 2 cek terakhir';
export const ALASAN_MENURUN = 'Skor menurun 3 kali berturut-turut';
export const SARAN_BELUM_PAHAM = 'Beri materi penguatan konsep dan dampingi langsung.';
export const SARAN_TIDAK_MENGERJAKAN = 'Ajak bicara untuk mengetahui kendalanya.';
export const SARAN_MENURUN = 'Periksa topik terakhir yang sulit baginya.';

export const JUMLAH_SESI_JENDELA = 3;
export const JUMLAH_CEK_TIDAK_MENGERJAKAN = 2;

export interface InputPendampingan {
  sesi: { id: string; status: StatusSesi; dibuatPada: string }[];
  hasil: { sesiId: string; siswaId: string; skor: number; kelompok: Kelompok }[];
  siswa: { id: string; nama: string }[];
}

/** Tiga skor terakhir turun ketat (s1 > s2 > s3). Dipakai juga untuk ikon tren di TabelPendampingan. */
export function trenMenurun(trenSkor: number[]): boolean {
  if (trenSkor.length < JUMLAH_SESI_JENDELA) return false;
  const [s1, s2, s3] = trenSkor.slice(-JUMLAH_SESI_JENDELA);
  return s1 > s2 && s2 > s3;
}

/** Daftar Perlu Pendampingan dan Mengalami Kemajuan (PRD F-8, architecture.md 8.4). */
export function hitungPendampingan(input: InputPendampingan): DataPendampingan {
  // 1. Sesi tanpa jawaban sama sekali diabaikan.
  const sesiBerjawaban = new Set(input.hasil.map((h) => h.sesiId));
  const sesi = input.sesi
    .filter((s) => sesiBerjawaban.has(s.id))
    .sort((a, b) => Date.parse(a.dibuatPada) - Date.parse(b.dibuatPada));

  const hasilPerSiswa = new Map<string, Map<string, { skor: number; kelompok: Kelompok }>>();
  for (const h of input.hasil) {
    if (!hasilPerSiswa.has(h.siswaId)) hasilPerSiswa.set(h.siswaId, new Map());
    hasilPerSiswa.get(h.siswaId)!.set(h.sesiId, { skor: h.skor, kelompok: h.kelompok });
  }

  // 5. Dua sesi selesai terakhir (yang berisi jawaban) untuk aturan "tidak mengerjakan".
  const duaSelesaiTerakhir = sesi.filter((s) => s.status === 'selesai').slice(-JUMLAH_CEK_TIDAK_MENGERJAKAN);

  const perluPendampingan: DataPendampingan['perluPendampingan'] = [];
  const kemajuan: DataPendampingan['kemajuan'] = [];

  for (const { id: siswaId, nama } of input.siswa) {
    const milikSiswa = hasilPerSiswa.get(siswaId) ?? new Map<string, { skor: number; kelompok: Kelompok }>();

    // 2–3. Jendela per siswa: sesi selesai + sesi aktif yang sudah ia jawab, ambil 3 terakhir.
    const jendela = sesi
      .filter((s) => s.status === 'selesai' || milikSiswa.has(s.id))
      .slice(-JUMLAH_SESI_JENDELA);
    const diikuti = jendela.flatMap((s) => {
      const h = milikSiswa.get(s.id);
      return h ? [h] : [];
    });
    const trenSkor = diikuti.map((h) => h.skor);

    const alasan: string[] = [];
    const saran: string[] = [];

    // 4. Belum paham di 3 sesi terakhir yang diikuti.
    if (diikuti.length >= JUMLAH_SESI_JENDELA && diikuti.slice(-JUMLAH_SESI_JENDELA).every((h) => h.kelompok === 'belum')) {
      alasan.push(ALASAN_BELUM_PAHAM);
      saran.push(SARAN_BELUM_PAHAM);
    }
    // 5. Tidak punya hasil di 2 sesi selesai terakhir.
    if (duaSelesaiTerakhir.length === JUMLAH_CEK_TIDAK_MENGERJAKAN && duaSelesaiTerakhir.every((s) => !milikSiswa.has(s.id))) {
      alasan.push(ALASAN_TIDAK_MENGERJAKAN);
      saran.push(SARAN_TIDAK_MENGERJAKAN);
    }
    // 6. Skor turun ketat di 3 sesi terakhir yang diikuti.
    if (trenMenurun(trenSkor)) {
      alasan.push(ALASAN_MENURUN);
      saran.push(SARAN_MENURUN);
    }

    if (alasan.length > 0) perluPendampingan.push({ siswaId, nama, alasan, saran, trenSkor });

    // 7. Kemajuan: sebelumnya belum, sesi terakhir yang diikuti naik.
    const [sebelum, terakhir] = diikuti.slice(-2);
    if (diikuti.length >= 2 && sebelum.kelompok === 'belum' && terakhir.kelompok !== 'belum') {
      kemajuan.push({ siswaId, nama, dari: sebelum.kelompok, ke: terakhir.kelompok });
    }
  }

  // 8. Urutan: jumlah alasan terbanyak, lalu nama.
  const urutNama = (a: { nama: string }, b: { nama: string }) => a.nama.localeCompare(b.nama, 'id');
  perluPendampingan.sort((a, b) => b.alasan.length - a.alasan.length || urutNama(a, b));
  kemajuan.sort(urutNama);

  return { perluPendampingan, kemajuan };
}
