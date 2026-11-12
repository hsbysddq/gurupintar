'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Unlock } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { StatusHalaman } from '@/components/StatusHalaman';
import { ambilDetailUjianAdmin, bukaBlokirUjian, ErrorApi } from '@/lib/api-klien';
import type { UjianDetailGuru } from '@/lib/tipe';

export default function HalamanDetailUjianAdmin() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<UjianDetailGuru | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [memproses, setMemproses] = useState<string | null>(null);

  function muat() {
    setGalat(null);
    ambilDetailUjianAdmin(params.id)
      .then(setData)
      .catch((err) => setGalat(err instanceof ErrorApi ? err.message : 'Ujian belum bisa dimuat.'));
  }

  useEffect(() => {
    let batal = false;
    ambilDetailUjianAdmin(params.id)
      .then((hasil) => {
        if (!batal) setData(hasil);
      })
      .catch((err) => {
        if (!batal) setGalat(err instanceof ErrorApi ? err.message : 'Ujian belum bisa dimuat.');
      });
    return () => {
      batal = true;
    };
  }, [params.id]);

  async function buka(siswaId: string) {
    setMemproses(siswaId);
    setGalat(null);
    try {
      await bukaBlokirUjian({ ujianId: params.id, siswaId });
      muat();
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Blokir belum bisa dibuka.');
    } finally {
      setMemproses(null);
    }
  }

  if (!data && !galat) return <StatusHalaman jenis="memuat" judul="Memuat ujian" />;
  if (!data) return <StatusHalaman jenis="gagal" judul="Ujian belum bisa dimuat" pesan={galat ?? undefined} aksi={{ label: 'Coba lagi', onClick: muat }} />;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[26px] leading-[34px] font-extrabold tracking-[-0.025em] text-aura-ink">{data.ujian.judul}</h1>
        <p className="font-body text-[13px] text-aura-muted">{data.ujian.namaKelas} · Token {data.ujian.token}</p>
      </header>
      {galat && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galat}</p>}
      <KartuKaca className="divide-y divide-white/60 p-2">
        {data.peserta.map((p) => (
          <div key={p.siswaId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
            <div>
              <p className="font-display text-[14px] font-semibold text-aura-ink">{p.nama}</p>
              <p className="font-body text-[11px] text-aura-muted">
                {p.status} · {p.jumlahPelanggaran} pelanggaran
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[12px] font-bold text-aura-ink">{p.persen === null ? '—' : `${p.persen}%`}</span>
              {p.status === 'diblokir' && (
                <button
                  type="button"
                  onClick={() => void buka(p.siswaId)}
                  disabled={memproses === p.siswaId}
                  className="inline-flex min-h-10 items-center gap-1 rounded-full bg-aura-primary/10 px-3 text-[12px] font-semibold text-aura-primary disabled:opacity-50"
                >
                  {memproses === p.siswaId ? <Loader2 className="size-3 animate-spin" /> : <Unlock className="size-3" />} Buka blokir
                </button>
              )}
            </div>
          </div>
        ))}
      </KartuKaca>
    </div>
  );
}
