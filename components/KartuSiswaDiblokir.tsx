"use client";

import { useState } from "react";
import { LockOpen, ShieldAlert } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { bukaBlokirSiswa, ErrorApi } from "@/lib/api-klien";
import type { SiswaDiblokirGuru } from "@/lib/tipe";

type Props = {
  sesiId: string;
  siswa: SiswaDiblokirGuru[];
  /** Dipanggil setelah blokir dibuka agar data hasil dimuat ulang. */
  onDibuka: () => void;
};

/** Siswa yang diblokir karena meninggalkan halaman kuis. Siswa tidak bisa mengerjakan lagi sampai guru membukanya. */
export function KartuSiswaDiblokir({ sesiId, siswa, onDibuka }: Props) {
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  if (siswa.length === 0) return null;

  async function buka(siswaId: string) {
    setSibuk(siswaId);
    setGalat(null);
    try {
      await bukaBlokirSiswa({ sesiId, siswaId });
      onDibuka();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : "Blokir belum berhasil dibuka. Coba lagi sebentar.");
    } finally {
      setSibuk(null);
    }
  }

  return (
    <KartuKaca varian="pekat" as="section" className="flex flex-col gap-3 p-4">
      <h2 className="inline-flex items-center gap-2 text-xl leading-snug font-semibold">
        <ShieldAlert aria-hidden="true" className="size-5 text-belum-teks" />
        Diblokir karena curang ({siswa.length})
      </h2>
      <p className="text-[14px] leading-normal text-tinta-lembut">
        Siswa ini meninggalkan halaman kuis 3 kali dan tidak bisa mengerjakan lagi sampai kamu membuka blokirnya.
      </p>
      <ul className="flex flex-col gap-2">
        {siswa.map((s) => (
          <li key={s.siswaId} className="flex flex-wrap items-center justify-between gap-3 rounded-kecil bg-belum-latar px-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-belum-teks">{s.nama}</p>
              {s.jumlahBlokir > 1 && (
                <p className="text-[13px] leading-normal text-belum-teks">Sudah {s.jumlahBlokir} kali diblokir di kuis ini</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void buka(s.siswaId)}
              disabled={sibuk !== null}
              aria-busy={sibuk === s.siswaId || undefined}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-belum-teks/30 bg-white px-4 font-display text-[13px] font-bold text-belum-teks hover:bg-white/80 disabled:opacity-60"
            >
              <LockOpen aria-hidden="true" className="size-4" />
              {sibuk === s.siswaId ? "Membuka…" : "Buka blokir"}
            </button>
          </li>
        ))}
      </ul>
      {galat && (
        <p role="alert" className="text-[13px] leading-normal font-medium text-belum-teks">
          {galat}
        </p>
      )}
    </KartuKaca>
  );
}
