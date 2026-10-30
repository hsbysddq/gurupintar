import type {
  DataPendampingan,
  KategoriPemahaman,
  SiswaPendampingan,
  StatusPendampingan,
  StatusSesi,
  TindakanPendampingan,
} from './tipe';

export const JUMLAH_KUIS = 3;
export const BATAS_PAHAM = 70;
export const BATAS_SETENGAH = 50;

export interface TindakanTersimpan {
  siswaId: string;
  sesiTerakhirId: string;
  kategori: KategoriPemahaman;
  tindakan: TindakanPendampingan;
}

export interface InputPendampingan {
  sesi: { id: string; status: StatusSesi; dibuatPada: string }[];
  hasil: { sesiId: string; siswaId: string; skor: number; total: number }[];
  siswa: { id: string; nama: string }[];
  tindakan?: TindakanTersimpan[];
}

/**
 * Kategori mengikuti alur: rata-rata 3 kuis selesai terakhir.
 * >=70 paham, 50–<70 setengah paham, <50 belum paham.
 * Siswa dengan kurang dari 3 hasil masuk "tidak mengerjakan".
 */
export function hitungPendampingan(input: InputPendampingan): DataPendampingan {
  const sesiBerjawaban = new Set(input.hasil.map((h) => h.sesiId));
  const selesai = input.sesi
    .filter((s) => s.status === 'selesai' && sesiBerjawaban.has(s.id))
    .sort((a, b) => Date.parse(a.dibuatPada) - Date.parse(b.dibuatPada));
  const jendela = selesai.slice(-JUMLAH_KUIS);
  const sesiTerakhirId = jendela.at(-1)?.id ?? null;

  const hasilPerSiswa = new Map<string, Map<string, { skor: number; total: number }>>();
  for (const h of input.hasil) {
    if (!hasilPerSiswa.has(h.siswaId)) hasilPerSiswa.set(h.siswaId, new Map());
    hasilPerSiswa.get(h.siswaId)!.set(h.sesiId, { skor: h.skor, total: h.total });
  }

  const tindakanPerSiswa = new Map((input.tindakan ?? []).map((t) => [t.siswaId, t]));

  const siswa: SiswaPendampingan[] = input.siswa
    .map(({ id, nama }) => {
      const milik = hasilPerSiswa.get(id);
      const diikuti = jendela.flatMap((s) => {
        const hasil = milik?.get(s.id);
        return hasil ? [hasil] : [];
      });
      const jumlahDikerjakan = diikuti.length;
      const guru = tindakanPerSiswa.get(id);
      const guruValid =
        guru && sesiTerakhirId !== null && guru.sesiTerakhirId === sesiTerakhirId ? guru : null;

      if (jendela.length < JUMLAH_KUIS) {
        return {
          siswaId: id,
          nama,
          kategori: 'belum-cukup' as const,
          rataRata: null,
          jumlahDikerjakan,
          jumlahKuis: jendela.length,
          status: 'belum-cukup' as const,
          sesiTerakhirId,
        };
      }

      if (jumlahDikerjakan < JUMLAH_KUIS) {
        const kategori = 'tidak-mengerjakan' as const;
        const selesaiPendampingan =
          guruValid?.kategori === kategori && guruValid.tindakan === 'selesai';
        return {
          siswaId: id,
          nama,
          kategori,
          rataRata: null,
          jumlahDikerjakan,
          jumlahKuis: JUMLAH_KUIS,
          status: (selesaiPendampingan ? 'selesai' : 'pendampingan') as StatusPendampingan,
          sesiTerakhirId,
        };
      }

      const rataRataMentah =
        diikuti.reduce((jumlah, h) => jumlah + (h.total > 0 ? (h.skor / h.total) * 100 : 0), 0) /
        JUMLAH_KUIS;
      const kategori: KategoriPemahaman =
        rataRataMentah >= BATAS_PAHAM ? 'paham' : rataRataMentah >= BATAS_SETENGAH ? 'setengah' : 'belum';
      const rataRata = Math.round(rataRataMentah * 10) / 10;

      let status: StatusPendampingan;
      if (kategori === 'paham') {
        status = 'paham';
      } else if (kategori === 'setengah') {
        if (guruValid?.kategori !== 'setengah') status = 'menunggu';
        else if (guruValid.tindakan === 'pendampingan') status = 'pendampingan';
        else if (guruValid.tindakan === 'evaluasi') status = 'evaluasi';
        else status = 'selesai';
      } else {
        const selesaiPendampingan =
          guruValid?.kategori === 'belum' && guruValid.tindakan === 'selesai';
        status = selesaiPendampingan ? 'selesai' : 'pendampingan';
      }

      return {
        siswaId: id,
        nama,
        kategori,
        rataRata,
        jumlahDikerjakan,
        jumlahKuis: JUMLAH_KUIS,
        status,
        sesiTerakhirId,
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

  const jumlahKategori = (kategori: KategoriPemahaman) =>
    siswa.filter((s) => s.kategori === kategori).length;

  return {
    siswa,
    ringkasan: {
      jumlahSiswa: input.siswa.length,
      jumlahSesi: input.sesi.length,
      jumlahSesiSelesai: selesai.length,
      jumlahSesiBerjawaban: sesiBerjawaban.size,
      butuhSesi: Math.max(0, JUMLAH_KUIS - jendela.length),
      jumlahPaham: jumlahKategori('paham'),
      jumlahSetengah: jumlahKategori('setengah'),
      jumlahBelum: jumlahKategori('belum'),
      jumlahTidakMengerjakan: jumlahKategori('tidak-mengerjakan'),
    },
  };
}
