"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Download,
  Headphones,
  Loader2,
  Pencil,
  Plus,
  Presentation,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { hapusMateriPustaka } from "@/lib/api-klien";
import { unduhDocx, unduhPptx } from "@/lib/unduh-materi";
import type { KelasRingkas, MateriPustaka } from "@/lib/tipe";

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

type JenisUnduh = "pptx" | "docx";

export function PustakaMateriKelas({ kelas, daftar }: { kelas: KelasRingkas; daftar: MateriPustaka[] }) {
  const router = useRouter();
  const [cari, setCari] = useState("");
  const [menghapus, setMenghapus] = useState<string | null>(null);
  const [mengunduh, setMengunduh] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const tersaring = useMemo(() => {
    const kueri = cari.trim().toLowerCase();
    if (!kueri) return daftar;
    return daftar.filter(
      (m) => m.judul.toLowerCase().includes(kueri) || m.bab.toLowerCase().includes(kueri),
    );
  }, [cari, daftar]);

  const kelompok = useMemo(() => {
    const peta = new Map<string, MateriPustaka[]>();
    for (const materi of tersaring) {
      const bab = materi.bab.trim() || "Tanpa bab";
      const isi = peta.get(bab) ?? [];
      isi.push(materi);
      peta.set(bab, isi);
    }
    return [...peta.entries()].sort(([a], [b]) => a.localeCompare(b, "id"));
  }, [tersaring]);

  const jumlahBab = new Set(daftar.map((m) => m.bab.trim() || "Tanpa bab")).size;

  async function unduh(jenis: JenisUnduh, materi: MateriPustaka) {
    const kunci = `${materi.id}:${jenis}`;
    setMengunduh(kunci);
    setGalat(null);
    try {
      await (jenis === "pptx" ? unduhPptx(materi.isi) : unduhDocx(materi.isi));
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Materi belum berhasil diunduh.");
    } finally {
      setMengunduh(null);
    }
  }

  async function hapus(materi: MateriPustaka) {
    if (!window.confirm(`Hapus materi "${materi.judul}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setMenghapus(materi.id);
    setGalat(null);
    try {
      await hapusMateriPustaka(materi.id);
      router.refresh();
    } catch (err) {
      setGalat(err instanceof Error ? err.message : "Materi belum berhasil dihapus.");
    } finally {
      setMenghapus(null);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="aura-glass relative overflow-hidden rounded-[24px] p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-aura-primary/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <span className="aura-eyebrow">
              <BookOpen aria-hidden="true" className="size-3.5" />
              Pustaka materi
            </span>
            <h2 className="mt-2 font-display text-[26px] leading-[34px] font-extrabold tracking-[-0.02em] text-aura-ink">
              Materi kelas
            </h2>
            <p className="mt-1 max-w-2xl font-body text-[14px] leading-[22px] text-aura-muted">
              Kumpulan modul {kelas.mapel} yang sudah diubah menjadi PPT, audio, bacaan, dan latihan. Simpan hasil
              Ubah Modul di sini agar mudah dibuka lagi.
            </p>
          </div>
          <Link
            href={`/guru/modul?kelas=${kelas.id}`}
            className="aura-btn aura-btn-primary h-12 shrink-0 px-5 text-[13px]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Tambah materi
          </Link>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-ink backdrop-blur-sm">
            <BookOpen aria-hidden="true" className="size-3.5 text-aura-primary" />
            {daftar.length} materi
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-ink backdrop-blur-sm">
            <Presentation aria-hidden="true" className="size-3.5 text-aura-indigo" />
            {jumlahBab} bab/topik
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1.5 font-display text-[12px] font-semibold text-aura-ink backdrop-blur-sm">
            <Sparkles aria-hidden="true" className="size-3.5 text-aura-violet" />
            {daftar.filter((m) => m.sumber === "ai").length} dibuat AI
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-md">
          <span className="sr-only">Cari materi</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-aura-muted" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari judul atau bab..."
            className="h-12 w-full rounded-2xl border border-white/70 bg-white/65 pl-11 pr-4 font-body text-[14px] leading-normal text-aura-ink shadow-sm backdrop-blur-sm transition-colors placeholder:text-aura-muted/55 hover:bg-white/75 focus:bg-white/85"
          />
        </label>
        {daftar.length > 0 && (
          <p className="font-body text-[12px] leading-[18px] font-medium text-aura-muted">
            Menampilkan {tersaring.length} dari {daftar.length} materi
          </p>
        )}
      </div>

      <div aria-live="polite">
        {galat && (
          <p role="alert" className="rounded-2xl border border-aura-red/20 bg-aura-red/5 px-4 py-3 font-body text-[13px] leading-[20px] font-medium text-aura-red">
            {galat}
          </p>
        )}
      </div>

      {daftar.length === 0 ? (
        <div className="aura-glass flex flex-col items-center gap-3 rounded-[24px] px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary ring-1 ring-white/70">
            <BookOpen aria-hidden="true" className="size-6" />
          </span>
          <h3 className="font-display text-[20px] leading-[28px] font-bold text-aura-ink">Belum ada materi</h3>
          <p className="max-w-md font-body text-[14px] leading-[22px] text-aura-muted">
            Ubah modul pertama menjadi empat bentuk belajar, lalu simpan hasilnya ke kelas ini.
          </p>
          <Link
            href={`/guru/modul?kelas=${kelas.id}`}
            className="aura-btn aura-btn-primary mt-1 h-12 px-5 text-[13px]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Ubah modul pertama
          </Link>
        </div>
      ) : tersaring.length === 0 ? (
        <p className="aura-glass rounded-[24px] px-6 py-8 text-center font-body text-[14px] leading-[22px] text-aura-muted">
          Tidak ada materi yang cocok dengan pencarian.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {kelompok.map(([bab, materi]) => (
            <section key={bab} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="flex items-center gap-2 font-display text-[18px] leading-[26px] font-bold tracking-[-0.01em] text-aura-ink">
                  <BookOpen aria-hidden="true" className="size-4 text-aura-primary" />
                  {bab}
                </h3>
                <span className="font-body text-[12px] leading-[18px] font-medium text-aura-muted">
                  {materi.length} materi
                </span>
              </div>

              <ul className="grid gap-3 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {materi.map((m) => {
                  const sedangMenghapus = menghapus === m.id;
                  return (
                    <li key={m.id} className="min-w-0">
                      <article className="aura-glass flex h-full flex-col gap-4 rounded-[24px] p-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-aura-primary/10 px-2.5 py-1 font-display text-[11px] font-semibold text-aura-primary">
                            <Sparkles aria-hidden="true" className="size-3" />
                            {m.sumber === "ai" ? "Dibuat AI" : "Materi cadangan"}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-white/60 px-2.5 py-1 font-display text-[11px] font-semibold text-aura-muted ring-1 ring-inset ring-white/70">
                            {m.asal === "pdf" ? "Dari PDF" : "Dari teks"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <h4 className="line-clamp-2 font-display text-[17px] leading-[24px] font-bold tracking-[-0.01em] text-aura-ink">
                            {m.judul}
                          </h4>
                          <p className="line-clamp-2 font-body text-[13px] leading-[20px] text-aura-muted">
                            {m.isi.ringkasan}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/55 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.03em] text-aura-muted ring-1 ring-inset ring-white/70">
                            <Presentation aria-hidden="true" className="size-3 text-aura-primary" />
                            PPT {m.isi.slide_ppt.slide.length}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/55 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.03em] text-aura-muted ring-1 ring-inset ring-white/70">
                            <Headphones aria-hidden="true" className="size-3 text-aura-primary" />
                            Audio
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/55 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.03em] text-aura-muted ring-1 ring-inset ring-white/70">
                            <BookOpen aria-hidden="true" className="size-3 text-aura-primary" />
                            Bacaan
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/55 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.03em] text-aura-muted ring-1 ring-inset ring-white/70">
                            <Pencil aria-hidden="true" className="size-3 text-aura-primary" />
                            {m.isi.latihan.length} latihan
                          </span>
                        </div>

                        <p className="mt-auto flex items-center gap-1.5 font-body text-[11px] leading-[18px] font-medium text-aura-muted">
                          <CalendarDays aria-hidden="true" className="size-3.5" />
                          Diperbarui {FORMAT_TANGGAL.format(new Date(m.diperbaruiPada))}
                        </p>

                        <div className="grid grid-cols-2 gap-1.5 border-t border-white/60 pt-3 sm:flex sm:flex-wrap sm:items-center">
                          <Link
                            href={`/guru/modul?materi=${m.id}&kelas=${kelas.id}`}
                            className="aura-btn aura-btn-secondary h-10 px-3 text-[12px]"
                          >
                            <ArrowUpRight aria-hidden="true" className="size-3.5" />
                            Buka
                          </Link>
                          <button
                            type="button"
                            onClick={() => void unduh("pptx", m)}
                            disabled={mengunduh === `${m.id}:pptx`}
                            className="aura-btn aura-btn-secondary h-10 px-3 text-[12px] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {mengunduh === `${m.id}:pptx` ? (
                              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="size-3.5" />
                            )}
                            PPT
                          </button>
                          <button
                            type="button"
                            onClick={() => void unduh("docx", m)}
                            disabled={mengunduh === `${m.id}:docx`}
                            className="aura-btn aura-btn-secondary h-10 px-3 text-[12px] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {mengunduh === `${m.id}:docx` ? (
                              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                            ) : (
                              <Download aria-hidden="true" className="size-3.5" />
                            )}
                            Word
                          </button>
                          <button
                            type="button"
                            onClick={() => void hapus(m)}
                            disabled={sedangMenghapus}
                            aria-label={`Hapus materi ${m.judul}`}
                            className="aura-btn aura-btn-danger col-start-2 h-10 px-3 disabled:cursor-not-allowed disabled:opacity-60 sm:col-auto sm:ml-auto"
                          >
                            {sedangMenghapus ? (
                              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 aria-hidden="true" className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
