import type { SoalTersulit } from './tipe';

type SoalDinilai = { id: string; nomor: number; teks: string; miskonsepsi: Record<string, string> };
type JawabanDinilai = { soalId: string; pilihan: string; benar: boolean };

/**
 * Soal dengan persentase salah tertinggi (seri → nomor terkecil), beserta miskonsepsi dari pilihan salah
 * yang paling sering dipilih (seri → kode abjad terkecil). `null` jika tidak ada jawaban (architecture.md 8.3).
 */
export function cariSoalTersulit(soal: SoalDinilai[], jawaban: JawabanDinilai[]): SoalTersulit | null {
  const statistik = new Map<string, { total: number; salah: number; pilihanSalah: Map<string, number> }>();
  for (const s of soal) statistik.set(s.id, { total: 0, salah: 0, pilihanSalah: new Map() });

  for (const j of jawaban) {
    const st = statistik.get(j.soalId);
    if (!st) continue;
    st.total++;
    if (!j.benar) {
      st.salah++;
      st.pilihanSalah.set(j.pilihan, (st.pilihanSalah.get(j.pilihan) ?? 0) + 1);
    }
  }

  let terpilih: { soal: SoalDinilai; rasio: number } | null = null;
  for (const s of [...soal].sort((a, b) => a.nomor - b.nomor)) {
    const st = statistik.get(s.id);
    if (!st || st.total === 0) continue;
    const rasio = st.salah / st.total;
    if (!terpilih || rasio > terpilih.rasio) terpilih = { soal: s, rasio };
  }
  if (!terpilih) return null;

  const pilihanSalah = statistik.get(terpilih.soal.id)!.pilihanSalah;
  let kodeTerbanyak: string | null = null;
  let jumlahTerbanyak = 0;
  for (const [kode, jumlah] of [...pilihanSalah].sort(([a], [b]) => a.localeCompare(b))) {
    if (jumlah > jumlahTerbanyak) {
      kodeTerbanyak = kode;
      jumlahTerbanyak = jumlah;
    }
  }

  return {
    nomor: terpilih.soal.nomor,
    teks: terpilih.soal.teks,
    persenSalah: Math.round(terpilih.rasio * 100),
    miskonsepsi: (kodeTerbanyak && terpilih.soal.miskonsepsi[kodeTerbanyak]) || null,
  };
}
