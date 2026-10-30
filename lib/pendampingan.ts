import type {
  DataPendampingan,
  KategoriPemahaman,
  SiswaPendampingan,
  StatusPendampingan,
  TindakanPendampingan,
} from './tipe';

export const BATAS_PAHAM = 70;
export const BATAS_SETENGAH = 50;

export interface TindakanTersimpan {
  siswaId: string;
  sesiId: string;
  kategori: KategoriPemahaman;
  tindakan: TindakanPendampingan;
}

export interface InputPendampingan {
  sesi: { id: string; dibuatPada: string } | null;
  hasil: { siswaId: string; skor: number; total: number }[];
  siswa: { id: string; nama: string }[];
  tindakan?: TindakanTersimpan[];
}

/**
 * Kategori dihitung dari satu hasil kuis terpilih:
 * >=70% paham, 50–<70% setengah paham, <50% belum paham.
 * Siswa tanpa hasil pada kuis itu masuk "tidak mengerjakan".
 */
export function hitungPendampingan(input: InputPendampingan): DataPendampingan {
  const hasilPerSiswa = new Map(input.hasil.map((h) => [h.siswaId, h]));
  const tindakanPerSiswa = new Map((input.tindakan ?? []).map((t) => [t.siswaId, t]));

  const siswa: SiswaPendampingan[] = input.siswa
    .map(({ id, nama }) => {
      if (!input.sesi) {
        return {
          siswaId: id,
          nama,
          kategori: 'belum-cukup' as const,
          nilai: null,
          status: 'belum-cukup' as const,
          sesiId: null,
        };
      }

      const hasil = hasilPerSiswa.get(id);
      const guru = tindakanPerSiswa.get(id);
      const guruValid = guru && guru.sesiId === input.sesi.id ? guru : null;
      const sesiId = input.sesi.id;

      if (!hasil) {
        const selesaiPendampingan =
          guruValid?.kategori === 'tidak-mengerjakan' && guruValid.tindakan === 'selesai';
        return {
          siswaId: id,
          nama,
          kategori: 'tidak-mengerjakan' as const,
          nilai: null,
          status: (selesaiPendampingan ? 'selesai' : 'pendampingan') as StatusPendampingan,
          sesiId,
        };
      }

      const persen = hasil.total > 0 ? (hasil.skor / hasil.total) * 100 : 0;
      const kategori: KategoriPemahaman =
        persen >= BATAS_PAHAM ? 'paham' : persen >= BATAS_SETENGAH ? 'setengah' : 'belum';
      const nilai = Math.round(persen * 10) / 10;

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

      return { siswaId: id, nama, kategori, nilai, status, sesiId };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

  const jumlahKategori = (kategori: KategoriPemahaman) =>
    siswa.filter((s) => s.kategori === kategori).length;

  return {
    siswa,
    ringkasan: {
      jumlahSiswa: input.siswa.length,
      jumlahSesiSelesai: 0,
      jumlahMenjawab: input.hasil.length,
      sesiTerpilihId: input.sesi?.id ?? null,
      daftarSesi: [],
      jumlahPaham: jumlahKategori('paham'),
      jumlahSetengah: jumlahKategori('setengah'),
      jumlahBelum: jumlahKategori('belum'),
      jumlahTidakMengerjakan: jumlahKategori('tidak-mengerjakan'),
    },
  };
}
