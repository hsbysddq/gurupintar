'use client';

import type { CSSProperties } from 'react';
import { ambilGayaPpt, hexCss } from '@/lib/gaya-ppt';
import type { IsiMateri } from '@/lib/tipe';
import type { SlidePpt } from '@/lib/validasi-materi';

function JudulHighlight({
  judul,
  highlight,
  aksen,
  aksenTeks,
}: {
  judul: string;
  highlight?: string;
  aksen: string;
  aksenTeks: string;
}) {
  if (!highlight) return <>{judul}</>;
  const posisi = judul.toLowerCase().indexOf(highlight.toLowerCase());
  if (posisi < 0) return <>{judul}</>;
  return (
    <>
      {judul.slice(0, posisi)}
      <span
        style={{
          backgroundColor: hexCss(aksen),
          color: hexCss(aksenTeks),
          padding: '0 0.18em',
          borderRadius: 2,
        }}
      >
        {judul.slice(posisi, posisi + highlight.length)}
      </span>
      {judul.slice(posisi + highlight.length)}
    </>
  );
}

export function SlidePptVisual({
  isi,
  slide,
  indeks,
  total,
}: {
  isi: IsiMateri;
  slide: SlidePpt;
  indeks: number;
  total: number;
}) {
  const gaya = ambilGayaPpt(isi.slide_ppt.gaya);
  const jenis = slide.jenis ?? (indeks === 0 ? 'cover' : indeks === total - 1 ? 'penutup' : 'konten');
  const nomor = String(indeks + 1).padStart(2, '0');
  const nomorTotal = String(total).padStart(2, '0');
  const aksen = hexCss(gaya.aksen);
  const aksenTeks = hexCss(gaya.aksenTeks);
  const teks = hexCss(gaya.teks);
  const muted = hexCss(gaya.muted);
  const kertas = hexCss(gaya.kertas);
  const dasar: CSSProperties = {
    backgroundColor: hexCss(gaya.latar),
    color: teks,
    fontFamily: gaya.font,
  };

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${indeks + 1} dari ${total}: ${slide.judul}`}
      className="relative flex aspect-video w-full flex-col overflow-hidden rounded-2xl border border-aura-ink/10 p-5 sm:p-7"
      style={dasar}
    >
      {jenis === 'cover' ? (
        <div className="flex flex-1 flex-col">
          <span className="text-[44px] leading-none font-bold tracking-[-0.05em] sm:text-[64px]" style={{ color: aksen }}>
            {slide.nomor_besar ?? nomor}
          </span>
          <h3 className="mt-2 max-w-[85%] text-[22px] leading-[1.1] font-bold tracking-[-0.03em] sm:text-[30px]">
            <JudulHighlight judul={slide.judul} highlight={slide.highlight} aksen={gaya.aksen} aksenTeks={gaya.aksenTeks} />
          </h3>
          <p className="mt-2 max-w-[75%] text-[11px] leading-[1.5] sm:text-[13px]" style={{ color: muted }}>
            {slide.subjudul ?? slide.poin[0]}
          </p>
          <div className="mt-auto flex items-center justify-between border-t pt-2 text-[8px] sm:text-[9px]" style={{ borderColor: `${aksen}44`, color: muted, fontFamily: gaya.mono }}>
            <span>{isi.slide_ppt.judul}</span>
            <span>
              {nomor} / {nomorTotal}
            </span>
          </div>
        </div>
      ) : jenis === 'penutup' ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: aksen }}>
            Penutup
          </p>
          <h3 className="mt-3 max-w-[85%] text-[22px] leading-[1.12] font-bold tracking-[-0.03em] sm:text-[30px]">
            {slide.penutup?.pernyataan ?? slide.judul}
          </h3>
          <span className="my-3 h-0.5 w-12" style={{ backgroundColor: aksen }} />
          <p className="max-w-[70%] text-[10px] leading-[1.5] sm:text-[12px]" style={{ color: muted }}>
            {slide.penutup?.dukungan ?? slide.subjudul ?? slide.poin[0]}
          </p>
          <span
            className="mt-4 inline-flex rounded px-3 py-1.5 text-[10px] font-bold"
            style={{ backgroundColor: aksen, color: aksenTeks, fontFamily: gaya.mono }}
          >
            {slide.penutup?.cta ?? 'Simpan untuk dipelajari lagi'}
          </span>
          <span className="mt-4 text-[8px]" style={{ color: muted, fontFamily: gaya.mono }}>
            {isi.slide_ppt.judul} · {nomor} / {nomorTotal}
          </span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.16em]" style={{ color: aksen, fontFamily: gaya.mono }}>
                {jenis === 'konten' ? 'Materi' : jenis}
              </p>
              <h3 className="mt-1 text-[18px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[24px]">
                <JudulHighlight judul={slide.judul} highlight={slide.highlight} aksen={gaya.aksen} aksenTeks={gaya.aksenTeks} />
              </h3>
              {slide.subjudul && (
                <p className="mt-1 text-[10px] leading-[1.45] sm:text-[11px]" style={{ color: muted }}>
                  {slide.subjudul}
                </p>
              )}
            </div>
            <span className="shrink-0 text-[9px] font-bold" style={{ color: aksen, fontFamily: gaya.mono }}>
              {nomor}
            </span>
          </div>

          {jenis === 'kode' && slide.kode ? (
            <pre
              className="overflow-hidden rounded p-3 text-[9px] leading-[1.5] sm:text-[10px]"
              style={{ backgroundColor: '#1A1A1A', color: aksen, fontFamily: gaya.mono }}
            >
              {slide.kode}
            </pre>
          ) : null}

          {jenis === 'banding' && slide.banding ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded border-l-2 p-2.5" style={{ backgroundColor: '#F4E3D3', borderColor: '#B45309', color: '#4A2A0A' }}>
                <p className="text-[8px] font-bold uppercase tracking-[0.12em]">Kurang tepat</p>
                <p className="mt-1 text-[10px] leading-[1.45]">{slide.banding.buruk}</p>
              </div>
              <div className="rounded border-l-2 p-2.5" style={{ backgroundColor: '#E7F3E8', borderColor: '#2F7D4A', color: '#173A22' }}>
                <p className="text-[8px] font-bold uppercase tracking-[0.12em]">Lebih tepat</p>
                <p className="mt-1 text-[10px] leading-[1.45]">{slide.banding.baik}</p>
              </div>
            </div>
          ) : null}

          {jenis === 'opsi' && slide.opsi ? (
            <div className="flex flex-col gap-1.5">
              {slide.opsi.map((opsi) => (
                <div key={opsi.nama} className="flex flex-col gap-0.5 rounded p-2" style={{ backgroundColor: kertas }}>
                  <span className="text-[10px] font-bold" style={{ color: aksen }}>
                    {opsi.nama}
                  </span>
                  <span className="text-[9px] leading-[1.4]" style={{ color: muted }}>
                    {opsi.deskripsi}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {jenis === 'langkah' && slide.langkah ? (
            <ol className="flex flex-col gap-1.5">
              {slide.langkah.map((langkah, i) => (
                <li key={langkah} className="flex gap-2 text-[10px] leading-[1.45]">
                  <span className="font-bold" style={{ color: aksen, fontFamily: gaya.mono }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{langkah}</span>
                </li>
              ))}
            </ol>
          ) : null}

          {jenis === 'kutipan' && slide.kutipan ? (
            <blockquote className="border-l-2 pl-3 text-[11px] leading-[1.5] italic" style={{ borderColor: aksen, color: teks }}>
              “{slide.kutipan}”
            </blockquote>
          ) : null}

          {jenis === 'konten' || (!slide.kode && !slide.banding && !slide.opsi && !slide.langkah && !slide.kutipan) ? (
            <ul className="flex flex-col gap-1.5">
              {slide.poin.map((poin) => (
                <li key={poin} className="flex gap-2 text-[10px] leading-[1.45] sm:text-[11px]">
                  <span className="mt-[0.42em] size-1.5 shrink-0 rounded-full" style={{ backgroundColor: aksen }} />
                  <span>{poin}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto flex items-center justify-between border-t pt-2 text-[8px] sm:text-[9px]" style={{ borderColor: `${aksen}44`, color: muted, fontFamily: gaya.mono }}>
            <span>{isi.slide_ppt.judul}</span>
            <span>
              {nomor} / {nomorTotal}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
