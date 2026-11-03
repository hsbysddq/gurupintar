"use client";

import { useEffect, useState } from "react";
import { DaftarSiswaKelompok } from "@/components/DaftarSiswaKelompok";
import { DonutKelompok } from "@/components/DonutKelompok";
import { KartuKaca } from "@/components/KartuKaca";
import { LABEL_KELOMPOK, URUTAN_TAMPIL_KELOMPOK, WARNA_KELOMPOK } from "@/components/BadgeKelompok";
import type { Kelompok, SiswaHasil } from "@/lib/tipe";

type PetaKelasProps = {
  kelompok: Record<Kelompok, SiswaHasil[]>;
  jumlahSiswa: number;
};

const LAMA_SOROTAN_MS = 600;

export function PetaKelas({ kelompok, jumlahSiswa }: PetaKelasProps) {
  const jumlah: Record<Kelompok, number> = {
    sudah: kelompok.sudah.length,
    setengah: kelompok.setengah.length,
    belum: kelompok.belum.length,
  };
  const jumlahMenjawab = jumlah.sudah + jumlah.setengah + jumlah.belum;

  // Angka yang berubah karena polling disorot sekali (design.md 4.7). Dibandingkan saat render,
  // bukan di efek, agar sorotan muncul pada render yang sama dengan angka barunya.
  const [sebelumnya, setSebelumnya] = useState(jumlah);
  const [disorot, setDisorot] = useState<Kelompok[]>([]);
  const berubah = URUTAN_TAMPIL_KELOMPOK.filter((k) => sebelumnya[k] !== jumlah[k]);
  if (berubah.length > 0) {
    setSebelumnya(jumlah);
    setDisorot(berubah);
  }

  useEffect(() => {
    if (disorot.length === 0) return;
    const jadwal = setTimeout(() => setDisorot([]), LAMA_SOROTAN_MS);
    return () => clearTimeout(jadwal);
  }, [disorot]);

  return (
    <KartuKaca as="section" className="flex flex-col gap-6 p-5 sm:gap-8 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl leading-snug font-semibold">Peta kelas</h2>
        <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
          {jumlahMenjawab} dari {jumlahSiswa} siswa sudah dikelompokkan
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          {URUTAN_TAMPIL_KELOMPOK.map((k) => (
            <div
              key={k}
              className={`flex flex-col gap-1 rounded-kecil p-2 transition-colors duration-200 sm:p-3 ${
                disorot.includes(k) ? WARNA_KELOMPOK[k].sorot : ""
              }`}
            >
              <dt className={`text-[12px] leading-normal font-medium sm:text-[13px] ${WARNA_KELOMPOK[k].teks}`}>
                {LABEL_KELOMPOK[k]}
              </dt>
              <dd className={`text-[32px] leading-[1.1] font-bold sm:text-[40px] ${WARNA_KELOMPOK[k].teks}`}>{jumlah[k]}</dd>
            </div>
          ))}
        </dl>
        <DonutKelompok jumlah={jumlah} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {URUTAN_TAMPIL_KELOMPOK.map((k) => (
          <DaftarSiswaKelompok key={k} kelompok={k} siswa={kelompok[k]} />
        ))}
      </div>
    </KartuKaca>
  );
}
