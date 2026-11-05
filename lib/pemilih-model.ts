import type { ModelAi } from '@/lib/tipe';

export interface OpsiModel {
  model: ModelAi;
  indeks: number;
}

export interface GrupModel {
  nama: string;
  opsi: OpsiModel[];
}

export function saringModel(daftar: readonly ModelAi[], cari: string): ModelAi[] {
  const kueri = cari.trim().toLowerCase();
  if (!kueri) return [...daftar];
  return daftar.filter((model) =>
    `${model.name} ${model.id} ${model.grup}`.toLowerCase().includes(kueri),
  );
}

export function kelompokkanModel(daftar: readonly ModelAi[]): GrupModel[] {
  const peta = new Map<string, OpsiModel[]>();
  daftar.forEach((model, indeks) => {
    const opsi = peta.get(model.grup);
    if (opsi) opsi.push({ model, indeks });
    else peta.set(model.grup, [{ model, indeks }]);
  });
  return [...peta.entries()].map(([nama, opsi]) => ({ nama, opsi }));
}

export function formatKonteks(nilai: number | null): string | null {
  if (nilai === null || !Number.isFinite(nilai) || nilai <= 0) return null;
  if (nilai >= 1_000_000) {
    const juta = nilai / 1_000_000;
    return `${juta.toFixed(Number.isInteger(juta) ? 0 : 1).replace('.', ',')} jt`;
  }
  if (nilai >= 1_000) return `${Math.round(nilai / 1_000)} rb`;
  return String(nilai);
}
