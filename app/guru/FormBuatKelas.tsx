'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { Tombol } from '@/components/Tombol';
import { buatKelas, ErrorApi } from '@/lib/api-klien';

export function FormBuatKelas({ pertamaKali = false }: { pertamaKali?: boolean }) {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [mapel, setMapel] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    try {
      const baru = await buatKelas({ nama, mapel });
      router.push(`/guru/kelas?kelas=${baru.id}`);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Kelas belum berhasil dibuat. Coba lagi sebentar.');
      setMemuat(false);
    }
  }

  return (
    <KartuKaca as="section" className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl leading-snug font-semibold">{pertamaKali ? 'Buat kelas pertamamu' : 'Buat kelas baru'}</h2>
        <p className="text-tinta-lembut">
          Siswa mendaftar dengan kode undangan kelas. Setiap kelas punya kuis dan materinya sendiri.
        </p>
      </div>

      <form onSubmit={kirim} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="kelas-baru-nama" className="text-[13px] leading-normal font-medium text-tinta-lembut">
            Nama kelas
          </label>
          <input
            id="kelas-baru-nama"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Kelas 7B"
            required
            className="h-12 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta placeholder:text-tinta-lembut/60"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="kelas-baru-mapel" className="text-[13px] leading-normal font-medium text-tinta-lembut">
            Mata pelajaran
          </label>
          <input
            id="kelas-baru-mapel"
            value={mapel}
            onChange={(e) => setMapel(e.target.value)}
            placeholder="Biologi"
            required
            className="h-12 rounded-kecil border border-tinta/15 bg-white/80 px-3 text-base text-tinta placeholder:text-tinta-lembut/60"
          />
        </div>
        <Tombol varian="utama" type="submit" ikon={Plus} memuat={memuat} disabled={!nama.trim() || !mapel.trim()}>
          Buat kelas
        </Tombol>
      </form>

      {galat && (
        <p role="alert" className="font-medium text-belum-teks">
          {galat}
        </p>
      )}
    </KartuKaca>
  );
}
