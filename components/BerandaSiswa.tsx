import Link from 'next/link';
import { Brain, CheckCircle2, ChevronRight, Clock, FileText, Library, Plus, Target } from 'lucide-react';
import { FormGabungKuis } from '@/components/FormGabungKuis';
import { IlustrasiBelajar } from '@/components/IlustrasiBelajar';
import { KartuKaca } from '@/components/KartuKaca';
import { ikonMapel, warnaMapel } from '@/components/ikon-mapel';
import { hitungPersen, labelHari, labelKelas, namaDepan, type RingkasanBeranda } from '@/lib/beranda-siswa';

type Props = { nama: string; ringkasan: RingkasanBeranda };

const LINGKARAN = 2 * Math.PI * 52;

function Donut({ benar, salah, total }: { benar: number; salah: number; total: number }) {
  const panjangBenar = total > 0 ? (LINGKARAN * benar) / total : 0;
  const panjangSalah = total > 0 ? (LINGKARAN * salah) / total : 0;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 140 140" aria-hidden="true" className="size-full -rotate-90">
        <circle cx="70" cy="70" r="52" fill="none" strokeWidth="22" className="stroke-tinta/10" />
        {panjangBenar > 0 && (
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            strokeWidth="22"
            className="stroke-sudah"
            strokeDasharray={`${panjangBenar} ${LINGKARAN - panjangBenar}`}
          />
        )}
        {panjangSalah > 0 && (
          <circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            strokeWidth="22"
            className="stroke-belum"
            strokeDasharray={`${panjangSalah} ${LINGKARAN - panjangSalah}`}
            strokeDashoffset={-panjangBenar}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[26px] leading-none font-extrabold text-aura-ink">{total}</span>
        <span className="mt-1 font-body text-[12px] leading-none text-aura-muted">Total Soal</span>
      </div>
    </div>
  );
}

export function BerandaSiswa({ nama, ringkasan }: Props) {
  const { materi, soal, totalMateri } = ringkasan;
  const sekarang = new Date();

  const kartu = [
    {
      judul: 'Materi Paham',
      nilai: String(materi.sudah),
      keterangan: `dari ${totalMateri} materi`,
      ikon: CheckCircle2,
      warna: 'bg-aura-emerald',
    },
    {
      judul: 'Akurasi Total Benar',
      nilai: `${ringkasan.akurasi}%`,
      keterangan: 'dari total jawaban',
      ikon: Target,
      warna: 'bg-aura-violet',
    },
  ];

  const bilah = [
    { label: 'Belum Paham', jumlah: materi.belum, warna: 'bg-belum' },
    { label: 'Sedang Belajar', jumlah: materi.sedang, warna: 'bg-setengah' },
    { label: 'Paham', jumlah: materi.sudah, warna: 'bg-sudah' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight text-aura-ink md:text-[32px]">
            Halo, {namaDepan(nama)}!
          </h1>
          <p className="text-aura-muted">Yuk, lanjutkan belajar dan pantau progresmu hari ini.</p>
        </div>
        <IlustrasiBelajar className="hidden h-28 w-auto shrink-0 sm:block" />
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {kartu.map(({ judul, nilai, keterangan, ikon: Ikon, warna }) => (
          <li key={judul}>
            <KartuKaca className="flex h-full items-center gap-4 p-5">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-full text-white ${warna}`}>
                <Ikon aria-hidden="true" className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] leading-normal font-medium text-aura-muted">{judul}</p>
                <p className="font-display text-[32px] leading-tight font-extrabold tracking-tight text-aura-ink">
                  {nilai}
                </p>
                <p className="text-[13px] leading-normal text-aura-muted">{keterangan}</p>
              </div>
            </KartuKaca>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <KartuKaca as="section" className="flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-aura-primary/10 text-aura-primary">
              <Brain aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-[18px] leading-snug font-bold text-aura-ink">Progres Pemahaman Materi</h2>
              <p className="text-[13px] leading-normal text-aura-muted">Tingkat pemahamanmu di setiap materi kuis.</p>
            </div>
          </div>
          <ul className="flex flex-col gap-4">
            {bilah.map(({ label, jumlah, warna }) => (
              <li key={label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[13px] leading-normal">
                  <span className="font-semibold text-aura-ink">{label}</span>
                  <span className="text-aura-muted">{jumlah} materi</span>
                </div>
                <div
                  role="img"
                  aria-label={`${label}: ${jumlah} dari ${totalMateri} materi`}
                  className="h-2.5 overflow-hidden rounded-full bg-tinta/10"
                >
                  <div className={`h-full rounded-full ${warna}`} style={{ width: `${hitungPersen(jumlah, totalMateri)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[12px] leading-normal text-aura-muted">
            Kuis yang belum kamu kerjakan dihitung sebagai Belum Paham.
          </p>
        </KartuKaca>

        <KartuKaca as="section" className="flex flex-col gap-5 p-6">
          <div>
            <h2 className="font-display text-[18px] leading-snug font-bold text-aura-ink">Rangkuman Hasil Kuis</h2>
            <p className="text-[13px] leading-normal text-aura-muted">Perbandingan jawaban benar dan salah.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Donut benar={soal.benar} salah={soal.salah} total={soal.total} />
            <ul className="flex min-w-[10rem] flex-col gap-3 text-[14px] leading-normal">
              <li className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-sudah" />
                <span className="text-aura-ink">Benar</span>
                <span className="ml-auto font-semibold text-aura-ink">
                  {soal.benar} ({hitungPersen(soal.benar, soal.total)}%)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-belum" />
                <span className="text-aura-ink">Salah</span>
                <span className="ml-auto font-semibold text-aura-ink">
                  {soal.salah} ({hitungPersen(soal.salah, soal.total)}%)
                </span>
              </li>
            </ul>
          </div>
        </KartuKaca>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="flex flex-col gap-6">
          <KartuKaca as="section" className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-[18px] leading-snug font-bold text-aura-ink">
                <span className="flex size-9 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
                  <Library aria-hidden="true" className="size-5" />
                </span>
                Mata Pelajaran Saya
              </h2>
              <Link href="/siswa/kelas" className="text-[13px] leading-normal font-semibold text-aura-primary hover:underline">
                Lihat semua →
              </Link>
            </div>

            {ringkasan.kelas.length === 0 ? (
              <p className="text-aura-muted">
                Kamu belum bergabung ke mata pelajaran mana pun. Buka{' '}
                <Link href="/siswa/kelas" className="font-semibold text-aura-primary hover:underline">
                  Mata Pelajaran
                </Link>{' '}
                lalu masukkan kode undangan dari gurumu.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {ringkasan.kelas.map((k, i) => {
                  const Ikon = ikonMapel(k.mapel);
                  const warna = warnaMapel(k.id);
                  return (
                    <li
                      key={k.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl border border-white/60 bg-white/40 p-3 sm:grid-cols-[auto_1fr_minmax(0,11rem)_auto]"
                    >
                      <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${warna.ikon}`}>
                        <Ikon aria-hidden="true" className="size-6" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15px] leading-snug font-bold text-aura-ink">{k.mapel}</p>
                        <p className="truncate text-[13px] leading-normal text-aura-muted">
                          {labelKelas(k.nama)}
                          {k.namaGuru ? ` · ${k.namaGuru}` : ''}
                        </p>
                      </div>
                      <div className="order-last col-span-3 flex flex-col gap-1 sm:order-none sm:col-span-1">
                        <p className={`text-[12px] leading-normal font-semibold ${warna.teks}`}>
                          Progres {k.progres}% · {k.dikerjakan}/{k.jumlahKuis} kuis
                        </p>
                        <div
                          role="img"
                          aria-label={`Progres ${k.mapel}: ${k.progres} persen`}
                          className="h-2 overflow-hidden rounded-full bg-tinta/10"
                        >
                          <div className={`h-full rounded-full ${warna.bilah}`} style={{ width: `${k.progres}%` }} />
                        </div>
                      </div>
                      <Link
                        href={`/siswa/kelas/detail?kelas=${k.id}`}
                        className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[13px] font-semibold ${
                          i === 0
                            ? 'bg-aura-primary text-white hover:bg-aura-primary-deep'
                            : 'bg-aura-primary/10 text-aura-primary hover:bg-aura-primary/20'
                        }`}
                      >
                        Buka Kelas
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </KartuKaca>

          <KartuKaca className="flex items-center gap-4 bg-aura-primary/10 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-aura-primary">
              <Target aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-[14px] leading-normal font-bold text-aura-primary">Terus semangat belajar!</p>
              <p className="text-[12px] leading-normal text-aura-muted">
                Setiap usaha kecil hari ini, membawa hasil besar nanti.
              </p>
            </div>
          </KartuKaca>
        </div>

        <div className="flex flex-col gap-6">
          <KartuKaca as="section" className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-aura-primary text-white">
                <Plus aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-[16px] leading-snug font-bold text-aura-ink">Masukkan Kode Quiz</h2>
                <p className="text-[13px] leading-normal text-aura-muted">Masukkan kode quiz dari gurumu untuk mulai mengerjakan.</p>
              </div>
            </div>
            <FormGabungKuis />
          </KartuKaca>

          <KartuKaca as="section" className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-[16px] leading-snug font-bold text-aura-ink">
                <span className="flex size-9 items-center justify-center rounded-full bg-aura-violet/10 text-aura-violet">
                  <Clock aria-hidden="true" className="size-5" />
                </span>
                Aktivitas Terakhir
              </h2>
              <Link href="/siswa/performa" className="text-[13px] leading-normal font-semibold text-aura-primary hover:underline">
                Lihat semua →
              </Link>
            </div>

            {ringkasan.aktivitas.length === 0 ? (
              <p className="text-aura-muted">Belum ada kuis yang kamu kerjakan.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {ringkasan.aktivitas.map((a) => (
                  <li key={`${a.sesiId}-${a.dikirimPada}`}>
                    <Link
                      href="/siswa/performa"
                      className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/40 p-3 hover:bg-white/70"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
                        <FileText aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] leading-snug font-semibold text-aura-ink">Kuis: {a.namaTopik}</p>
                        <p className="truncate text-[12px] leading-normal text-aura-muted">
                          {a.mapel} · {a.skor} dari {a.total} soal benar
                        </p>
                      </div>
                      <span className="shrink-0 text-[12px] leading-normal text-aura-muted">
                        {labelHari(a.dikirimPada, sekarang)}
                      </span>
                      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-aura-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </KartuKaca>
        </div>
      </div>
    </div>
  );
}
