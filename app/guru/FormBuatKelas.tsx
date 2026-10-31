'use client';

import { useState, type FormEvent } from 'react';
import GambarNext from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, ImagePlus, Loader2, Plus, School } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { buatKelas, ErrorApi } from '@/lib/api-klien';

const WARNA_PILIHAN = [
  { label: 'Biru', hex: '#2563EB' },
  { label: 'Ungu', hex: '#7C3AED' },
  { label: 'Hijau', hex: '#059669' },
  { label: 'Amber', hex: '#D97706' },
  { label: 'Rose', hex: '#E11D48' },
  { label: 'Slate', hex: '#0F172A' },
];

function kompresGambar(file: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const url = URL.createObjectURL(file);
    const gambar = new Image();
    gambar.onload = () => {
      try {
        const maksLebar = 1200;
        const maksTinggi = 600;
        const rasio = Math.min(maksLebar / gambar.width, maksTinggi / gambar.height, 1);
        const kanvas = document.createElement('canvas');
        kanvas.width = Math.max(1, Math.round(gambar.width * rasio));
        kanvas.height = Math.max(1, Math.round(gambar.height * rasio));
        const konteks = kanvas.getContext('2d');
        if (!konteks) throw new Error('Gambar tidak bisa diproses.');
        konteks.imageSmoothingQuality = 'high';
        konteks.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);

        let kualitas = 0.8;
        let hasil = kanvas.toDataURL('image/jpeg', kualitas);
        while (hasil.length > 850_000 && kualitas > 0.45) {
          kualitas -= 0.1;
          hasil = kanvas.toDataURL('image/jpeg', kualitas);
        }
        if (hasil.length > 900_000) throw new Error('Foto terlalu besar. Pilih foto lain.');
        selesai(hasil);
      } catch (err) {
        gagal(err instanceof Error ? err : new Error('Gambar tidak bisa diproses.'));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    gambar.onerror = () => {
      URL.revokeObjectURL(url);
      gagal(new Error('Gambar tidak bisa dibaca. Coba file lain.'));
    };
    gambar.src = url;
  });
}

export function FormBuatKelas({ pertamaKali = false }: { pertamaKali?: boolean }) {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [mapel, setMapel] = useState('');
  const [warna, setWarna] = useState<string | null>(null);
  const [sampul, setSampul] = useState<string | null>(null);
  const [memprosesFoto, setMemprosesFoto] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [galatFoto, setGalatFoto] = useState<string | null>(null);

  async function pilihFoto(file: File | null) {
    if (!file) return;
    setGalatFoto(null);
    if (!file.type.startsWith('image/')) {
      setGalatFoto('File harus berupa gambar.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setGalatFoto('Ukuran gambar maksimal 8 MB.');
      return;
    }
    setMemprosesFoto(true);
    try {
      setSampul(await kompresGambar(file));
    } catch (err) {
      setGalatFoto(err instanceof Error ? err.message : 'Foto belum bisa diproses.');
    } finally {
      setMemprosesFoto(false);
    }
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      const baru = await buatKelas({
        nama,
        mapel,
        ...(warna ? { warna } : {}),
        ...(sampul ? { sampul } : {}),
      });
      router.push(`/guru/kelas?kelas=${baru.id}`);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Kelas belum berhasil dibuat. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <section className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-aura-primary via-aura-violet to-aura-emerald"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-aura-primary/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex w-fit items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-aura-primary">
            <span className="flex size-7 items-center justify-center rounded-lg bg-aura-primary/10 ring-1 ring-white/70">
              <School aria-hidden="true" className="size-3.5" />
            </span>
            Kelas baru
          </span>
          <h2 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.015em] text-aura-ink">
            {pertamaKali ? 'Buat kelas pertamamu' : 'Buat kelas baru'}
          </h2>
          <p className="font-body text-[13px] leading-[20px] text-aura-muted">
            Siswa mendaftar dengan kode undangan kelas. Setiap kelas punya kuis dan materinya sendiri.
          </p>
        </div>

        <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="kelas-baru-nama"
                className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted"
              >
                Nama kelas
              </label>
              <input
                id="kelas-baru-nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Kelas 7B"
                required
                className="h-12 rounded-2xl border border-white/70 bg-white/65 px-3.5 font-body text-base text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="kelas-baru-mapel"
                className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted"
              >
                Mata pelajaran
              </label>
              <input
                id="kelas-baru-mapel"
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                placeholder="Biologi"
                required
                className="h-12 rounded-2xl border border-white/70 bg-white/65 px-3.5 font-body text-base text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85"
              />
            </div>
            <Tombol
              varian="utama"
              type="submit"
              ikon={Plus}
              memuat={memuat}
              disabled={!nama.trim() || !mapel.trim() || memprosesFoto}
            >
              Buat kelas
            </Tombol>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/35 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-muted">
                  Tampilan kartu <span className="font-body text-[10px] font-medium normal-case tracking-normal text-aura-muted/80">(opsional)</span>
                </p>
                <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">
                  Pilih warna aksen atau unggah foto sampul untuk membedakan kelas.
                </p>
              </div>
              {sampul && (
                <button
                  type="button"
                  onClick={() => {
                    setSampul(null);
                    setGalatFoto(null);
                  }}
                  className="rounded-full px-2.5 py-1 font-display text-[11px] font-semibold text-aura-red hover:bg-aura-red/10"
                >
                  Hapus foto
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {WARNA_PILIHAN.map((pilihan) => {
                  const terpilih = warna === pilihan.hex;
                  return (
                    <button
                      key={pilihan.hex}
                      type="button"
                      aria-label={`Warna ${pilihan.label}`}
                      aria-pressed={terpilih}
                      onClick={() => setWarna(terpilih ? null : pilihan.hex)}
                      className={`flex size-8 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white/50 transition-all ${
                        terpilih ? 'ring-aura-ink' : 'ring-transparent hover:ring-white/90'
                      }`}
                      style={{ backgroundColor: pilihan.hex }}
                    >
                      {terpilih && <Check aria-hidden="true" className="size-4 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>

              <span aria-hidden="true" className="hidden h-6 w-px bg-white/70 sm:block" />

              <input
                id="kelas-baru-sampul"
                type="file"
                accept="image/*"
                disabled={memprosesFoto}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  e.target.value = '';
                  void pilihFoto(file);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor="kelas-baru-sampul"
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 font-display text-[11px] font-semibold text-aura-ink transition-colors hover:bg-white/80 peer-disabled:cursor-wait peer-disabled:opacity-60"
              >
                {memprosesFoto ? (
                  <Loader2 aria-hidden="true" className="size-3.5 animate-spin text-aura-primary" />
                ) : (
                  <ImagePlus aria-hidden="true" className="size-3.5 text-aura-primary" />
                )}
                {memprosesFoto ? 'Memproses foto…' : sampul ? 'Ganti foto' : 'Unggah foto'}
              </label>

              {sampul && (
                <div className="relative h-12 w-24 overflow-hidden rounded-xl border border-white/70 bg-white/50">
                  <GambarNext
                    src={sampul}
                    alt="Pratinjau sampul kelas"
                    width={96}
                    height={48}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>

            {galatFoto && (
              <p role="alert" className="font-body text-[12px] leading-[18px] font-medium text-aura-red">
                {galatFoto}
              </p>
            )}
          </div>
        </form>

        {galat && (
          <p role="alert" className="font-body text-[13px] leading-[20px] font-medium text-[#93000a]">
            {galat}
          </p>
        )}
      </div>
    </section>
  );
}
