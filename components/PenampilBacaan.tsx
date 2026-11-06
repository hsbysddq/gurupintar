'use client';

import { useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Download, List, Loader2, Minus, Plus } from 'lucide-react';
import { IlustrasiBacaan } from '@/components/IlustrasiBacaan';
import { ambilGayaBacaan } from '@/lib/gaya-bacaan';
import { unduhPdfBacaan } from '@/lib/unduh-bacaan';
import type { IsiMateri } from '@/lib/tipe';

const UKURAN_MIN = 15;
const UKURAN_MAKS = 21;

export function PenampilBacaan({ isi }: { isi: IsiMateri }) {
  const [indeks, setIndeks] = useState(-1);
  const [ukuran, setUkuran] = useState(17);
  const [mengunduh, setMengunduh] = useState(false);
  const [galatUnduh, setGalatUnduh] = useState<string | null>(null);
  const bacaan = isi.bacaan;
  const gaya = ambilGayaBacaan(isi.gaya_bacaan);

  async function unduh() {
    if (mengunduh) return;
    setMengunduh(true);
    setGalatUnduh(null);
    try {
      await unduhPdfBacaan(isi);
    } catch {
      setGalatUnduh('PDF belum berhasil dibuat. Coba lagi sebentar.');
    } finally {
      setMengunduh(false);
    }
  }

  if (!bacaan) {
    return (
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-aura-primary/15 bg-aura-primary/5 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.04em] text-aura-primary">
          <BookOpen aria-hidden="true" className="size-3" />
          Bacaan · {gaya.nama}
        </span>
        <h2 className="font-display text-xl leading-snug font-bold text-aura-ink">{isi.judul}</h2>
        <p className="whitespace-pre-line text-[15px] leading-[1.8] text-aura-ink">{isi.ringkasan}</p>
        <button
          type="button"
          onClick={() => void unduh()}
          disabled={mengunduh}
          className="inline-flex min-h-10 w-fit items-center gap-1.5 rounded-xl border border-aura-primary/20 px-3 font-display text-[11px] font-bold text-aura-primary transition-colors hover:bg-aura-primary/5 disabled:opacity-50"
        >
          {mengunduh ? <Loader2 aria-hidden="true" className="size-3.5 animate-spin" /> : <Download aria-hidden="true" className="size-3.5" />}
          Unduh PDF
        </button>
        {galatUnduh && (
          <p role="alert" className="font-body text-[11px] leading-[16px] text-aura-red">
            {galatUnduh}
          </p>
        )}
      </div>
    );
  }

  const bab = bacaan.bab;
  const diSampul = indeks < 0;
  const totalKata = bab.flatMap((item) => item.paragraf).join(' ').split(/\s+/).filter(Boolean).length;
  const perkiraanMenit = Math.max(1, Math.ceil(totalKata / 150));
  const persen = diSampul ? 0 : Math.round(((indeks + 1) / bab.length) * 100);

  function ke(nilai: number) {
    setIndeks(Math.max(-1, Math.min(bab.length - 1, nilai)));
  }

  return (
    <div className="flex flex-col gap-4">
      {diSampul ? (
        <>
          <div
            className="relative overflow-hidden rounded-[22px] border p-6 sm:pr-44"
            style={{
              borderColor: `${gaya.aksen}33`,
              background: `linear-gradient(135deg, ${gaya.latar} 0%, #FFFDF9 58%, ${gaya.latar} 100%)`,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-3xl"
              style={{ backgroundColor: `${gaya.aksen}1A` }}
            />
            <IlustrasiBacaan
              gaya={gaya.id}
              className="pointer-events-none absolute -bottom-3 -right-2 hidden w-44 opacity-90 sm:block"
            />
            <div className="relative flex flex-col gap-4">
              <span
                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.05em] ring-1"
                style={{ color: gaya.aksen, borderColor: `${gaya.aksen}26` }}
              >
                <BookOpen aria-hidden="true" className="size-3" />
                E-book · {gaya.kode} {gaya.nama}
              </span>
              <div>
                <h2 className="font-display text-[26px] leading-[34px] font-extrabold tracking-[-0.02em] text-aura-ink">
                  {bacaan.judul}
                </h2>
                {bacaan.subjudul && (
                  <p className="mt-1.5 font-body text-[14px] leading-[22px] text-aura-muted">{bacaan.subjudul}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 font-body text-[11px] leading-[16px] text-aura-muted">
                <span className="rounded-full bg-white/75 px-2.5 py-1 ring-1 ring-aura-ink/5">{bab.length} bab</span>
                <span className="rounded-full bg-white/75 px-2.5 py-1 ring-1 ring-aura-ink/5">
                  ± {perkiraanMenit} menit baca
                </span>
                <span className="rounded-full bg-white/75 px-2.5 py-1 ring-1 ring-aura-ink/5">{totalKata} kata</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => ke(0)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-display text-[12px] font-bold text-white transition-colors hover:brightness-105"
                  style={{ backgroundColor: gaya.aksen }}
                >
                  Mulai membaca
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void unduh()}
                  disabled={mengunduh}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white/70 px-4 font-display text-[12px] font-bold transition-colors hover:bg-white disabled:opacity-50"
                  style={{ borderColor: `${gaya.aksen}33`, color: gaya.aksen }}
                >
                  {mengunduh ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Download aria-hidden="true" className="size-4" />
                  )}
                  {mengunduh ? 'Menyiapkan PDF…' : 'Unduh PDF'}
                </button>
              </div>
              {galatUnduh && (
                <p role="alert" className="font-body text-[11px] leading-[16px] text-aura-red">
                  {galatUnduh}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[22px] border border-aura-ink/10 bg-white/55 p-4">
            <h3 className="font-display text-[14px] leading-[20px] font-bold text-aura-ink">Daftar isi</h3>
            <ol className="mt-2 divide-y divide-aura-ink/5">
              {bab.map((item, i) => (
                <li key={`${item.judul}-${i}`}>
                  <button
                    type="button"
                    onClick={() => ke(i)}
                    className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:text-aura-primary"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-aura-primary/10 font-display text-[10px] font-bold text-aura-primary">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[12px] leading-[18px] font-semibold text-aura-ink">
                        {item.judul}
                      </span>
                      <span className="mt-0.5 block line-clamp-1 font-body text-[10px] leading-[15px] text-aura-muted">
                        {item.paragraf[0]}
                      </span>
                    </span>
                    <ChevronRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-aura-muted" />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => ke(-1)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 font-display text-[11px] font-bold text-aura-primary transition-colors hover:bg-aura-primary/10"
            >
              <List aria-hidden="true" className="size-3.5" />
              Daftar isi
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void unduh()}
                disabled={mengunduh}
                aria-label="Unduh PDF"
                className="mr-1 flex size-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-aura-ink/5 hover:text-aura-ink disabled:opacity-40"
              >
                {mengunduh ? (
                  <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                ) : (
                  <Download aria-hidden="true" className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setUkuran((nilai) => Math.max(UKURAN_MIN, nilai - 1))}
                disabled={ukuran <= UKURAN_MIN}
                aria-label="Perkecil ukuran teks"
                className="flex size-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-aura-ink/5 hover:text-aura-ink disabled:opacity-40"
              >
                <Minus aria-hidden="true" className="size-3.5" />
              </button>
              <span className="font-display text-[10px] font-semibold tabular-nums text-aura-muted">{ukuran}px</span>
              <button
                type="button"
                onClick={() => setUkuran((nilai) => Math.min(UKURAN_MAKS, nilai + 1))}
                disabled={ukuran >= UKURAN_MAKS}
                aria-label="Perbesar ukuran teks"
                className="flex size-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-aura-ink/5 hover:text-aura-ink disabled:opacity-40"
              >
                <Plus aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: `${gaya.aksen}1A` }}>
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${persen}%`, backgroundColor: gaya.aksen }}
            />
          </div>

          <article aria-live="polite" className="rounded-[22px] border border-aura-ink/10 bg-white/60 p-5">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.05em] text-aura-muted">
              Bab {indeks + 1} dari {bab.length}
            </p>
            <h2 className="mt-1.5 font-display text-[22px] leading-[30px] font-bold tracking-[-0.015em] text-aura-ink">
              {bab[indeks].judul}
            </h2>

            <div className="mt-4 flex flex-col gap-3.5">
              {bab[indeks].paragraf.map((paragraf, i) => (
                <p
                  key={i}
                  className="whitespace-pre-line font-body text-aura-ink"
                  style={{ fontSize: `${ukuran}px`, lineHeight: 1.8 }}
                >
                  {paragraf}
                </p>
              ))}
            </div>

            {bab[indeks].poin && bab[indeks].poin.length > 0 && (
              <div className="mt-5 rounded-2xl border border-aura-primary/15 bg-aura-primary/[0.04] p-4">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.05em] text-aura-primary">
                  Poin penting
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {bab[indeks].poin?.map((poin) => (
                    <li key={poin} className="flex gap-2 font-body text-[13px] leading-[20px] text-aura-ink">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-aura-primary" />
                      {poin}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {bab[indeks].contoh && (
              <div className="mt-4 rounded-2xl border-l-2 border-l-aura-emerald bg-aura-emerald/[0.06] p-4">
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.05em] text-[#047857]">Contoh</p>
                <p className="mt-1.5 font-body text-[13px] leading-[21px] text-aura-ink">{bab[indeks].contoh}</p>
              </div>
            )}
          </article>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => ke(indeks - 1)}
              disabled={indeks === 0}
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-display text-[11px] font-bold text-aura-primary transition-colors hover:bg-aura-primary/10 disabled:opacity-35"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              Sebelumnya
            </button>
            <span className="font-body text-[11px] text-aura-muted">{persen}%</span>
            <button
              type="button"
              onClick={() => (indeks === bab.length - 1 ? ke(-1) : ke(indeks + 1))}
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 font-display text-[11px] font-bold text-aura-primary transition-colors hover:bg-aura-primary/10"
            >
              {indeks === bab.length - 1 ? 'Selesai' : 'Berikutnya'}
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
