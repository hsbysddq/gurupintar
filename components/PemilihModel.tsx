'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Cpu, Loader2, Search, X } from 'lucide-react';
import { formatKonteks, kelompokkanModel, saringModel } from '@/lib/pemilih-model';
import type { ModelAi } from '@/lib/tipe';

const WARNA_GRUP: Record<string, string> = {
  Anthropic: 'bg-aura-amber/10 text-[#92400e]',
  OpenAI: 'bg-aura-emerald/10 text-[#047857]',
  Google: 'bg-aura-primary/10 text-aura-primary',
  DeepSeek: 'bg-aura-indigo/10 text-aura-indigo',
  Qwen: 'bg-aura-violet/10 text-aura-violet',
  GLM: 'bg-aura-primary/10 text-aura-primary',
  MiniMax: 'bg-aura-amber/10 text-[#92400e]',
  Kimi: 'bg-aura-emerald/10 text-[#047857]',
  xAI: 'bg-aura-ink/5 text-aura-ink',
};

const WARNA_CADANGAN = 'bg-aura-violet/10 text-aura-violet';

interface PosisiPanel {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

export function PemilihModel({
  id,
  labelId,
  nilai,
  daftar,
  memuat,
  nonaktif = false,
  onPilih,
}: {
  id: string;
  labelId: string;
  nilai: string;
  daftar: ModelAi[];
  memuat: boolean;
  nonaktif?: boolean;
  onPilih: (id: string) => void;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [cari, setCari] = useState('');
  const [aktif, setAktif] = useState(0);
  const [posisi, setPosisi] = useState<PosisiPanel | null>(null);
  const tombolRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cariRef = useRef<HTMLInputElement>(null);

  const hasil = useMemo(() => saringModel(daftar, cari), [daftar, cari]);
  const grupOpsi = useMemo(() => kelompokkanModel(hasil), [hasil]);
  const terpilih = daftar.find((model) => model.id === nilai) ?? null;
  const konteksTerpilih = formatKonteks(terpilih?.contextLength ?? null);
  const listId = `${id}-daftar`;
  const nonaktifTotal = memuat || daftar.length === 0 || nonaktif;

  useEffect(() => {
    if (terbuka) cariRef.current?.focus();
  }, [terbuka]);

  useEffect(() => {
    if (!terbuka) return;
    const opsi = document.getElementById(`${id}-opsi-${aktif}`);
    opsi?.scrollIntoView({ block: 'nearest' });
  }, [aktif, terbuka, id]);

  useEffect(() => {
    if (!terbuka) return;

    function tutupPadaResize() {
      setTerbuka(false);
      setPosisi(null);
    }

    function tutupPadaScroll(event: Event) {
      if (panelRef.current?.contains(event.target as Node)) return;
      setTerbuka(false);
      setPosisi(null);
    }

    window.addEventListener('resize', tutupPadaResize);
    window.addEventListener('scroll', tutupPadaScroll, true);
    return () => {
      window.removeEventListener('resize', tutupPadaResize);
      window.removeEventListener('scroll', tutupPadaScroll, true);
    };
  }, [terbuka]);

  function tutup(kembaliFokus: boolean) {
    setTerbuka(false);
    setPosisi(null);
    if (kembaliFokus) requestAnimationFrame(() => tombolRef.current?.focus());
  }

  function buka() {
    if (nonaktifTotal) return;
    const kotak = tombolRef.current?.getBoundingClientRect();
    if (!kotak) return;

    const lebar = Math.min(Math.max(kotak.width, 360), window.innerWidth - 24);
    const kiri = Math.min(Math.max(12, kotak.left), Math.max(12, window.innerWidth - lebar - 12));
    const ruangBawah = window.innerHeight - kotak.bottom - 16;
    const ruangAtas = kotak.top - 16;
    const keAtas = ruangBawah < 280 && ruangAtas > ruangBawah;
    const tinggi = Math.max(200, Math.min(420, keAtas ? ruangAtas : ruangBawah));

    setPosisi({
      left: kiri,
      width: lebar,
      maxHeight: tinggi,
      ...(keAtas
        ? { bottom: Math.max(12, window.innerHeight - kotak.top + 8) }
        : { top: kotak.bottom + 8 }),
    });
    setCari('');
    const indeksTerpilih = daftar.findIndex((model) => model.id === nilai);
    setAktif(indeksTerpilih >= 0 ? indeksTerpilih : 0);
    setTerbuka(true);
  }

  function pilih(model: ModelAi) {
    onPilih(model.id);
    tutup(true);
  }

  function tekanCari(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setAktif((indeks) => (hasil.length === 0 ? 0 : Math.min(hasil.length - 1, indeks + 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setAktif((indeks) => Math.max(0, indeks - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setAktif(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setAktif(Math.max(0, hasil.length - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const model = hasil[aktif];
      if (model) pilih(model);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      tutup(true);
    }
  }

  const warnaTerpilih = terpilih ? (WARNA_GRUP[terpilih.grup] ?? WARNA_CADANGAN) : 'bg-aura-primary/10 text-aura-primary';
  const judul = memuat
    ? 'Memuat model…'
    : daftar.length === 0
      ? 'Model belum tersedia'
      : (terpilih?.name ?? 'Pilih model');
  const keterangan = memuat
    ? 'Mengambil katalog dari server'
    : daftar.length === 0
      ? 'Coba muat ulang'
      : terpilih
        ? `${terpilih.grup}${konteksTerpilih ? ` · ${konteksTerpilih} konteks` : ''}`
        : `${daftar.length} model tersedia`;

  return (
    <>
      <button
        ref={tombolRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={terbuka}
        aria-labelledby={labelId}
        aria-busy={memuat}
        disabled={nonaktifTotal}
        onClick={buka}
        className={`flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-aura-ink/10 bg-white/70 px-3.5 py-3 text-left shadow-[0_10px_28px_-22px_rgba(15,23,42,0.5)] transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-aura-primary/30 ${
          memuat
            ? 'cursor-wait'
            : daftar.length === 0
              ? 'cursor-not-allowed'
              : 'cursor-pointer hover:border-aura-primary/30 hover:bg-white/90'
        } disabled:opacity-60`}
      >
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${warnaTerpilih}`}>
          <Cpu aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[10px] font-bold uppercase tracking-[0.06em] text-aura-muted">
            Model AI
          </span>
          <span className="mt-0.5 block truncate font-display text-[13px] leading-[18px] font-semibold text-aura-ink">
            {judul}
          </span>
          <span className="mt-0.5 block truncate font-body text-[11px] leading-[16px] text-aura-muted">
            {keterangan}
          </span>
        </span>
        {memuat ? (
          <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin text-aura-primary" />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 text-aura-muted transition-transform ${terbuka ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {terbuka &&
        posisi &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] bg-aura-ink/5"
            onPointerDown={() => tutup(false)}
          >
            <div
              ref={panelRef}
              role="presentation"
              onPointerDown={(event) => event.stopPropagation()}
              style={{
                left: posisi.left,
                width: posisi.width,
                maxHeight: posisi.maxHeight,
                ...(posisi.top !== undefined ? { top: posisi.top } : { bottom: posisi.bottom ?? 12 }),
              }}
              className="fixed z-[91] flex flex-col overflow-hidden rounded-[20px] border border-aura-ink/10 bg-white shadow-[0_28px_80px_-20px_rgba(15,23,42,0.45)]"
            >
              <div className="border-b border-aura-ink/10 p-3">
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-aura-muted"
                  />
                  <input
                    ref={cariRef}
                    type="text"
                    role="combobox"
                    aria-labelledby={labelId}
                    aria-controls={listId}
                    aria-expanded={true}
                    aria-autocomplete="list"
                    aria-activedescendant={hasil[aktif] ? `${id}-opsi-${aktif}` : undefined}
                    value={cari}
                    onChange={(event) => {
                      setCari(event.target.value);
                      setAktif(0);
                    }}
                    onKeyDown={tekanCari}
                    placeholder="Cari model atau provider…"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 w-full rounded-xl border border-aura-ink/10 bg-aura-canvas/60 pl-9 pr-9 font-body text-[13px] text-aura-ink outline-none placeholder:text-aura-muted/80 focus:border-aura-primary/40 focus:ring-[3px] focus:ring-aura-primary/15"
                  />
                  {cari && (
                    <button
                      type="button"
                      onClick={() => {
                        setCari('');
                        setAktif(0);
                        cariRef.current?.focus();
                      }}
                      aria-label="Hapus pencarian"
                      className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-aura-muted transition-colors hover:bg-aura-ink/5 hover:text-aura-ink"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 px-0.5 font-body text-[10px] leading-[14px] text-aura-muted">
                  <span>
                    {hasil.length} model · {grupOpsi.length} provider
                  </span>
                  <span className="hidden sm:inline">↑↓ pilih · Enter · Esc</span>
                </div>
              </div>

              <div
                id={listId}
                role="listbox"
                aria-labelledby={labelId}
                className="min-h-0 flex-1 overflow-y-auto p-1.5"
                style={{ maxHeight: Math.max(160, (posisi.maxHeight ?? 420) - 112) }}
              >
                {grupOpsi.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <Search aria-hidden="true" className="size-5 text-aura-muted" />
                    <p className="mt-2 font-body text-[12px] leading-[18px] text-aura-muted">
                      Tidak ada model yang cocok.
                    </p>
                  </div>
                ) : (
                  grupOpsi.map((grup) => (
                    <div key={grup.nama} role="group" aria-label={grup.nama}>
                      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-white/95 px-2.5 py-1.5 backdrop-blur-sm">
                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.08em] text-aura-muted">
                          {grup.nama}
                        </span>
                        <span className="font-body text-[9px] text-aura-muted">{grup.opsi.length}</span>
                      </div>
                      {grup.opsi.map(({ model, indeks }) => {
                        const dipilih = model.id === nilai;
                        const sorot = indeks === aktif;
                        const konteks = formatKonteks(model.contextLength);
                        return (
                          <button
                            key={model.id}
                            id={`${id}-opsi-${indeks}`}
                            type="button"
                            role="option"
                            tabIndex={-1}
                            aria-selected={dipilih}
                            title={model.id}
                            onMouseEnter={() => setAktif(indeks)}
                            onClick={() => pilih(model)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                              sorot ? 'bg-aura-primary/10' : 'hover:bg-aura-ink/[0.04]'
                            }`}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-display text-[12px] leading-[18px] font-semibold text-aura-ink">
                                {model.name}
                              </span>
                              <span className="mt-0.5 block truncate font-body text-[10px] leading-[14px] text-aura-muted">
                                {model.id}
                              </span>
                            </span>
                            {konteks && (
                              <span className="shrink-0 rounded-full bg-aura-ink/[0.04] px-2 py-0.5 font-body text-[9px] font-medium text-aura-muted">
                                {konteks}
                              </span>
                            )}
                            {dipilih && <Check aria-hidden="true" className="size-4 shrink-0 text-aura-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
