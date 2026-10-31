'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ErrorApi, keluarKelas } from '@/lib/api-klien';

/**
 * Siswa keluar dari sebuah mata pelajaran. Meminta konfirmasi dulu karena jawaban dan hasil kuis
 * di mapel itu ikut terhapus; untuk kembali, siswa harus gabung lagi dengan kode undangan.
 */
export function TombolHapusKelas({ kelasId, mapel }: { kelasId: string; mapel: string }) {
  const router = useRouter();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function hapus() {
    setMemuat(true);
    setGalat(null);
    try {
      await keluarKelas(kelasId);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Belum berhasil keluar dari mapel. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  if (!konfirmasi) {
    return (
      <button
        type="button"
        onClick={() => setKonfirmasi(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[13px] leading-normal font-semibold text-belum-teks hover:bg-belum-latar"
      >
        Keluar dari mapel
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label={`Keluar dari mapel ${mapel}`} className="flex flex-col gap-2 rounded-xl bg-belum-latar p-3">
      <p className="text-[13px] leading-normal font-medium text-belum-teks">
        Keluar dari {mapel}? Jawaban dan hasil kuismu di mata pelajaran ini ikut terhapus. Untuk masuk lagi, kamu perlu kode undangan dari gurumu.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={hapus}
          disabled={memuat}
          aria-busy={memuat || undefined}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-belum px-4 text-[14px] leading-normal font-semibold text-white disabled:opacity-60"
        >
          {memuat && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {memuat ? 'Keluar…' : 'Ya, keluar'}
        </button>
        <button
          type="button"
          onClick={() => setKonfirmasi(false)}
          disabled={memuat}
          className="inline-flex min-h-11 items-center rounded-full px-4 text-[13px] leading-normal font-semibold text-aura-muted hover:bg-aura-ink/5"
        >
          Batal
        </button>
      </div>
      {galat && (
        <p role="alert" className="text-[13px] leading-normal font-medium text-belum-teks">
          {galat}
        </p>
      )}
    </div>
  );
}
