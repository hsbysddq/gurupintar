'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { Tombol } from '@/components/Tombol';
import { ambilDaftarTopik, bukaSesiBanyak, ErrorApi } from '@/lib/api-klien';
import { TOPIK_DEMO_ID } from '@/lib/konstanta';
import type { KelasRingkas, SesiBanyakBaru, TopikRingkas } from '@/lib/tipe';

export function FormKuisBanyak({ kelas }: { kelas: KelasRingkas[] }) {
  const router = useRouter();
  const idTopik = useId();
  const [terbuka, setTerbuka] = useState(false);
  const [dipilih, setDipilih] = useState<Set<string>>(new Set());
  const [daftarTopik, setDaftarTopik] = useState<TopikRingkas[] | null>(null);
  const [galatTopik, setGalatTopik] = useState(false);
  const [topikId, setTopikId] = useState(TOPIK_DEMO_ID);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<SesiBanyakBaru | null>(null);

  useEffect(() => {
    if (!terbuka || daftarTopik) return;
    let batal = false;
    ambilDaftarTopik()
      .then((topik) => {
        if (!batal) setDaftarTopik(topik);
      })
      .catch(() => {
        if (!batal) setGalatTopik(true);
      });
    return () => {
      batal = true;
    };
  }, [terbuka, daftarTopik]);

  if (kelas.length < 2) return null;

  const kelasTerpilih = kelas.filter((k) => dipilih.has(k.id));
  const adaKuisAktifTerpilih = kelasTerpilih.some((k) => k.kuisAktif);

  function ubahPilihan(id: string) {
    setDipilih((lama) => {
      const baru = new Set(lama);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (dipilih.size === 0) return;
    setMemuat(true);
    setGalat(null);
    setHasil(null);
    try {
      const respons = await bukaSesiBanyak({ kelasIds: [...dipilih], topikId });
      setHasil(respons);
      setDipilih(new Set());
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Kuis belum berhasil dibuka. Coba lagi sebentar.');
    } finally {
      setMemuat(false);
    }
  }

  return (
    <KartuKaca as="section" className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-xl leading-snug font-semibold">
            <Layers aria-hidden="true" className="size-5 text-primer" />
            Buka kuis untuk beberapa kelas
          </h2>
          <p className="text-tinta-lembut">Satu topik, satu sesi dan kode sendiri untuk tiap kelas.</p>
        </div>
        <Tombol varian={terbuka ? 'sekunder' : 'utama'} onClick={() => setTerbuka((v) => !v)}>
          {terbuka ? 'Tutup' : 'Pilih kelas'}
        </Tombol>
      </div>

      {terbuka && (
        <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Pilih kelas</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {kelas.map((k) => (
                <label
                  key={k.id}
                  className="flex min-h-12 cursor-pointer items-start gap-3 rounded-kecil border border-tinta/10 px-3 py-2 has-checked:border-primer has-checked:bg-primer-lembut"
                >
                  <input
                    type="checkbox"
                    checked={dipilih.has(k.id)}
                    onChange={() => ubahPilihan(k.id)}
                    className="mt-1 size-5 shrink-0 accent-primer"
                  />
                  <span className="flex flex-col">
                    <span className="font-semibold">{k.nama}</span>
                    <span className="text-[12px] leading-normal text-tinta-lembut">
                      {k.mapel} · {k.jumlahSiswa} siswa
                      {k.kuisAktif ? ` · aktif ${k.kuisAktif.kodeKelas}` : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <label htmlFor={idTopik} className="text-[13px] leading-normal font-medium text-tinta-lembut">
                Topik kuis
              </label>
              <select
                id={idTopik}
                value={topikId}
                disabled={!daftarTopik || memuat}
                onChange={(e) => setTopikId(e.target.value)}
                className="h-12 min-w-[220px] rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta disabled:opacity-60"
              >
                {daftarTopik ? (
                  daftarTopik.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama}
                    </option>
                  ))
                ) : (
                  <option value={TOPIK_DEMO_ID}>{galatTopik ? 'Pecahan Senilai' : 'Memuat topik…'}</option>
                )}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tombol
                varian="teks"
                type="button"
                onClick={() => setDipilih(new Set(kelas.map((k) => k.id)))}
                disabled={memuat}
              >
                Pilih semua
              </Tombol>
              <Tombol varian="utama" type="submit" memuat={memuat} disabled={dipilih.size === 0}>
                Buka kuis di {dipilih.size} kelas
              </Tombol>
            </div>
          </div>

          {adaKuisAktifTerpilih && (
            <p role="status" className="text-[13px] leading-normal font-medium text-setengah-teks">
              Kuis yang sedang aktif di kelas terpilih akan ditutup dan diganti.
            </p>
          )}

          {galat && (
            <p role="alert" className="font-medium text-belum-teks">
              {galat}
            </p>
          )}
        </form>
      )}

      {hasil && (
        <div className="flex flex-col gap-2 rounded-kecil bg-primer-lembut/60 p-3">
          <h3 className="font-semibold">Hasil</h3>
          {hasil.sesi.length > 0 && (
            <ul className="flex flex-col gap-2">
              {hasil.sesi.map((s) => (
                <li key={s.kelasId} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
                  <Link href={`/guru/kelas?kelas=${s.kelasId}`} className="font-semibold text-primer hover:underline">
                    {s.namaKelas}
                  </Link>
                  <span>
                    kode <strong className="tracking-wide">{s.kodeKelas}</strong>
                  </span>
                  <Link
                    href={`/guru/hasil?sesi=${s.id}&kelas=${s.kelasId}`}
                    className="font-semibold text-primer hover:underline"
                  >
                    Lihat hasil
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {hasil.gagal.length > 0 && (
            <ul role="alert" className="flex flex-col gap-1 text-[14px] font-medium text-belum-teks">
              {hasil.gagal.map((g) => (
                <li key={g.kelasId}>
                  {g.namaKelas}: {g.pesan}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </KartuKaca>
  );
}
