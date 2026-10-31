'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ErrorApi, keluarKelas } from '@/lib/api-klien';

/**
 * Siswa menghapus kelas dari daftarnya. Meminta konfirmasi dulu karena jawaban dan hasil kuis
 * di kelas itu ikut terhapus; untuk kembali, siswa harus gabung lagi dengan kode undangan.
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
      setGalat(err instanceof ErrorApi ? err.message : 'Kelas belum berhasil dihapus. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  if (!konfirmasi) {
    return (
      <button
        type="button"
        onClick={() => setKonfirmasi(true)}
        className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[14px] leading-normal font-semibold text-belum-teks hover:bg-belum-latar"
      >
        Hapus kelas
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label={`Hapus kelas ${mapel}`} className="flex flex-col gap-2 rounded-xl bg-belum-latar p-3">
      <p className="text-[13px] leading-normal font-medium text-belum-teks">
        Hapus kelas {mapel}? Jawaban dan hasil kuismu di kelas ini ikut terhapus. Untuk masuk lagi, kamu perlu kode undangan dari gurumu.
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
          {memuat ? 'Menghapus…' : 'Ya, hapus'}
        </button>
        <button
          type="button"
          onClick={() => setKonfirmasi(false)}
          disabled={memuat}
          className="inline-flex min-h-11 items-center rounded-xl px-4 text-[14px] leading-normal font-semibold text-tinta-lembut hover:bg-tinta/5"
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
