// Satu-satunya modul yang boleh memakai localStorage (design.md bagian 5).
import type { Format } from './tipe';

export interface IdentitasSiswa {
  sesiId: string;
  kodeKelas: string;
  siswaId: string;
  namaSiswa: string;
  format: Format | null;
}

const KUNCI = 'guru-pintar:identitas';
const PERISTIWA = 'guru-pintar:identitas-berubah';

function penyimpanan(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Nilai mentah (string) agar bisa dipakai sebagai snapshot useSyncExternalStore. */
export function bacaIdentitasMentah(): string | null {
  try {
    return penyimpanan()?.getItem(KUNCI) ?? null;
  } catch {
    return null;
  }
}

export function uraiIdentitas(mentah: string | null): IdentitasSiswa | null {
  if (!mentah) return null;
  try {
    const data: unknown = JSON.parse(mentah);
    if (
      typeof data === 'object' &&
      data !== null &&
      'sesiId' in data && typeof data.sesiId === 'string' &&
      'kodeKelas' in data && typeof data.kodeKelas === 'string' &&
      'siswaId' in data && typeof data.siswaId === 'string' &&
      'namaSiswa' in data && typeof data.namaSiswa === 'string'
    ) {
      const format = 'format' in data && typeof data.format === 'string' ? (data.format as Format) : null;
      return { sesiId: data.sesiId, kodeKelas: data.kodeKelas, siswaId: data.siswaId, namaSiswa: data.namaSiswa, format };
    }
    return null;
  } catch {
    return null;
  }
}

export function ambilIdentitas(): IdentitasSiswa | null {
  return uraiIdentitas(bacaIdentitasMentah());
}

function tulis(nilai: string | null) {
  try {
    const simpanan = penyimpanan();
    if (!simpanan) return;
    if (nilai === null) simpanan.removeItem(KUNCI);
    else simpanan.setItem(KUNCI, nilai);
    window.dispatchEvent(new Event(PERISTIWA));
  } catch {
    // Penyimpanan diblokir (misalnya mode privat); alur tetap berjalan tanpa identitas tersimpan.
  }
}

export function simpanIdentitas(identitas: IdentitasSiswa) {
  tulis(JSON.stringify(identitas));
}

export function simpanFormatLokal(format: Format) {
  const identitas = ambilIdentitas();
  if (identitas) simpanIdentitas({ ...identitas, format });
}

export function hapusIdentitas() {
  tulis(null);
}

/** Berlangganan perubahan identitas (tab ini maupun tab lain). */
export function berlanggananIdentitas(panggil: () => void): () => void {
  window.addEventListener('storage', panggil);
  window.addEventListener(PERISTIWA, panggil);
  return () => {
    window.removeEventListener('storage', panggil);
    window.removeEventListener(PERISTIWA, panggil);
  };
}
