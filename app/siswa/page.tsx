"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KerangkaSiswa } from "@/components/KerangkaSiswa";
import { StatusHalaman } from "@/components/StatusHalaman";
import { Tombol } from "@/components/Tombol";
import { ambilSesi, ErrorApi } from "@/lib/api-klien";
import { simpanIdentitas } from "@/lib/sesi-lokal";
import { normalisasiKode } from "@/lib/skema-api";
import type { SesiUntukSiswa } from "@/lib/tipe";

export default function HalamanGabungKelas() {
  return (
    <Suspense
      fallback={
        <KerangkaSiswa>
          <StatusHalaman jenis="memuat" judul="Memuat halaman" />
        </KerangkaSiswa>
      }
    >
      <GabungKelas />
    </Suspense>
  );
}

function GabungKelas() {
  const router = useRouter();
  const params = useSearchParams();
  const [kode, setKode] = useState(() => normalisasiKode(params.get("kode") ?? ""));
  const [kelas, setKelas] = useState<SesiUntukSiswa | null>(null);
  const [siswaId, setSiswaId] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function cariKelas(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      setKelas(await ambilSesi(kode));
      setSiswaId(null);
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : "Terjadi kesalahan. Coba lagi sebentar.");
    } finally {
      setMemuat(false);
    }
  }

  function gantiKode() {
    setKelas(null);
    setSiswaId(null);
  }

  function masuk() {
    const siswa = kelas?.siswa.find((s) => s.id === siswaId);
    if (!kelas || !siswa) return;
    simpanIdentitas({
      sesiId: kelas.sesi.id,
      kodeKelas: kelas.sesi.kodeKelas,
      siswaId: siswa.id,
      namaSiswa: siswa.nama,
      format: null,
    });
    router.push("/siswa/format");
  }

  if (!kelas) {
    return (
      <KerangkaSiswa>
        <header className="flex flex-col gap-2">
          <p className="text-[13px] leading-normal font-medium text-primer">Guru Pintar</p>
          <h1 className="text-[28px] leading-tight font-bold">Masukkan kode kelas</h1>
          <p className="text-tinta-lembut">Kode kelas ada di layar gurumu.</p>
        </header>

        <form onSubmit={cariKelas} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="kode" className="text-[13px] leading-normal font-medium text-tinta-lembut">
              Kode kelas
            </label>
            <input
              id="kode"
              name="kode"
              value={kode}
              onChange={(e) => setKode(normalisasiKode(e.target.value))}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={6}
              placeholder="A7K2P"
              aria-invalid={galat ? true : undefined}
              aria-describedby={galat ? "galat-kode" : undefined}
              className="kaca h-13 rounded-tombol px-4 text-2xl font-bold tracking-[0.3em] placeholder:text-tinta-lembut/50"
            />
            {galat && (
              <p id="galat-kode" role="alert" className="text-belum-teks">
                {galat}
              </p>
            )}
          </div>
          <Tombol varian="utama" ukuran="besar" type="submit" lebarPenuh memuat={memuat} disabled={kode.length === 0}>
            Lanjut
          </Tombol>
        </form>
      </KerangkaSiswa>
    );
  }

  return (
    <KerangkaSiswa
      aksi={
        <Tombol varian="utama" ukuran="besar" lebarPenuh disabled={!siswaId} onClick={masuk}>
          Masuk
        </Tombol>
      }
    >
      <header className="flex flex-col gap-2">
        <p className="text-[13px] leading-normal font-medium text-tinta-lembut">
          {kelas.sesi.namaKelas} · {kelas.sesi.namaTopik} · Kode {kelas.sesi.kodeKelas}
        </p>
        <h1 className="text-[28px] leading-tight font-bold">Pilih namamu</h1>
        <div>
          <Tombol varian="teks" onClick={gantiKode}>
            Ganti kode
          </Tombol>
        </div>
      </header>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Daftar nama siswa</legend>
        {kelas.siswa.map((s) => (
          <label
            key={s.id}
            className="kaca flex min-h-13 cursor-pointer items-center gap-3 px-4 has-checked:bg-primer-lembut has-checked:font-semibold"
          >
            <input
              type="radio"
              name="siswa"
              value={s.id}
              checked={siswaId === s.id}
              onChange={() => setSiswaId(s.id)}
              className="size-5 accent-primer"
            />
            {s.nama}
          </label>
        ))}
      </fieldset>
    </KerangkaSiswa>
  );
}
