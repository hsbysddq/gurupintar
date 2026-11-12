'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { buatAdminSekolah, ErrorApi } from '@/lib/api-klien';
import type { Sekolah } from '@/lib/tipe';

const INPUT =
  'h-12 w-full rounded-2xl border border-white/70 bg-white/70 px-3 font-body text-[14px] text-aura-ink outline-none focus:border-aura-primary/40';

export function FormAdminSekolah({ sekolah, awal }: { sekolah: Sekolah[]; awal?: string }) {
  const router = useRouter();
  const [sekolahId, setSekolahId] = useState(awal ?? sekolah[0]?.id ?? '');
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    setSukses(null);
    try {
      await buatAdminSekolah({ sekolahId, nama, email, password });
      setSukses('Admin sekolah berhasil dibuat.');
      setNama('');
      setEmail('');
      setPassword('');
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Admin belum berhasil dibuat.');
    } finally {
      setMemuat(false);
    }
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
        Sekolah
        <select value={sekolahId} onChange={(e) => setSekolahId(e.target.value)} required className={INPUT}>
          {sekolah.map((s) => (
            <option key={s.id} value={s.id}>{s.nama}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Nama admin
          <input value={nama} onChange={(e) => setNama(e.target.value)} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={INPUT} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
        Kata sandi
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className={INPUT} />
      </label>
      {galat && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galat}</p>}
      {sukses && <p role="status" className="text-[13px] font-medium text-[#047857]">{sukses}</p>}
      <Tombol varian="utama" type="submit" memuat={memuat} ikon={UserPlus} disabled={!sekolahId || !nama || !email || password.length < 8}>
        Buat admin
      </Tombol>
    </form>
  );
}
