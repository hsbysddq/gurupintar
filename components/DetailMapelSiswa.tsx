'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ClipboardList, History, PlayCircle, type LucideIcon } from 'lucide-react';
import { IKON_MAPEL, kunciIkonMapel, warnaMapel } from '@/components/ikon-mapel';
import { KartuKaca } from '@/components/KartuKaca';
import { labelKelas } from '@/lib/beranda-siswa';
import {
  DAFTAR_TAB,
  formatTanggalKartu,
  type DetailMapel,
  type ItemHistori,
  type ItemKuis,
  type ItemMateri,
  type KelasDetail,
  type TabMapel,
} from '@/lib/detail-mapel';

type Props = { kelas: KelasDetail; detail: DetailMapel; tabAwal?: TabMapel };

const IKON_TAB: Record<TabMapel, LucideIcon> = {
  materi: BookOpen,
  kuis: ClipboardList,
  histori: History,
};

const LINK_AKSI = 'inline-flex min-h-11 items-center text-[14px] leading-normal font-semibold text-aura-primary hover:underline';
const TEKS_REDUP = 'text-[14px] leading-normal text-aura-muted';

function Kosong({ judul, isi }: { judul: string; isi: string }) {
  return (
    <KartuKaca as="section" className="flex flex-col gap-1 p-6">
      <h2 className="font-display text-[16px] leading-snug font-bold text-aura-ink">{judul}</h2>
      <p className="text-aura-muted">{isi}</p>
    </KartuKaca>
  );
}

/** Kartu satu entri feed ala Classroom: ikon bulat, judul, tanggal, lalu garis dan baris aksi di bawahnya. */
function KartuFeed({
  ikon: Ikon,
  judul,
  tanggal,
  lencana,
  children,
}: {
  ikon: LucideIcon;
  judul: string;
  tanggal: string;
  lencana?: ReactNode;
  children: ReactNode;
}) {
  return (
    <KartuKaca as="article" className="overflow-hidden">
      <div className="flex items-start gap-4 p-4 md:p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primer-lembut text-primer-hover">
          <Ikon aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[16px] leading-snug font-semibold break-words text-aura-ink">{judul}</h3>
          <p className={TEKS_REDUP}>{tanggal}</p>
        </div>
        {lencana}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 border-t border-tinta/10 px-4 md:px-5">
        {children}
      </div>
    </KartuKaca>
  );
}

function Lencana({ aktif, children }: { aktif?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] leading-normal font-semibold ${
        aktif ? 'bg-primer-lembut text-primer' : 'bg-tinta/5 text-tinta-lembut'
      }`}
    >
      {children}
    </span>
  );
}

function PanelMateri({ daftar }: { daftar: ItemMateri[] }) {
  if (daftar.length === 0) {
    return (
      <Kosong
        judul="Belum ada materi"
        isi="Materi muncul di sini setelah kamu mengerjakan kuis dan gurumu membagikannya."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {daftar.map((m) => (
        <li key={m.sesiId}>
          <KartuFeed
            ikon={BookOpen}
            judul={`Materi: ${m.judul}`}
            tanggal={formatTanggalKartu(m.tanggal)}
            lencana={m.status === 'disiapkan' ? <Lencana>Disiapkan</Lencana> : undefined}
          >
            {m.href ? (
              <Link href={m.href} className={LINK_AKSI}>
                Buka materi →
              </Link>
            ) : (
              <p className={`${TEKS_REDUP} py-3`}>Materi untukmu sedang disiapkan gurumu.</p>
            )}
          </KartuFeed>
        </li>
      ))}
    </ul>
  );
}

function PanelKuis({ daftar }: { daftar: ItemKuis[] }) {
  if (daftar.length === 0) {
    return <Kosong judul="Belum ada kuis" isi="Kuis dari gurumu akan muncul di sini." />;
  }
  return (
    <ul className="flex flex-col gap-4">
      {daftar.map((k) => {
        const skorTerakhir = k.skor !== null && k.total !== null ? `${k.skor} dari ${k.total} soal benar` : '';
        // Kuis yang dikerjakan ulang menampilkan jumlah pengerjaan; semua hasilnya ada di tab Histori.
        const skor =
          k.jumlahPengerjaan > 1 ? `Dikerjakan ${k.jumlahPengerjaan}× · terakhir ${skorTerakhir}` : `Sudah dikerjakan · ${skorTerakhir}`;
        const aktif = k.status === 'aktif-belum' || k.status === 'aktif-selesai';
        return (
          <li key={k.sesiId}>
            <KartuFeed
              ikon={ClipboardList}
              judul={`${aktif ? 'Kuis baru' : 'Kuis'}: ${k.judul}`}
              tanggal={formatTanggalKartu(k.tanggal)}
              lencana={<Lencana aktif={aktif}>{aktif ? 'Aktif' : 'Selesai'}</Lencana>}
            >
              {k.status === 'aktif-belum' && k.hrefKerjakan && (
                <Link href={k.hrefKerjakan} className={LINK_AKSI}>
                  Kerjakan kuis →
                </Link>
              )}
              {k.status === 'aktif-selesai' && (
                <>
                  <p className={`${TEKS_REDUP} py-3`}>{skor}</p>
                  {k.hrefKerjakan && (
                    <Link href={k.hrefKerjakan} className={LINK_AKSI}>
                      Kerjakan ulang
                    </Link>
                  )}
                </>
              )}
              {k.status === 'selesai-dikerjakan' && <p className={`${TEKS_REDUP} py-3`}>{skor}</p>}
              {k.status === 'selesai-tidak' && (
                <p className={`${TEKS_REDUP} py-3`}>Kamu belum mengerjakan kuis ini.</p>
              )}
            </KartuFeed>
          </li>
        );
      })}
    </ul>
  );
}

function PanelHistori({ detail }: { detail: DetailMapel }) {
  const { ringkasan, histori } = detail;
  if (histori.length === 0) {
    return <Kosong judul="Belum ada hasil kuis" isi="Hasil kuis yang sudah kamu kerjakan akan tercatat di sini." />;
  }
  const ringkas = [
    { label: 'Total pengerjaan', nilai: String(ringkasan.jumlahKuis) },
    { label: 'Rata-rata', nilai: ringkasan.rataRata === null ? '–' : `${ringkasan.rataRata}%` },
    { label: 'Terbaik', nilai: ringkasan.terbaik === null ? '–' : `${ringkasan.terbaik}%` },
  ];
  return (
    <div className="flex flex-col gap-4">
      <KartuKaca as="section" className="flex flex-col gap-3 p-4 md:p-5">
        <dl className="grid grid-cols-3 gap-3">
          {ringkas.map((r) => (
            <div key={r.label} className="flex flex-col gap-0.5">
              <dt className="text-[12px] leading-normal font-medium text-aura-muted">{r.label}</dt>
              <dd className="font-display text-[24px] leading-tight font-extrabold tracking-tight text-aura-ink">
                {r.nilai}
              </dd>
            </div>
          ))}
        </dl>
        <p className={TEKS_REDUP}>{detail.tren}</p>
      </KartuKaca>

      <ul className="flex flex-col gap-4">
        {histori.map((h: ItemHistori) => (
          <li key={`${h.sesiId}-${h.tanggal}`}>
            <KartuFeed
              ikon={History}
              judul={`Hasil kuis: ${h.judul}`}
              tanggal={formatTanggalKartu(h.tanggal)}
              lencana={<Lencana aktif>{h.persen}%</Lencana>}
            >
              <div className="flex w-full flex-col gap-2 py-3">
                <p className={TEKS_REDUP}>
                  {h.skor} dari {h.total} soal benar · pengerjaan ke-{h.pengerjaanKe}
                </p>
                <div
                  role="img"
                  aria-label={`Nilai ${h.persen} persen`}
                  className="h-2 overflow-hidden rounded-full bg-tinta/10"
                >
                  <div className="h-full rounded-full bg-aura-primary" style={{ width: `${h.persen}%` }} />
                </div>
              </div>
            </KartuFeed>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Halaman satu mata pelajaran, mengikuti Google Classroom: banner, tombol aksi di bawahnya, daftar kartu,
 * dan tiga tab (bilah bawah di HP, deretan tombol di layar lebar). Tab dipindah tanpa memuat ulang halaman.
 */
export function DetailMapelSiswa({ kelas, detail, tabAwal = 'materi' }: Props) {
  const [tab, setTab] = useState<TabMapel>(tabAwal);
  const Ikon = IKON_MAPEL[kunciIkonMapel(kelas.mapel)];
  const warna = warnaMapel(kelas.id);

  return (
    <div className="flex flex-col gap-4 pb-24 md:pb-0">
      <div>
        <Link
          href="/siswa/kelas"
          className="inline-flex min-h-11 items-center gap-1.5 text-[13px] leading-normal font-semibold text-aura-muted hover:text-aura-primary"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Mata Pelajaran
        </Link>
      </div>

      <section
        aria-labelledby="judul-mapel"
        className={`relative min-h-40 overflow-hidden rounded-[28px] bg-gradient-to-br ${warna.banner} p-6 text-white md:min-h-52 md:p-8`}
      >
        <div className="relative z-10 flex max-w-[75%] flex-col gap-1.5">
          <h1
            id="judul-mapel"
            className="font-display text-[28px] leading-tight font-extrabold tracking-tight break-words md:text-[40px]"
          >
            {kelas.mapel}
          </h1>
          <p className="text-[15px] leading-normal text-white/90 md:text-[17px]">
            {labelKelas(kelas.nama)}
            {kelas.namaGuru ? ` · ${kelas.namaGuru}` : ''}
          </p>
        </div>
        <Ikon
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -bottom-8 size-44 rotate-12 text-white/15 md:-right-2 md:size-64"
        />
      </section>

      {detail.kuisAktif && (
        <Link
          href={detail.kuisAktif.href}
          className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-primer-lembut px-6 text-[15px] font-semibold text-primer-hover hover:bg-primer/20"
        >
          <PlayCircle aria-hidden="true" className="size-5 shrink-0" />
          <span className="truncate">Kerjakan kuis aktif: {detail.kuisAktif.judul}</span>
        </Link>
      )}

      <nav
        aria-label="Bagian mata pelajaran"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/90 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
      >
        <div role="tablist" className="mx-auto grid max-w-md grid-cols-3 md:mx-0 md:flex md:max-w-none md:gap-2">
          {DAFTAR_TAB.map(({ id, label }) => {
            const aktif = tab === id;
            const IkonTab = IKON_TAB[id];
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={aktif}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={`flex min-h-12 flex-col items-center gap-1 text-[13px] leading-tight font-semibold transition-colors md:flex-row md:gap-2 md:rounded-full md:px-5 md:text-[15px] ${
                  aktif ? 'text-aura-ink md:bg-primer-lembut' : 'text-aura-muted md:hover:bg-white/70'
                }`}
              >
                <span
                  className={`flex h-8 w-16 items-center justify-center rounded-full md:h-auto md:w-auto ${
                    aktif ? 'bg-primer-lembut text-primer-hover md:bg-transparent' : ''
                  }`}
                >
                  <IkonTab aria-hidden="true" className="size-6 md:size-5" />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'materi' && <PanelMateri daftar={detail.materi} />}
        {tab === 'kuis' && <PanelKuis daftar={detail.kuis} />}
        {tab === 'histori' && <PanelHistori detail={detail} />}
      </div>
    </div>
  );
}
