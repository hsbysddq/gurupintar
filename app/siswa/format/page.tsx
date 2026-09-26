"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KerangkaSiswa } from "@/components/KerangkaSiswa";
import { PilihanFormat } from "@/components/PilihanFormat";
import { StatusHalaman } from "@/components/StatusHalaman";
import { Tombol } from "@/components/Tombol";
import { useIdentitasSiswa } from "@/hooks/use-identitas-siswa";
import { ErrorApi, kirimFormat } from "@/lib/api-klien";
import { simpanFormatLokal } from "@/lib/sesi-lokal";
import type { Format } from "@/lib/tipe";

export default function HalamanPilihFormat() {
  const router = useRouter();
  const identitas = useIdentitasSiswa();
  const [pilihan, setPilihan] = useState<Format | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  // AC-1.7: belum ada identitas → kembali ke halaman gabung.
  useEffect(() => {
    if (identitas === null) router.replace("/siswa");
  }, [identitas, router]);

  if (!identitas) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="memuat" judul="Memuat halaman" />
      </KerangkaSiswa>
    );
  }

  const nilai = pilihan ?? identitas.format;

  async function lanjut() {
    if (!identitas || !nilai) return;
    setMemuat(true);
    setGalat(null);
    try {
      await kirimFormat(identitas.siswaId, nilai);
      simpanFormatLokal(nilai);
      router.push("/siswa/kuis");
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : "Terjadi kesalahan. Coba lagi sebentar.");
      setMemuat(false);
    }
  }

  return (
    <KerangkaSiswa
      aksi={
        <>
          {galat && (
            <p role="alert" className="text-belum-teks">
              {galat}
            </p>
          )}
          <Tombol varian="utama" ukuran="besar" lebarPenuh disabled={!nilai} memuat={memuat} onClick={lanjut}>
            Lanjut
          </Tombol>
        </>
      }
    >
      <header className="flex flex-col gap-2">
        <p className="text-[13px] leading-normal font-medium text-tinta-lembut">Halo, {identitas.namaSiswa}</p>
        <h1 className="text-[28px] leading-tight font-bold">Kamu lebih suka belajar lewat apa?</h1>
      </header>
      <PilihanFormat nilai={nilai} onPilih={setPilihan} />
      <p className="text-tinta-lembut">Kamu bisa ganti kapan saja.</p>
    </KerangkaSiswa>
  );
}
