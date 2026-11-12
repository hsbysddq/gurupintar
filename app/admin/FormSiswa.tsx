'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { buatSiswaSekolah, ErrorApi } from '@/lib/api-klien';
import type { KelasSekolah } from '@/lib/tipe';

const INPUT =
  'h-12 w-full rounded-2xl border border-white/70 bg-white/70 px-3 font-body text-[14px] text-aura-ink outline-none focus:border-aura-primary/40';

export function FormSiswa({ kelas }: { kelas: KelasSekolah[] }) {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kelasIds, setKelasIds] = useState<string[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  function toggleKelas(id: string) {
    setKelasIds((lama) => (lama.includes(id) ? lama.filter((k) => k !== id) : [...lama, id]));
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setMemuat(true);
    setGalat(null);
    setSukses(null);
    try {
      await buatSiswaSekolah({ nama, email, password, kelasIds });
      setSukses('Akun siswa berhasil dibuat.');
      setNama('');
      setEmail('');
      setPassword('');
      setKelasIds([]);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Akun siswa belum berhasil dibuat.');
    } finally {
      setMemuat(false);
    }
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Nama siswa
          <input value={nama} onChange={(e) => setNama(e.target.value)} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={INPUT} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
        Kata sandi awal
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className={INPUT} />
      </label>
      {kelas.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[12px] font-semibold text-aura-muted">Masukkan ke kelas (opsional)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {kelas.map((k) => (
              <label key={k.id} className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-[13px] text-aura-ink">
                <input type="checkbox" checked={kelasIds.includes(k.id)} onChange={() => toggleKelas(k.id)} className="size-4 accent-aura-primary" />
                {k.nama} · {k.mapel}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {galat && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galat}</p>}
      {sukses && <p role="status" className="text-[13px] font-medium text-[#047857]">{sukses}</p>}
      <Tombol varian="utama" type="submit" memuat={memuat} ikon={UserPlus} disabled={!nama || !email || password.length < 8}>
        Buat akun siswa
      </Tombol>
    </form>
  );
}
