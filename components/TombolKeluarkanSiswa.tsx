'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorApi, keluarkanSiswa } from '@/lib/api-klien';

export function TombolKeluarkanSiswa({
  kelasId,
  siswaId,
  nama,
}: {
  kelasId: string;
  siswaId: string;
  nama: string;
}) {
  const router = useRouter();
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function keluarkan() {
    setMemuat(true);
    setGalat(null);
    try {
      await keluarkanSiswa({ kelasId, siswaId });
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Siswa belum berhasil dikeluarkan.');
      setMemuat(false);
    }
  }

  if (!konfirmasi) {
    return (
      <button
        type="button"
        onClick={() => setKonfirmasi(true)}
        className="inline-flex min-h-11 items-center rounded-full px-3 text-[12px] leading-normal font-semibold text-belum-teks hover:bg-belum-latar"
      >
        Keluarkan
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] leading-normal font-medium text-tinta-lembut">
        Hapus jawaban & hasil {nama}?
      </span>
      <button
        type="button"
        onClick={keluarkan}
        disabled={memuat}
        className="inline-flex min-h-11 items-center rounded-full bg-belum-latar px-3 text-[12px] leading-normal font-semibold text-belum-teks disabled:opacity-60"
      >
        {memuat ? 'Mengeluarkan…' : 'Ya, keluarkan'}
      </button>
      <button
        type="button"
        onClick={() => setKonfirmasi(false)}
        disabled={memuat}
        className="inline-flex min-h-11 items-center rounded-full px-3 text-[12px] leading-normal font-semibold text-tinta-lembut hover:bg-tinta/5"
      >
        Batal
      </button>
      {galat && (
        <span role="alert" className="text-[12px] leading-normal font-medium text-belum-teks">
          {galat}
        </span>
      )}
    </span>
  );
}
