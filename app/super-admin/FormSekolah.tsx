'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { buatSekolah, ErrorApi } from '@/lib/api-klien';

const INPUT =
  'h-12 w-full rounded-2xl border border-white/70 bg-white/70 px-3 font-body text-[14px] text-aura-ink outline-none focus:border-aura-primary/40';

export function FormSekolah() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [alamat, setAlamat] = useState('');
  const [namaAdmin, setNamaAdmin] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [sandiAdmin, setSandiAdmin] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    setSukses(null);
    try {
      const sekolah = await buatSekolah({
        nama,
        kode,
        alamat: alamat || undefined,
        namaAdmin,
        emailAdmin,
        sandiAdmin,
      });
      setSukses(`Sekolah ${sekolah.nama} dan admin berhasil dibuat.`);
      setNama('');
      setKode('');
      setAlamat('');
      setNamaAdmin('');
      setEmailAdmin('');
      setSandiAdmin('');
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Sekolah belum berhasil dibuat.');
    } finally {
      setMemuat(false);
    }
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Nama sekolah
          <input value={nama} onChange={(e) => setNama(e.target.value)} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Kode sekolah
          <input
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            required
            placeholder="SEKOLAH-A"
            className={INPUT}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
        Alamat (opsional)
        <input value={alamat} onChange={(e) => setAlamat(e.target.value)} className={INPUT} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Nama admin
          <input value={namaAdmin} onChange={(e) => setNamaAdmin(e.target.value)} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Email admin
          <input type="email" value={emailAdmin} onChange={(e) => setEmailAdmin(e.target.value)} required className={INPUT} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
        Kata sandi admin
        <input
          type="password"
          value={sandiAdmin}
          onChange={(e) => setSandiAdmin(e.target.value)}
          minLength={8}
          required
          className={INPUT}
        />
      </label>
      {galat && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galat}</p>}
      {sukses && <p role="status" className="text-[13px] font-medium text-[#047857]">{sukses}</p>}
      <Tombol varian="utama" type="submit" memuat={memuat} ikon={Building2} disabled={!nama || !kode || !namaAdmin || !emailAdmin || sandiAdmin.length < 8}>
        Buat sekolah
      </Tombol>
    </form>
  );
}
