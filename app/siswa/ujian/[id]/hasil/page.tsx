'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Award, CheckCircle2, XCircle } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { StatusHalaman } from '@/components/StatusHalaman';
import { ambilHasilUjian, ErrorApi } from '@/lib/api-klien';
import type { HasilUjianSiswa } from '@/lib/tipe';

export default function HalamanHasilUjian() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<HasilUjianSiswa | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    ambilHasilUjian(params.id)
      .then((hasil) => {
        if (!batal) setData(hasil);
      })
      .catch((err) => {
        if (!batal) setGalat(err instanceof ErrorApi ? err.message : 'Hasil ujian belum bisa dimuat.');
      });
    return () => {
      batal = true;
    };
  }, [params.id]);

  if (galat) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="gagal" judul="Hasil belum tersedia" pesan={galat} aksi={{ label: 'Kembali', onClick: () => router.push('/siswa/ujian') }} />
      </KerangkaSiswa>
    );
  }
  if (!data) return <KerangkaSiswa><StatusHalaman jenis="memuat" judul="Memuat hasil ujian" /></KerangkaSiswa>;

  const petaJawaban = new Map(data.jawaban.map((j) => [j.soalId, j]));

  return (
    <KerangkaSiswa>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <KartuKaca className="flex flex-col items-center gap-3 p-7 text-center">
          <Award className="size-12 text-aura-primary" />
          <span className="aura-eyebrow">Hasil ujian</span>
          <h1 className="font-display text-[24px] font-extrabold text-aura-ink">{data.judul}</h1>
          <p className="font-body text-[13px] text-aura-muted">{data.namaKelas}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-[48px] leading-none font-extrabold text-aura-primary">{data.persen}</span>
            <span className="pb-2 font-display text-[18px] font-bold text-aura-muted">%</span>
          </div>
          <p className="font-body text-[13px] text-aura-muted">Skor berbobot {data.skor} dari {data.total}</p>
        </KartuKaca>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-[18px] font-bold text-aura-ink">Rincian jawaban</h2>
          {data.soal.map((soal) => {
            const j = petaJawaban.get(soal.id);
            const benar = j?.benar;
            return (
              <KartuKaca key={soal.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-[13px] font-semibold text-aura-ink">Soal {soal.nomor}</p>
                  {benar === true ? (
                    <CheckCircle2 className="size-5 shrink-0 text-sudah-teks" />
                  ) : benar === false ? (
                    <XCircle className="size-5 shrink-0 text-belum-teks" />
                  ) : (
                    <span className="text-[11px] font-semibold text-setengah-teks">Menunggu nilai</span>
                  )}
                </div>
                <p className="line-clamp-3 font-body text-[13px] leading-[21px] text-aura-muted">{soal.teks}</p>
                <p className="font-body text-[12px] text-aura-ink">
                  Jawabanmu: <strong>{j?.jawaban || '(kosong)'}</strong>
                </p>
              </KartuKaca>
            );
          })}
        </section>

        <Link href="/siswa/ujian" className="font-semibold text-aura-primary hover:underline">Kembali ke daftar ujian</Link>
      </div>
    </KerangkaSiswa>
  );
}
