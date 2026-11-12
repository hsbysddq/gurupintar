'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, KeyRound } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { ambilUjianSiswa, ErrorApi, mulaiUjian } from '@/lib/api-klien';
import { formatJadwal } from '@/lib/jadwal-kuis';
import type { UjianSiswa } from '@/lib/tipe';

export default function HalamanUjianSiswa() {
  const router = useRouter();
  const [daftar, setDaftar] = useState<UjianSiswa[] | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [token, setToken] = useState<Record<string, string>>({});
  const [memproses, setMemproses] = useState<string | null>(null);

  async function muat() {
    try {
      setDaftar(await ambilUjianSiswa());
      setGalat(null);
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Daftar ujian belum bisa dimuat.');
    }
  }

  useEffect(() => {
    let batal = false;
    ambilUjianSiswa()
      .then((hasil) => {
        if (batal) return;
        setDaftar(hasil);
        setGalat(null);
      })
      .catch((err) => {
        if (!batal) setGalat(err instanceof ErrorApi ? err.message : 'Daftar ujian belum bisa dimuat.');
      });
    return () => {
      batal = true;
    };
  }, []);

  async function mulai(ujian: UjianSiswa) {
    setMemproses(ujian.id);
    setGalat(null);
    try {
      await mulaiUjian({ ujianId: ujian.id, token: token[ujian.id] ?? '' });
      router.push(`/siswa/ujian/${ujian.id}`);
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Ujian belum bisa dimulai.');
      setMemproses(null);
    }
  }

  if (daftar === null && !galat) return <KerangkaSiswa><StatusHalaman jenis="memuat" judul="Memuat ujian" /></KerangkaSiswa>;
  if (galat && daftar === null) {
    return <KerangkaSiswa><StatusHalaman jenis="gagal" judul="Ujian belum bisa dimuat" pesan={galat} aksi={{ label: 'Coba lagi', onClick: () => void muat() }} /></KerangkaSiswa>;
  }

  return (
    <KerangkaSiswa>
      <header className="flex flex-col gap-1.5">
        <span className="aura-eyebrow">Ujian</span>
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
          Ujian untukmu
        </h1>
        <p className="text-aura-muted">Masukkan token dari gurumu saat ujian sudah dibuka.</p>
      </header>

      {galat && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galat}</p>}

      {daftar && daftar.length === 0 ? (
        <StatusHalaman jenis="kosong" judul="Belum ada ujian" pesan="Ujian akan muncul setelah gurumu mempublikasikannya." />
      ) : (
        <ul className="flex flex-col gap-3">
          {(daftar ?? []).map((u) => (
            <li key={u.id}>
              <KartuKaca className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-[17px] font-bold text-aura-ink">{u.judul}</h2>
                    <p className="font-body text-[12px] text-aura-muted">{u.namaKelas}</p>
                  </div>
                  <span className="rounded-full bg-aura-primary/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-primary">
                    {u.status}
                  </span>
                </div>
                <p className="font-body text-[12px] text-aura-muted">
                  {formatJadwal(u.mulaiPada)} — {formatJadwal(u.selesaiPada)} · {u.durasiMenit} menit
                </p>

                {u.statusPeserta === 'belum' && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative flex-1">
                      <span className="sr-only">Token ujian</span>
                      <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-aura-muted" />
                      <input
                        value={token[u.id] ?? ''}
                        onChange={(e) => setToken((lama) => ({ ...lama, [u.id]: e.target.value.toUpperCase() }))}
                        placeholder="Token ujian"
                        className="h-12 w-full rounded-2xl border border-white/70 bg-white/70 pl-9 pr-3 font-display text-[16px] font-bold tracking-[0.2em] text-aura-ink outline-none focus:border-aura-primary/40"
                      />
                    </label>
                    <Tombol varian="utama" type="button" memuat={memproses === u.id} onClick={() => void mulai(u)} ikon={ClipboardCheck} disabled={(token[u.id] ?? '').length < 6}>
                      Mulai
                    </Tombol>
                  </div>
                )}

                {u.statusPeserta === 'mengerjakan' && (
                  <Link href={`/siswa/ujian/${u.id}`} className="aura-btn aura-btn-primary h-12 px-5 text-[13px]">
                    <ClipboardCheck aria-hidden="true" className="size-4" />
                    Lanjutkan ujian
                  </Link>
                )}

                {u.statusPeserta === 'diblokir' && (
                  <p className="rounded-xl bg-belum-latar px-3 py-2 text-[13px] font-medium text-belum-teks">
                    Ujian diblokir. Hubungi admin sekolah.
                  </p>
                )}

                {u.statusPeserta === 'selesai' && (
                  u.dirilisPada ? (
                    <Link href={`/siswa/ujian/${u.id}/hasil`} className="font-semibold text-aura-primary hover:underline">
                      Lihat hasil ujian
                    </Link>
                  ) : (
                    <p className="text-[13px] text-aura-muted">Jawaban sudah dikumpulkan. Nilai menunggu rilis guru.</p>
                  )
                )}
              </KartuKaca>
            </li>
          ))}
        </ul>
      )}
    </KerangkaSiswa>
  );
}
