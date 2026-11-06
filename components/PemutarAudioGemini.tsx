'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Tombol } from '@/components/Tombol';
import { TombolDengarkan } from '@/components/TombolDengarkan';
import { buatAudioMateri } from '@/lib/api-klien';
import type { GayaAudio } from '@/lib/tipe';

type PemutarAudioGeminiProps = {
  teks: string;
  gaya: GayaAudio;
  /** Diisi hanya di halaman siswa; server memakai naskah dari materi, bukan teks dari browser. */
  sesiId?: string;
  laju?: number;
};

export function PemutarAudioGemini({ teks, gaya, sesiId, laju }: PemutarAudioGeminiProps) {
  const [memuat, setMemuat] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const teksBrowser = teks.replace(/^\s*(GURU|SISWA|NARATOR)\s*:\s*/gim, '');

  async function putar() {
    if (memuat) return;
    setMemuat(true);
    setGalat(null);
    try {
      const hasil = await buatAudioMateri(
        sesiId ? { sumber: 'siswa', sesi: sesiId } : { sumber: 'guru', teks, gaya },
      );
      setUrl(hasil.url);
    } catch (err) {
      setGalat(err instanceof Error ? err.message : 'Suara natural belum berhasil dibuat.');
    } finally {
      setMemuat(false);
    }
  }

  if (url) {
    return (
      <div className="flex flex-col gap-2">
        <audio
          controls
          autoPlay
          src={url}
          className="w-full"
          onError={() => {
            setUrl(null);
            setGalat('Audio belum bisa diputar. Coba lagi sebentar.');
          }}
        />
        <p className="font-body text-[11px] leading-[16px] text-aura-muted">
          Suara dibuat AI dan disimpan untuk materi ini.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Tombol varian="utama" ukuran="besar" lebarPenuh ikon={Play} memuat={memuat} onClick={putar}>
        {memuat ? 'Menyiapkan suara…' : 'Putar suara natural'}
      </Tombol>
      {galat && (
        <>
          <p role="alert" className="font-body text-[12px] leading-[18px] text-aura-red">
            {galat}
          </p>
          <TombolDengarkan teks={teksBrowser} laju={laju} />
        </>
      )}
    </div>
  );
}
