export const BATAS_KARAKTER_GAMBAR_SOAL = 800_000;

const TIPE_GAMBAR_SOAL = /^image\/(jpeg|png|webp)$/i;

/** Ambil file gambar pertama dari clipboard; null jika clipboard hanya berisi teks/link. */
export function fileGambarDariClipboard(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items)) {
    if (item.kind === 'file' && TIPE_GAMBAR_SOAL.test(item.type)) {
      return item.getAsFile();
    }
  }
  for (const file of Array.from(data.files)) {
    if (TIPE_GAMBAR_SOAL.test(file.type)) return file;
  }
  return null;
}

/**
 * Mengompres gambar soal (JPEG/PNG/WebP) di browser menjadi data URL JPEG ringan
 * dengan latar putih agar diagram transparan (misalnya bangun datar PNG) tetap terbaca tajam.
 */
export function kompresGambarSoal(file: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      gagal(new Error('Format gambar harus JPEG, PNG, atau WebP.'));
      return;
    }

    const url = URL.createObjectURL(file);
    const gambar = new Image();
    gambar.onload = () => {
      try {
        const maksLebar = 1000;
        const maksTinggi = 800;
        const rasio = Math.min(maksLebar / gambar.width, maksTinggi / gambar.height, 1);
        const kanvas = document.createElement('canvas');
        kanvas.width = Math.max(1, Math.round(gambar.width * rasio));
        kanvas.height = Math.max(1, Math.round(gambar.height * rasio));
        const konteks = kanvas.getContext('2d');
        if (!konteks) throw new Error('Gambar tidak bisa diproses di browser ini.');

        // Latar putih menjaga garis hitam pada PNG transparan tetap jelas.
        konteks.fillStyle = '#FFFFFF';
        konteks.fillRect(0, 0, kanvas.width, kanvas.height);
        konteks.imageSmoothingEnabled = true;
        konteks.imageSmoothingQuality = 'high';
        konteks.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);

        let kualitas = 0.84;
        let hasil = kanvas.toDataURL('image/jpeg', kualitas);
        while (hasil.length > BATAS_KARAKTER_GAMBAR_SOAL - 50_000 && kualitas > 0.45) {
          kualitas -= 0.1;
          hasil = kanvas.toDataURL('image/jpeg', kualitas);
        }
        if (hasil.length > BATAS_KARAKTER_GAMBAR_SOAL) {
          throw new Error('Ukuran gambar terlalu besar. Pilih gambar yang lebih sederhana.');
        }
        selesai(hasil);
      } catch (err) {
        gagal(err instanceof Error ? err : new Error('Gambar tidak bisa diproses.'));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    gambar.onerror = () => {
      URL.revokeObjectURL(url);
      gagal(new Error('File gambar rusak atau tidak bisa dibaca.'));
    };
    gambar.src = url;
  });
}

